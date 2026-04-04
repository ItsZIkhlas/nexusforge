import { createClient } from '@/lib/supabase/server'

const RUNWAY_BASE = 'https://api.dev.runwayml.com/v1'
const RUNWAY_VER  = '2024-11-06'

async function getOrgId(supabase, userId) {
  const { data } = await supabase.from('organizations').select('id').eq('owner_id', userId).single()
  return data?.id ?? null
}

async function getRunwayKey(supabase, orgId) {
  const { data } = await supabase.from('brand_profiles').select('runway_api_key').eq('org_id', orgId).maybeSingle()
  return data?.runway_api_key ?? null
}

// GET /api/content/videos/[id] — poll Runway task status and sync DB
export async function GET(req, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(supabase, user.id)
  if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

  const { data: project, error } = await supabase
    .from('video_projects')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error || !project) return Response.json({ error: 'Not found' }, { status: 404 })

  // Still generating — poll Runway
  if (project.status === 'generating' && project.runway_task_id) {
    const runwayKey = await getRunwayKey(supabase, orgId)
    if (runwayKey) {
      try {
        const res = await fetch(`${RUNWAY_BASE}/tasks/${project.runway_task_id}`, {
          headers: {
            'Authorization':    `Bearer ${runwayKey}`,
            'X-Runway-Version': RUNWAY_VER,
          },
        })
        const task = await res.json()

        if (task.status === 'SUCCEEDED') {
          const videoUrl = Array.isArray(task.output) ? task.output[0] : null
          const { data: updated } = await supabase.from('video_projects')
            .update({ status: 'ready', video_url: videoUrl, updated_at: new Date().toISOString() })
            .eq('id', id).select().single()
          return Response.json(updated)
        }

        if (task.status === 'FAILED') {
          const { data: updated } = await supabase.from('video_projects')
            .update({ status: 'failed', error_msg: task.failure ?? 'Runway generation failed', updated_at: new Date().toISOString() })
            .eq('id', id).select().single()
          return Response.json(updated)
        }
      } catch (e) {
        console.error('[runway poll]', e)
      }
    }
  }

  return Response.json(project)
}

// DELETE /api/content/videos/[id]
export async function DELETE(req, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(supabase, user.id)
  if (!orgId) return Response.json({ error: 'No org' }, { status: 400 })

  const { error } = await supabase.from('video_projects').delete().eq('id', id).eq('org_id', orgId)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
