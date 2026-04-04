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

// Stage-specific generation instructions
const STAGE_INSTRUCTIONS = {
  awareness: {
    purpose: 'Awareness — introduce a problem or pain point your audience faces',
    rules: [
      'Focus on a relatable problem, frustration, or situation the target audience experiences',
      'Do NOT mention the brand, product, or service at all',
      'No pitching, no selling — pure empathy and problem articulation',
      'Make the reader feel "this is exactly my situation"',
      'End with a thought-provoking question or bold statement about the problem',
    ],
  },
  education: {
    purpose: 'Education — provide genuine value through insights, tips, or how-to content',
    rules: [
      'Teach something useful directly related to solving the problem from the awareness stage',
      'Provide actionable steps, a framework, or key insight',
      'Lightly establish authority and expertise — not through bragging, but through depth',
      'The brand/business can be implied but should not be a hard sell',
      'End with an insight or a teaser that positions the solution you offer',
    ],
  },
  social_proof: {
    purpose: 'Social Proof — build trust through results, transformations, or third-party validation',
    rules: [
      'Frame a real or representative client result, transformation, or testimonial story',
      'Use specific numbers, outcomes, or before/after scenarios where possible',
      'Make the reader believe "this could be me too"',
      'Keep it humble and credible — avoid exaggerated claims',
      'End with a subtle signal that you can help them achieve similar results',
    ],
  },
  cta: {
    purpose: 'CTA — drive a specific action: booking, enquiry, purchase, or sign-up',
    rules: [
      'Make a clear, direct offer or invitation',
      'Reference the pain/desire established earlier in the funnel',
      'Include a specific next step (DM us, click the link, book a call, comment below)',
      'Create urgency or exclusivity if appropriate, but keep it authentic',
      'Make it easy and low-friction to respond',
    ],
  },
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

function buildSystemPrompt(stageId, platform, stageMeta) {
  const platformRules = platform === 'linkedin'
    ? [
        'Platform: LinkedIn',
        'Start with a strong hook (bold statement, question, or surprising fact) — never start with "I"',
        'Use short paragraphs (1-3 lines) with line breaks between them',
        'Length: 150-250 words',
        'NO hashtags (LinkedIn penalises them)',
        'End with a question or clear CTA to drive engagement',
      ]
    : [
        'Platform: Instagram',
        'First line is the hook — make it stop-the-scroll compelling',
        'Conversational, visual, and on-brand tone',
        'Include a clear CTA in the caption body',
        'Length: 80-150 words (caption body, not counting hashtags)',
        'Generate 5-10 relevant hashtags separately',
      ]

  const rules = [
    ...platformRules,
    '',
    `Stage: ${stageMeta.purpose}`,
    'Stage-specific rules:',
    ...stageMeta.rules.map(r => `- ${r}`),
  ].join('\n')

  const returnFormat = platform === 'instagram'
    ? `Return ONLY a JSON object: { "body": "caption text without hashtags", "hashtags": "#tag1 #tag2 #tag3" }
No markdown, no explanation — just the raw JSON object.`
    : `Return ONLY a JSON object: { "body": "full post text", "hashtags": null }
No markdown, no explanation — just the raw JSON object.`

  return `You are a world-class social media content strategist specializing in funnel-based content marketing.

${rules}

${returnFormat}`
}

// POST /api/content/funnels/generate
// Body: { funnelId, stageId, platform }
export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getOrgId(supabase, user.id)
    if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

    const body = await req.json()
    const { funnelId, stageId, platform } = body

    if (!funnelId || !stageId) {
      return Response.json({ error: 'funnelId and stageId are required' }, { status: 400 })
    }

    const stageMeta = STAGE_INSTRUCTIONS[stageId]
    if (!stageMeta) {
      return Response.json({ error: `Unknown stage: ${stageId}` }, { status: 400 })
    }

    // Load funnel (to get name, goal, and existing context)
    const { data: funnel, error: funnelErr } = await supabase
      .from('content_funnels')
      .select('*')
      .eq('id', funnelId)
      .eq('org_id', orgId)
      .single()

    if (funnelErr || !funnel) {
      return Response.json({ error: 'Funnel not found' }, { status: 404 })
    }

    // Load brand profile
    const { data: brand } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle()

    if (!brand?.business_name) {
      return Response.json({ error: 'Complete your brand profile first.' }, { status: 400 })
    }

    const effectivePlatform = platform ?? funnel.platform ?? 'linkedin'
    const brandContext = buildBrandContext(brand)
    const systemPrompt = buildSystemPrompt(stageId, effectivePlatform, stageMeta)

    // Build funnel context — include goal and what earlier stages already cover
    const funnelContext = [
      `Funnel name: ${funnel.name}`,
      funnel.goal ? `Funnel goal: ${funnel.goal}` : null,
      `This post is for the "${stageMeta.purpose}" stage.`,
    ].filter(Boolean).join('\n')

    const userMessage = `Brand context:\n${brandContext}\n\n${funnelContext}\n\nGenerate one ${effectivePlatform} post for the ${stageId} stage. Make it genuinely compelling and true to the brand voice.`

    const completion = await groq.chat.completions.create({
      model:           DEFAULT_MODEL,
      temperature:     0.85,
      max_tokens:      800,
      response_format: { type: 'json_object' }, // forces valid JSON output
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage },
      ],
    })

    let raw = completion.choices[0]?.message?.content?.trim() ?? '{}'
    // Strip markdown code fences if present
    raw = raw.replace(/^```[\w]*\s*/i, '').replace(/\s*```$/, '').trim()

    let post
    try {
      post = JSON.parse(raw)
    } catch {
      // Fallback: extract first {...} block anywhere in the response
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        try { post = JSON.parse(match[0]) } catch { /* fall through */ }
      }
    }

    if (!post) {
      console.error('[funnels/generate] JSON parse failed:', raw)
      return Response.json({ error: 'AI returned invalid JSON. Please try again.' }, { status: 500 })
    }

    if (!post?.body) {
      return Response.json({ error: 'AI returned an empty post. Please try again.' }, { status: 500 })
    }

    // Normalise hashtags to null for linkedin
    if (effectivePlatform === 'linkedin') {
      post.hashtags = null
    }

    return Response.json({ post })
  } catch (e) {
    console.error('[funnels/generate]', e)
    return Response.json({ error: e.message ?? 'Generation failed' }, { status: 500 })
  }
}
