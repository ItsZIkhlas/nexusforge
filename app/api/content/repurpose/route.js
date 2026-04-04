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

function buildBrandContext(brand) {
  return `
Business: ${brand.business_name}
Industry: ${brand.industry ?? 'Not specified'}
What they do: ${brand.description ?? 'Not specified'}
Target audience: ${brand.audience ?? 'Not specified'}
Tone: ${brand.tone ?? 'professional'}
${brand.keywords_include?.length ? `Always include these words/themes: ${brand.keywords_include.join(', ')}` : ''}
${brand.keywords_exclude?.length ? `Never use these words: ${brand.keywords_exclude.join(', ')}` : ''}
`.trim()
}

// ── Platform generation helpers ───────────────────────────────────────────────

async function repurposeForLinkedIn(originalBody, originalHashtags, brandContext) {
  const systemPrompt = `You are a LinkedIn content strategist who repurposes content into high-performing LinkedIn posts.

Writing rules for LinkedIn:
- Start with a strong hook (bold statement, question, or surprising fact) — never start with "I"
- Use short paragraphs (1-3 lines max) with line breaks between them
- Include a concrete insight, story, tip, or perspective — not generic fluff
- End with a question or clear CTA to drive comments
- Length: 150-250 words
- NO hashtags — LinkedIn algorithm penalises them
- Adapt the core idea for a professional B2B audience; do not simply copy-paste

Return a JSON object. Format:
{ "body": "full post text" }
Return ONLY the JSON object, no markdown fences.`

  const userMessage = `Brand context:\n${brandContext}\n\nOriginal post to repurpose:\n${originalBody}${originalHashtags ? `\n${originalHashtags}` : ''}\n\nAdapt this content for LinkedIn. Keep the core idea but rewrite it to suit the platform format described above.`

  return callGroq(systemPrompt, userMessage)
}

async function repurposeForInstagram(originalBody, originalHashtags, brandContext) {
  const systemPrompt = `You are an Instagram content strategist who repurposes content into engaging captions.

Writing rules for Instagram:
- First line is the hook (people see this before "more" — make it compelling)
- Keep it conversational and on-brand
- Include a clear CTA (link in bio, comment below, DM us, etc.)
- Length: 80-150 words (body only, not counting hashtags)
- End with 5-8 relevant hashtags
- Adapt the core idea for Instagram's audience; do not simply copy-paste

Return a JSON object. Format:
{ "body": "caption text without hashtags", "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5" }
Return ONLY the JSON object, no markdown fences.`

  const userMessage = `Brand context:\n${brandContext}\n\nOriginal post to repurpose:\n${originalBody}${originalHashtags ? `\n${originalHashtags}` : ''}\n\nAdapt this content for Instagram. Keep the core idea but rewrite it to suit the platform format described above.`

  return callGroq(systemPrompt, userMessage)
}

async function repurposeForTikTok(originalBody, originalHashtags, brandContext) {
  const systemPrompt = `You are a TikTok content strategist who repurposes content into spoken-word video scripts.

Writing rules for TikTok scripts:
- Format as a spoken-word script using exactly these three labeled sections:
  [HOOK] — 1-2 punchy sentences to grab attention in the first 3 seconds
  [MAIN] — The core value/story in short, punchy sentences (avoid long paragraphs)
  [CTA] — A clear, energetic call-to-action to follow, comment, or share
- Total script length: 60-90 seconds when read aloud (approximately 130-200 words)
- Use conversational, energetic language — write how people talk, not how they write
- Short sentences. No jargon. High energy.
- Adapt the core idea for TikTok's younger, fast-moving audience

Return a JSON object. Format:
{ "body": "[HOOK]\n...\n\n[MAIN]\n...\n\n[CTA]\n..." }
Return ONLY the JSON object, no markdown fences.`

  const userMessage = `Brand context:\n${brandContext}\n\nOriginal post to repurpose:\n${originalBody}${originalHashtags ? `\n${originalHashtags}` : ''}\n\nAdapt this content into a TikTok video script. Keep the core idea but rewrite it as a spoken-word script using the [HOOK] → [MAIN] → [CTA] structure.`

  return callGroq(systemPrompt, userMessage)
}

async function repurposeForEmail(originalBody, originalHashtags, brandContext) {
  const systemPrompt = `You are an email marketing specialist who repurposes social content into polished newsletter intros.

Writing rules for email newsletter intros:
- Open with a warm, direct sentence that draws the reader in
- Personable but structured — professional without being stiff
- Include the core value from the original post
- End with a natural bridge sentence that leads into the rest of the newsletter (e.g., "Here's what we're covering this week:" or "Read on for...")
- Length: 100-150 words
- No hashtags
- Adapt the core idea for an email audience that has opted in; do not simply copy-paste

Return a JSON object. Format:
{ "body": "full newsletter intro text" }
Return ONLY the JSON object, no markdown fences.`

  const userMessage = `Brand context:\n${brandContext}\n\nOriginal post to repurpose:\n${originalBody}${originalHashtags ? `\n${originalHashtags}` : ''}\n\nAdapt this content as a newsletter intro paragraph. Keep the core idea but rewrite it to suit an email audience.`

  return callGroq(systemPrompt, userMessage)
}

async function callGroq(systemPrompt, userMessage) {
  const completion = await groq.chat.completions.create({
    model:           DEFAULT_MODEL,
    temperature:     0.75,
    max_tokens:      1000,
    response_format: { type: 'json_object' }, // forces valid JSON output
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage },
    ],
  })

  let raw = completion.choices[0]?.message?.content?.trim() ?? '{}'
  // Strip markdown code fences if model wraps them anyway
  raw = raw.replace(/^```[\w]*\s*/i, '').replace(/\s*```$/, '').trim()

  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    // Fallback: extract first {...} block anywhere in the response
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        return parsed && typeof parsed === 'object' ? parsed : null
      } catch { /* fall through */ }
    }
    console.error('[repurpose] JSON parse failed:', raw)
    return null
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getOrgId(supabase, user.id)
    if (!orgId) return Response.json({ error: 'No organization found' }, { status: 400 })

    const body = await req.json()
    const { body: postBody, hashtags: postHashtags, sourcePlatform } = body ?? {}

    if (!postBody || typeof postBody !== 'string' || postBody.trim().length === 0) {
      return Response.json({ error: 'Post body is required' }, { status: 400 })
    }

    // Load brand profile
    const { data: brand } = await supabase
      .from('brand_profiles')
      .select('business_name, industry, description, audience, tone, keywords_include, keywords_exclude')
      .eq('org_id', orgId)
      .maybeSingle()

    if (!brand?.business_name) {
      return Response.json({ error: 'Complete your brand profile first.' }, { status: 400 })
    }

    const brandContext = buildBrandContext(brand)
    const source = sourcePlatform?.toLowerCase()

    // Build list of targets (all platforms except the source)
    const allTargets = ['linkedin', 'instagram', 'tiktok', 'email']
    const targets = allTargets.filter(p => p !== source)

    const generators = {
      linkedin:  () => repurposeForLinkedIn(postBody, postHashtags, brandContext),
      instagram: () => repurposeForInstagram(postBody, postHashtags, brandContext),
      tiktok:    () => repurposeForTikTok(postBody, postHashtags, brandContext),
      email:     () => repurposeForEmail(postBody, postHashtags, brandContext),
    }

    // Run all target generations in parallel
    const results = await Promise.all(
      targets.map(async (platform) => {
        try {
          const result = await generators[platform]()
          return [platform, result]
        } catch (err) {
          console.error(`[repurpose] Failed for ${platform}:`, err)
          return [platform, null]
        }
      })
    )

    // Assemble repurposed output; include skipped source platform as null for client awareness
    const repurposed = {}
    for (const [platform, result] of results) {
      repurposed[platform] = result
    }
    // Always include all 4 keys so the client can render all cards
    for (const p of allTargets) {
      if (!(p in repurposed)) {
        repurposed[p] = null // skipped (was source)
      }
    }

    return Response.json({ repurposed })
  } catch (e) {
    console.error('[content/repurpose]', e)
    return Response.json({ error: e.message ?? 'Repurposing failed' }, { status: 500 })
  }
}
