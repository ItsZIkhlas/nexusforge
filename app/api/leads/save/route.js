import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe'

// ── Snov.io email enrichment ──────────────────────────────────────────────────
// Snov.io uses OAuth client credentials — cache the token in module scope
// so we only re-fetch when it expires (1 hour TTL).

let _snovToken = null
let _snovTokenExp = 0

async function getSnovToken() {
  if (_snovToken && Date.now() < _snovTokenExp) return _snovToken

  const clientId     = process.env.SNOV_CLIENT_ID
  const clientSecret = process.env.SNOV_CLIENT_SECRET
  if (!clientId || clientId === 'your_snov_client_id') return null

  try {
    const res = await fetch('https://api.snov.io/v1/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type:    'client_credentials',
        client_id:     clientId,
        client_secret: clientSecret,
      }),
    })
    if (!res.ok) return null
    const json = await res.json()
    if (!json.access_token) return null

    _snovToken    = json.access_token
    _snovTokenExp = Date.now() + (json.expires_in ?? 3600) * 1000 - 60_000  // 1 min buffer
    return _snovToken
  } catch {
    return null
  }
}

/**
 * Guess a company's domain from its display name.
 * e.g. "Stripe" → "stripe.com", "TechCorp LLC" → "techcorp.com"
 * ~50% accurate for well-known companies — good enough for a best-effort enrichment.
 */
function guessCompanyDomain(company) {
  if (!company) return null
  const clean = company
    .toLowerCase()
    .replace(/\b(inc\.?|llc\.?|ltd\.?|corp\.?|co\.?|pty\.?|plc\.?|limited|group|holding[s]?|technologies|tech|solutions|services|international|global|digital|ventures|labs|studio[s]?)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
  return clean.length >= 2 ? `${clean}.com` : null
}

/**
 * Try to find a work email via Snov.io (free: 50/mo, Gmail signup OK).
 * Returns the email string on success, null on any failure (always silent).
 */
async function findEmailViaSnov(firstName, lastName, company) {
  if (!firstName || !lastName || !company) return null

  const domain = guessCompanyDomain(company)
  if (!domain) return null

  const token = await getSnovToken()
  if (!token) return null

  try {
    const res = await fetch('https://api.snov.io/v1/get-emails-from-names', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: token,
        firstName,
        lastName,
        domain,
      }),
    })
    if (!res.ok) return null
    const json = await res.json()
    // Response: { data: [{ email, confidence }] }
    const emails = json?.data ?? []
    return emails[0]?.email ?? null
  } catch {
    return null  // Never block a save due to enrichment failure
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let { data: org } = await supabase
    .from('organizations')
    .select('id, plan_id, lead_credits_used, lead_credits_reset_at')
    .eq('owner_id', user.id)
    .single()

  if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })

  // Handle monthly reset before checking balance
  if (org.lead_credits_reset_at && new Date(org.lead_credits_reset_at) <= new Date()) {
    const nextReset = new Date()
    nextReset.setMonth(nextReset.getMonth() + 1)
    nextReset.setDate(1)
    nextReset.setHours(0, 0, 0, 0)

    const { data: updated } = await supabase
      .from('organizations')
      .update({ lead_credits_used: 0, lead_credits_reset_at: nextReset.toISOString() })
      .eq('id', org.id)
      .select('id, plan_id, lead_credits_used, lead_credits_reset_at')
      .single()

    if (updated) org = updated
  }

  // Check credit balance
  const plan      = PLANS[org.plan_id] ?? PLANS.starter
  const used      = org.lead_credits_used ?? 0
  const remaining = plan.leadCredits - used

  if (remaining <= 0) {
    return Response.json(
      { error: `You've used all ${plan.leadCredits} lead credits for this month. Upgrade your plan or wait for the monthly reset.` },
      { status: 403 }
    )
  }

  const {
    first_name, last_name, email: rawEmail, title, linkedin_url,
    company, company_website, city, state, country, apollo_id,
  } = await request.json()

  // ── Snov.io email enrichment ─────────────────────────────────────────────
  // If no email came in from the search result, try Snov.io now.
  let email         = rawEmail ?? null
  let emailEnriched = false
  if (!email && first_name && last_name && company) {
    const found = await findEmailViaSnov(first_name, last_name, company)
    if (found) {
      email         = found
      emailEnriched = true
    }
  }

  // ── Duplicate check ──────────────────────────────────────────────────────
  if (email) {
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('org_id', org.id)
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return Response.json({ contact: existing, creditUsed: false, creditsRemaining: remaining })
    }
  }

  // ── Enforce contact plan limit ───────────────────────────────────────────
  if (plan.maxContacts !== Infinity) {
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id)

    if (count >= plan.maxContacts) {
      return Response.json(
        { error: `Contact limit reached (${plan.maxContacts.toLocaleString()} on ${plan.name} plan). Upgrade to save more.` },
        { status: 403 }
      )
    }
  }

  // ── Insert contact ───────────────────────────────────────────────────────
  const locationParts = [city, state, country].filter(Boolean)
  const notes = locationParts.length ? `Location: ${locationParts.join(', ')}` : ''

  const { data: newContact, error } = await supabase
    .from('contacts')
    .insert({
      org_id:       org.id,
      first_name:   first_name ?? '',
      last_name:    last_name  ?? '',
      email:        email?.toLowerCase() ?? '',
      company:      company ?? '',
      job_title:    title ?? '',
      linkedin_url: linkedin_url ?? '',
      website:      company_website ?? '',
      status:       'lead',
      source:       'lead_finder',
      notes,
      tags:         [],
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })

  // ── Activity log ─────────────────────────────────────────────────────────
  const activityNote = [
    'Imported from Lead Finder',
    apollo_id     ? `(source ID: ${apollo_id})`   : null,
    emailEnriched ? '· email found via Snov.io'   : null,
  ].filter(Boolean).join(' ')

  await supabase.from('contact_activities').insert({
    contact_id: newContact.id,
    type:       'note',
    content:    activityNote,
  })

  // ── Deduct 1 credit ──────────────────────────────────────────────────────
  await supabase
    .from('organizations')
    .update({ lead_credits_used: used + 1 })
    .eq('id', org.id)

  return Response.json({
    contact:          newContact,
    creditUsed:       true,
    creditsRemaining: remaining - 1,
    emailEnriched,
  }, { status: 201 })
}
