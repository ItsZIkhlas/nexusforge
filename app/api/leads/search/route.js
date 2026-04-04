import { createClient } from '@/lib/supabase/server'
import { PLANS, TRIAL_LIMITS } from '@/lib/stripe'

const SERPER_BASE = 'https://google.serper.dev'

// ── Per-platform config ───────────────────────────────────────────────────────

const PLATFORMS = {
  linkedin: {
    site:     'site:linkedin.com/in',
    filterFn: url => /linkedin\.com\/in\//i.test(url),
  },
  instagram: {
    site:     'site:instagram.com',
    filterFn: url => /instagram\.com\/[^/?#]+\/?$/i.test(url),
  },
  facebook: {
    site:     'site:facebook.com',
    filterFn: url => /facebook\.com\//i.test(url),
  },
  twitter: {
    site:     '(site:twitter.com OR site:x.com)',
    filterFn: url => /(twitter|x)\.com\/[^/?#]+\/?$/i.test(url),
  },
}

// ── Result parsers ────────────────────────────────────────────────────────────

function parseLinkedInResult(item, index) {
  const url      = (item.link    ?? '').trim()
  const rawTitle = (item.title   ?? '').trim()
  const snippet  = (item.snippet ?? '').trim()

  const title = rawTitle.replace(/\s*\|\s*LinkedIn\s*$/i, '').trim()

  let name = '', jobTitle = '', company = ''

  // Pattern A: "Name - Title at Company"
  const mA = title.match(/^(.+?)\s+[-–]\s+(.+?)\s+at\s+(.+)$/i)
  if (mA) {
    name = mA[1].trim(); jobTitle = mA[2].trim(); company = mA[3].trim()
  } else {
    // Pattern B: "Name - Title | Company"
    const mB = title.match(/^(.+?)\s+[-–]\s+(.+?)\s*\|\s*(.+)$/)
    if (mB) {
      name = mB[1].trim(); jobTitle = mB[2].trim(); company = mB[3].trim()
    } else {
      const parts = title.split(/\s*[-–|]\s+/)
      name = parts[0]?.trim() ?? title; jobTitle = parts[1]?.trim() ?? ''; company = parts[2]?.trim() ?? ''
    }
  }

  const nParts     = name.trim().split(/\s+/)
  const first_name = nParts[0] ?? ''
  const last_name  = nParts.slice(1).join(' ')

  let city = '', state = '', country = ''
  const locMatch = snippet.match(/^([^·•\n]{3,70}?)(?:\s*[·•]\s*)/)
  if (locMatch) {
    const raw = locMatch[1].trim()
    if (raw.length < 70 && !/https?:\/\/|linkedin/i.test(raw)) {
      const lp = raw.split(/,\s*/)
      city = lp[0]?.trim() ?? ''; state = lp[1]?.trim() ?? ''; country = lp[2]?.trim() ?? ''
    }
  }

  const handle = url.match(/linkedin\.com\/in\/([^/?#]+)/)?.[1] ?? `s${index}`

  return {
    apollo_id: handle,
    platform: 'linkedin',
    profile_url: url,
    first_name, last_name,
    name: name || `${first_name} ${last_name}`.trim(),
    title: jobTitle, email: null, email_status: null,
    linkedin_url: url || null, photo_url: null,
    city, state, country,
    company, company_website: '', company_industry: '', company_size: null, company_logo: null,
  }
}

function parseInstagramResult(item, index) {
  const url     = (item.link    ?? '').trim()
  const rawTitle = (item.title  ?? '').trim()
  const snippet  = (item.snippet ?? '').trim()

  // Handle: "username • Instagram photos and videos"
  // or: "Name (@username) • Instagram"
  const handle = url.match(/instagram\.com\/([^/?#]+)/)?.[1] ?? ''
  const cleanTitle = rawTitle.replace(/\s*[•·]\s*Instagram.*$/i, '').trim()

  // Try "Name (@handle)" pattern
  const nameHandleMatch = cleanTitle.match(/^(.+?)\s*\(@?[\w.]+\)$/)
  const name = nameHandleMatch ? nameHandleMatch[1].trim() : (cleanTitle || handle)

  const nParts = name.split(/\s+/)

  return {
    apollo_id:   handle || `ig${index}`,
    platform:    'instagram',
    profile_url: url,
    first_name:  nParts[0] ?? handle,
    last_name:   nParts.slice(1).join(' '),
    name,
    title:       '',
    email:       null, email_status: null,
    linkedin_url: null, photo_url: null,
    city: '', state: '', country: '',
    company: '', company_website: '', company_industry: '', company_size: null, company_logo: null,
    snippet,
  }
}

function parseFacebookResult(item, index) {
  const url      = (item.link    ?? '').trim()
  const rawTitle = (item.title   ?? '').trim()
  const snippet  = (item.snippet ?? '').trim()

  // Handle: "Name | Facebook" or "Name - About | Facebook"
  const clean = rawTitle.replace(/\s*[|\-]\s*(About\s*[|\-]\s*)?Facebook\s*$/i, '').trim()
  const name  = clean || (url.match(/facebook\.com\/([^/?#]+)/)?.[1] ?? '')

  const nParts = name.split(/\s+/)

  return {
    apollo_id:   name.replace(/\s+/g, '_').toLowerCase() || `fb${index}`,
    platform:    'facebook',
    profile_url: url,
    first_name:  nParts[0] ?? '',
    last_name:   nParts.slice(1).join(' '),
    name,
    title:       '',
    email:       null, email_status: null,
    linkedin_url: null, photo_url: null,
    city: '', state: '', country: '',
    company: '', company_website: '', company_industry: '', company_size: null, company_logo: null,
    snippet,
  }
}

function parseTwitterResult(item, index) {
  const url      = (item.link    ?? '').trim()
  const rawTitle = (item.title   ?? '').trim()
  const snippet  = (item.snippet ?? '').trim()

  // Handle: "Name (@handle) on X" or "Name (@handle) | Twitter"
  const clean   = rawTitle.replace(/\s*(?:on X|\|\s*Twitter)\s*$/i, '').trim()
  const tMatch  = clean.match(/^(.+?)\s*\(@?([\w]+)\)$/)
  const name    = tMatch ? tMatch[1].trim() : clean
  const tHandle = tMatch ? tMatch[2] : (url.match(/(?:twitter|x)\.com\/([^/?#]+)/)?.[1] ?? '')

  const nParts = name.split(/\s+/)

  return {
    apollo_id:   tHandle || `tw${index}`,
    platform:    'twitter',
    profile_url: url,
    first_name:  nParts[0] ?? tHandle,
    last_name:   nParts.slice(1).join(' '),
    name:        name || tHandle,
    title:       snippet.split('\n')[0]?.slice(0, 100) ?? '',   // bio as title
    email:       null, email_status: null,
    linkedin_url: null, photo_url: null,
    city: '', state: '', country: '',
    company: '', company_website: '', company_industry: '', company_size: null, company_logo: null,
    snippet,
  }
}

function parseResult(item, index, platform) {
  switch (platform) {
    case 'instagram': return parseInstagramResult(item, index)
    case 'facebook':  return parseFacebookResult(item, index)
    case 'twitter':   return parseTwitterResult(item, index)
    default:          return parseLinkedInResult(item, index)
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey || apiKey === 'your_serper_api_key') {
    return Response.json(
      { error: 'SERPER_API_KEY not configured in .env.local' },
      { status: 503 }
    )
  }

  let { data: org } = await supabase
    .from('organizations')
    .select('id, plan_id, lead_credits_used, lead_credits_reset_at')
    .eq('owner_id', user.id)
    .single()

  if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })

  // ── Hourly search rate limit ──────────────────────────────────────────────
  const plan         = PLANS[org.plan_id] ?? TRIAL_LIMITS
  const hourlyLimit  = plan.searchesPerHour ?? 20
  const oneHourAgo   = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentSearches } = await supabase
    .from('lead_searches')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org.id)
    .gte('created_at', oneHourAgo)
  if ((recentSearches ?? 0) >= hourlyLimit) {
    return Response.json(
      { error: `Search rate limit reached. Your plan allows ${hourlyLimit} searches per hour. Try again shortly.` },
      { status: 429 }
    )
  }

  // Monthly credit reset
  if (org.lead_credits_reset_at && new Date(org.lead_credits_reset_at) <= new Date()) {
    const next = new Date()
    next.setMonth(next.getMonth() + 1)
    next.setDate(1)
    next.setHours(0, 0, 0, 0)

    const { data: updated } = await supabase
      .from('organizations')
      .update({ lead_credits_used: 0, lead_credits_reset_at: next.toISOString() })
      .eq('id', org.id)
      .select('id, plan_id, lead_credits_used, lead_credits_reset_at')
      .single()

    if (updated) org = updated
  }

  const {
    keyword     = '',
    titles      = [],
    location    = '',
    industry    = '',
    companySize = '',
    platform    = 'linkedin',
    page        = 1,
  } = await request.json()

  if (!keyword.trim() && !location.trim() && titles.length === 0 && !industry.trim()) {
    return Response.json({ error: 'Provide at least one search filter' }, { status: 400 })
  }

  const platformCfg = PLATFORMS[platform] ?? PLATFORMS.linkedin

  // ── Build Google query ────────────────────────────────────────────────────
  const parts = [platformCfg.site]

  if (titles.length > 0) {
    parts.push(
      titles.length === 1
        ? `"${titles[0]}"`
        : `(${titles.map(t => `"${t}"`).join(' OR ')})`
    )
  }

  if (keyword.trim())  parts.push(`"${keyword.trim()}"`)
  if (location.trim()) parts.push(`"${location.trim()}"`)
  if (industry.trim()) parts.push(industry.trim())

  // Company size hints (LinkedIn only — meaningful signal)
  if (platform === 'linkedin') {
    const sizeHints = {
      '1-10':   '(startup OR "self-employed" OR founder)',
      '11-50':  '(startup OR "small business")',
      '51-200': '"growing company"',
      '1000+':  '(enterprise OR corporation OR "Fortune 500")',
    }
    const hint = companySize ? sizeHints[companySize] : null
    if (hint) parts.push(hint)
  }

  const q = parts.join(' ')

  // ── Call Serper ───────────────────────────────────────────────────────────
  let serperData
  try {
    const res = await fetch(`${SERPER_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
      body: JSON.stringify({ q, num: 10, page }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('Serper error:', res.status, text)
      return Response.json({ error: `Search failed (${res.status})` }, { status: 502 })
    }

    serperData = await res.json()
  } catch (err) {
    console.error('Serper fetch failed:', err)
    return Response.json({ error: 'Failed to reach search API' }, { status: 502 })
  }

  // ── Parse results ─────────────────────────────────────────────────────────
  const organic = (serperData.organic ?? []).filter(
    item => platformCfg.filterFn(item.link ?? '')
  )

  const results = organic.map((item, i) => parseResult(item, i, platform))

  // Log search asynchronously
  supabase.from('lead_searches').insert({
    org_id:        org.id,
    query:         { keyword, titles, location, industry, companySize, platform, page },
    results_count: results.length,
    credits_used:  0,
  }).then(() => {}).catch(() => {})

  const rawTotal   = serperData.searchInformation?.totalResults
  const total      = rawTotal
    ? Math.min(parseInt(rawTotal, 10), 100)
    : results.length < 10 ? results.length : results.length * 3
  const totalPages = Math.max(1, Math.ceil(total / 10))

  return Response.json({
    results,
    pagination: { page, per_page: 10, total, total_pages: totalPages },
  })
}
