import { createClient } from '@/lib/supabase/server'
import { groq, DEFAULT_MODEL } from '@/lib/groq'

async function getOrgId(supabase, userId) {
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .single()
  return data?.id ?? null
}

// Returns the Monday date of the current week as a YYYY-MM-DD string
function getWeekMonday() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().slice(0, 10)
}

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getOrgId(supabase, user.id)
    if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

    // Load brand profile
    const { data: brand } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle()

    if (!brand?.business_name) {
      return Response.json({ error: 'Complete your brand profile first.' }, { status: 400 })
    }

    const platforms = brand.platforms ?? []
    if (platforms.length === 0) {
      return Response.json({ error: 'Select at least one platform in your brand profile.' }, { status: 400 })
    }

    const weekOf       = getWeekMonday()
    const postsPerWeek = brand.posts_per_week ?? { linkedin: 2, tiktok: 3 }

    // Delete any existing pending posts for this week (allow regenerating)
    await supabase
      .from('content_posts')
      .delete()
      .eq('org_id', orgId)
      .eq('week_of', weekOf)
      .eq('status', 'pending')

    const brandContext = buildBrandContext(brand)
    const allPosts = []

    // Generate for each platform in parallel
    await Promise.all(platforms.map(async (platform) => {
      const count = postsPerWeek[platform] ?? 2
      const posts = await generatePostsForPlatform(platform, count, brandContext)
      allPosts.push(...posts.map(p => ({
        org_id:   orgId,
        platform,
        body:     p.body,
        hashtags: p.hashtags ?? null,
        status:   'pending',
        week_of:  weekOf,
      })))
    }))

    if (allPosts.length === 0) {
      return Response.json({ error: 'Failed to generate posts. Please try again.' }, { status: 500 })
    }

    const { data: saved, error } = await supabase
      .from('content_posts')
      .insert(allPosts)
      .select()

    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json({ posts: saved, count: saved.length })
  } catch (e) {
    console.error('[content/generate]', e)
    return Response.json({ error: e.message ?? 'Generation failed' }, { status: 500 })
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildBrandContext(brand) {
  return `
Business: ${brand.business_name}
Industry: ${brand.industry ?? 'Not specified'}
What they do: ${brand.description ?? 'Not specified'}
Target audience: ${brand.audience ?? 'Not specified'}
Tone: ${brand.tone ?? 'professional'}
${brand.keywords_include?.length ? `Always include these words/themes: ${brand.keywords_include.join(', ')}` : ''}
${brand.keywords_exclude?.length ? `Never use these words: ${brand.keywords_exclude.join(', ')}` : ''}
${brand.content_pillars?.length ? `Content pillars (topics to tie posts back to): ${brand.content_pillars.join(', ')}` : ''}
${brand.positioning ? `Brand positioning: ${brand.positioning}` : ''}
${brand.brand_mission ? `Brand mission: ${brand.brand_mission}` : ''}
`.trim()
}

async function generatePostsForPlatform(platform, count, brandContext) {
  const systemPrompt = platform === 'linkedin'
    ? `You are a LinkedIn content strategist who writes high-performing posts for business owners.

Writing rules for LinkedIn:
- Start with a strong hook (a bold statement, question, or surprising fact) — never start with "I"
- Use short paragraphs (1-3 lines max) with line breaks between them
- Include a concrete insight, story, tip, or perspective — not generic fluff
- End with a question or clear CTA to drive comments
- Length: 150-250 words
- NO hashtags (LinkedIn algorithm penalises them)
- Each post should have a different angle: mix educational, story-based, opinion, and behind-the-scenes

Return a JSON array of ${count} post objects. Format:
[{ "body": "full post text" }, ...]
Return ONLY the JSON array, no markdown.`

    : `You are a TikTok content strategist who writes engaging captions for business accounts.

Writing rules for TikTok:
- First line is the hook (the first 1-2 seconds of attention — make it urgent or surprising)
- Keep it short, punchy, and conversational — this is video caption text
- Include a clear CTA (follow for more, comment below, link in bio, etc.)
- End with 3-6 relevant trending hashtags
- Length: 30-80 words + hashtags
- Each caption should have a different angle: trends, behind the scenes, quick tips, challenges, product/service highlight

Return a JSON array of ${count} post objects. Format:
[{ "body": "caption text without hashtags", "hashtags": "#tag1 #tag2 #tag3" }, ...]
Return ONLY the JSON array, no markdown.`

  const completion = await groq.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.8,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: `Brand context:\n${brandContext}\n\nGenerate ${count} ${platform} posts for this week. Make each post distinct and genuinely valuable.` },
    ],
  })

  let raw = completion.choices[0]?.message?.content?.trim() ?? '[]'
  raw = raw.replace(/^```[\w]*\s*/i, '').replace(/\s*```$/, '').trim()

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    console.error('[generate] JSON parse failed:', raw)
    return []
  }
}
