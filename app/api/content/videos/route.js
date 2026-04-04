import { createClient } from '@/lib/supabase/server'
import { groq, DEFAULT_MODEL } from '@/lib/groq'

const RUNWAY_BASE  = 'https://api.dev.runwayml.com/v1'
const RUNWAY_VER   = '2024-11-06'

async function getOrgAndBrand(supabase, userId) {
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .single()
  if (!org?.id) return { orgId: null, runwayKey: null, brand: null }

  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('runway_api_key, business_name, description, tone')
    .eq('org_id', org.id)
    .maybeSingle()

  return { orgId: org.id, runwayKey: brand?.runway_api_key ?? null, brand }
}

// GET /api/content/videos — list all video projects
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { orgId } = await getOrgAndBrand(supabase, user.id)
  if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

  const { data, error } = await supabase
    .from('video_projects')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

// POST /api/content/videos — generate prompt + submit to Runway
export async function POST(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { orgId, runwayKey, brand } = await getOrgAndBrand(supabase, user.id)
  if (!orgId)     return Response.json({ error: 'No org' }, { status: 400 })
  if (!runwayKey) return Response.json({ error: 'No Runway API key. Add it in Brand Setup.' }, { status: 400 })

  const body = await req.json()
  const {
    topic,
    prompt:        providedPrompt,
    image_url,
    ratio    = '9:16',
    duration = 10,
    platform = 'tiktok',
  } = body

  // Runway requires pixel dimensions, not aspect ratio strings
  const RATIO_MAP = {
    '9:16':  '768:1280',
    '16:9':  '1280:768',
    '1:1':   '960:960',
  }
  const runwayRatio = RATIO_MAP[ratio] ?? '768:1280'

  // Build or use provided prompt
  let finalPrompt = providedPrompt?.trim()
  if (!finalPrompt && topic) {
    try {
      const completion = await groq.chat.completions.create({
        model: DEFAULT_MODEL,
        temperature: 0.7,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: `You write short cinematic video prompts for Runway AI video generation.
The prompt describes what happens visually in the video — camera movements, lighting, motion, atmosphere.
Brand: ${brand?.business_name ?? 'a business'}. Tone: ${brand?.tone ?? 'professional'}.
Keep it under 150 words. Focus on visual elements, movement, and mood. No dialogue. No text overlays.`,
          },
          { role: 'user', content: `Write a Runway video prompt for: ${topic}` },
        ],
      })
      finalPrompt = completion.choices[0]?.message?.content?.trim() ?? topic
    } catch {
      finalPrompt = topic
    }
  }

  if (!finalPrompt) return Response.json({ error: 'Provide a topic or prompt.' }, { status: 400 })

  // Save to DB
  const title = topic
    ? (topic.length > 60 ? topic.slice(0, 57) + '…' : topic)
    : `${platform} video`

  const { data: project, error: insertError } = await supabase
    .from('video_projects')
    .insert({ org_id: orgId, title, script: finalPrompt, platform, status: 'generating' })
    .select()
    .single()

  if (insertError) return Response.json({ error: insertError.message }, { status: 500 })

  // Runway only exposes image_to_video on the public API.
  // promptImage is required — if no image was uploaded we return a clear error.
  if (!image_url) {
    await supabase.from('video_projects').update({ status: 'failed', error_msg: 'No reference image' }).eq('id', project.id)
    return Response.json({ error: 'Please upload a reference image — Runway needs one to generate a video.' }, { status: 400 })
  }

  // Runway hard limit: 512 chars on promptText
  const safePrompt = finalPrompt.length > 500 ? finalPrompt.slice(0, 497) + '…' : finalPrompt

  const runwayBody = {
    model:       'gen3a_turbo',
    promptImage: image_url,
    promptText:  safePrompt,
    duration:    duration === 5 ? 5 : 10,
    ratio:       runwayRatio,
  }

  try {
    const runwayRes = await fetch(`${RUNWAY_BASE}/image_to_video`, {
      method: 'POST',
      headers: {
        'Authorization':    `Bearer ${runwayKey}`,
        'X-Runway-Version': RUNWAY_VER,
        'Content-Type':     'application/json',
      },
      body: JSON.stringify(runwayBody),
    })

    const runwayData = await runwayRes.json()

    if (!runwayRes.ok || !runwayData.id) {
      const errMsg = runwayData.message ?? runwayData.error ?? JSON.stringify(runwayData)
      console.error('[runway] submission failed:', errMsg, '| body sent:', JSON.stringify(runwayBody))
      await supabase.from('video_projects')
        .update({ status: 'failed', error_msg: errMsg, updated_at: new Date().toISOString() })
        .eq('id', project.id)
      return Response.json({ error: errMsg }, { status: 500 })
    }

    const { data: updated } = await supabase.from('video_projects')
      .update({ runway_task_id: runwayData.id, updated_at: new Date().toISOString() })
      .eq('id', project.id)
      .select()
      .single()

    return Response.json(updated, { status: 201 })
  } catch (e) {
    await supabase.from('video_projects')
      .update({ status: 'failed', error_msg: e.message, updated_at: new Date().toISOString() })
      .eq('id', project.id)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
