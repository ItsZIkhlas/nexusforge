import { createClient } from '@/lib/supabase/server'

async function getOrgSchedule(supabase, userId, scheduleId) {
  const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', userId).single()
  if (!org) return { org: null, schedule: null }
  const { data: schedule } = await supabase
    .from('video_schedules').select('*').eq('id', scheduleId).eq('org_id', org.id).single()
  return { org, schedule }
}

// PATCH /api/video-schedules/[id]
export async function PATCH(request, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { org, schedule } = await getOrgSchedule(supabase, user.id, id)
  if (!org || !schedule) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const allowed = ['name','platforms','frequency','post_time','topics','brand_voice','avatar_id','voice_id','video_length','status']
  const updates = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  // Recalculate next_run_at if frequency or post_time changed
  if (updates.frequency || updates.post_time) {
    updates.next_run_at = computeNextRun(
      updates.frequency ?? schedule.frequency,
      updates.post_time  ?? schedule.post_time
    )
  }

  const { data, error } = await supabase
    .from('video_schedules').update(updates).eq('id', id).select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

// DELETE /api/video-schedules/[id]
export async function DELETE(request, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { org, schedule } = await getOrgSchedule(supabase, user.id, id)
  if (!org || !schedule) return Response.json({ error: 'Not found' }, { status: 404 })

  await supabase.from('video_schedules').delete().eq('id', id)
  return new Response(null, { status: 204 })
}

function computeNextRun(frequency, postTime) {
  const [hours, minutes] = (postTime || '10:00').split(':').map(Number)
  const now = new Date()
  const next = new Date()
  next.setHours(hours, minutes, 0, 0)
  if (next <= now) {
    if (frequency === 'daily')     next.setDate(next.getDate() + 1)
    else if (frequency === 'weekly')   next.setDate(next.getDate() + 7)
    else if (frequency === '3x_week') next.setDate(next.getDate() + 2)
  }
  return next.toISOString()
}
