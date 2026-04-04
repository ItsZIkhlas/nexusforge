import { createClient } from '@/lib/supabase/server'
import { groq, DEFAULT_MODEL } from '@/lib/groq'

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/content/from-topic
// Body: { topic: string, platform: 'linkedin' | 'tiktok' }
// Generates a single post from a topic/transcript and saves it as a draft.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // ── Parse body ──────────────────────────────────────────────────────────
    const { topic, platform = 'linkedin' } = await req.json()

    if (!topic?.trim()) {
      return Response.json({ error: 'topic is required' }, { status: 400 })
    }
    if (!['linkedin', 'tiktok'].includes(platform)) {
      return Response.json({ error: 'platform must be linkedin or tiktok' }, { status: 400 })
    }

    // ── Load org + brand ────────────────────────────────────────────────────
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })

    const { data: brand } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('org_id', org.id)
      .maybeSingle()

    if (!brand?.business_name) {
      return Response.json(
        { error: 'Complete your brand profile before generating posts.' },
        { status: 400 }
      )
    }

    // ── Build brand context ─────────────────────────────────────────────────
    const brandContext = [
      `Business: ${brand.business_name}`,
      `Industry: ${brand.industry ?? 'Not specified'}`,
      `What they do: ${brand.description ?? 'Not specified'}`,
      `Target audience: ${brand.audience ?? 'Not specified'}`,
      `Tone: ${brand.tone ?? 'professional'}`,
      brand.keywords_include?.length
        ? `Always include these words/themes: ${brand.keywords_include.join(', ')}`
        : '',
      brand.keywords_exclude?.length
        ? `Never use these words: ${brand.keywords_exclude.join(', ')}`
        : '',
      brand.content_pillars?.length
        ? `Content pillars (topics to tie posts back to): ${brand.content_pillars.join(', ')}`
        : '',
      brand.positioning
        ? `Brand positioning: ${brand.positioning}`
        : '',
      brand.brand_mission
        ? `Brand mission: ${brand.brand_mission}`
        : '',
    ].filter(Boolean).join('\n')

    // ── Build prompt ────────────────────────────────────────────────────────
    const systemPrompt = platform === 'linkedin'
      ? `You are a LinkedIn content strategist. Write a single high-performing LinkedIn post.

Rules:
- Start with a strong hook — a bold statement, question, or surprising fact. Never start with "I".
- Short paragraphs (1-3 lines) with line breaks between them.
- Include a concrete insight or perspective rooted in the topic.
- End with a thought-provoking question or CTA to drive comments.
- Length: 150-250 words.
- NO hashtags.
- Use the brand context to match the voice and audience.

Return ONLY a JSON object: { "body": "full post text" }
No markdown, no explanation.`

      : `You are a TikTok content strategist. Write a single engaging TikTok video caption.

Rules:
- First line is the hook (the first thing viewers see — make it urgent or surprising).
- Keep it short, punchy, and conversational — this is video caption text.
- Include a clear CTA (e.g. "follow for more", "comment below", "link in bio").
- End with 3-6 relevant trending hashtags on a new line.
- Body length: 30-80 words (not counting hashtags).

Return ONLY a JSON object: { "body": "caption text (no hashtags)", "hashtags": "#tag1 #tag2 #tag3" }
No markdown, no explanation.`

    // ── Call Groq ───────────────────────────────────────────────────────────
    const completion = await groq.chat.completions.create({
      model:           DEFAULT_MODEL,
      temperature:     0.82,
      max_tokens:      800,
      response_format: { type: 'json_object' }, // forces valid JSON output
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Brand context:\n${brandContext}\n\nTopic / idea to write about:\n"${topic.trim()}"`,
        },
      ],
    })

    let raw = completion.choices[0]?.message?.content?.trim() ?? '{}'

    // Strip markdown code fences if present
    raw = raw.replace(/^```[\w]*\s*/i, '').replace(/\s*```$/, '').trim()

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Fallback: find the first {...} block anywhere in the response
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          parsed = JSON.parse(match[0])
        } catch {
          // still failed — fall through to error below
        }
      }
    }

    if (!parsed) {
      console.error('[from-topic] JSON parse failed:', raw)
      return Response.json({ error: 'AI returned malformed output. Please try again.' }, { status: 500 })
    }

    if (!parsed.body?.trim()) {
      return Response.json({ error: 'AI returned empty post body. Please try again.' }, { status: 500 })
    }

    // ── Save to content_posts ───────────────────────────────────────────────
    const { data: post, error: insertError } = await supabase
      .from('content_posts')
      .insert({
        org_id:   org.id,
        platform,
        body:     parsed.body.trim(),
        hashtags: parsed.hashtags?.trim() ?? null,
        status:   'pending',
        week_of:  new Date().toISOString().slice(0, 10),
      })
      .select()
      .single()

    if (insertError) {
      console.error('[from-topic] insert error:', insertError)
      return Response.json({ error: insertError.message }, { status: 500 })
    }

    return Response.json({ post })
  } catch (err) {
    console.error('[from-topic]', err)
    return Response.json({ error: err.message ?? 'Unexpected error' }, { status: 500 })
  }
}
