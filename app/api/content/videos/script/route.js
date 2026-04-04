import { createClient } from '@/lib/supabase/server'
import { groq, DEFAULT_MODEL } from '@/lib/groq'

// POST /api/content/videos/script — generate a video script without submitting to HeyGen
export async function POST(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { topic, platform = 'tiktok' } = await req.json()
  if (!topic?.trim()) return Response.json({ error: 'Topic is required' }, { status: 400 })

  // Load brand context
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  const { data: brand } = org?.id
    ? await supabase.from('brand_profiles').select('business_name, description, tone').eq('org_id', org.id).maybeSingle()
    : { data: null }

  const aspectNote = platform === 'linkedin'
    ? 'landscape 16:9 frame'
    : 'vertical 9:16 frame'

  try {
    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.75,
      max_tokens: 120,
      messages: [
        {
          role: 'system',
          content: `You write cinematic visual prompts for Runway AI video generation.
A Runway prompt describes ONLY what is seen and felt visually — camera movement, lighting, atmosphere, motion, mood.
Brand: ${brand?.business_name ?? 'a business'}. Tone: ${brand?.tone ?? 'professional'}.
Format: ${aspectNote}.
Rules:
- Maximum 400 characters total
- No dialogue, no text overlays, no spoken words
- Describe visual motion and camera behaviour (slow zoom, aerial drift, pan, etc.)
- Describe lighting and atmosphere (golden hour, studio lighting, neon glow, etc.)
- Be specific and cinematic
Return ONLY the prompt text, nothing else.`,
        },
        {
          role: 'user',
          content: `Write a Runway cinematic prompt for: ${topic}`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    // Hard cap at 400 chars to stay safely under Runway's 512-char limit
    const script = raw.length > 400 ? raw.slice(0, 397) + '…' : raw
    return Response.json({ script })
  } catch (e) {
    console.error('[video/script]', e)
    return Response.json({ error: e.message ?? 'Script generation failed' }, { status: 500 })
  }
}
