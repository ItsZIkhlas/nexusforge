import { createClient } from '@/lib/supabase/server'

async function getOrg(supabase, userId) {
  const { data } = await supabase.from('organizations').select('id').eq('owner_id', userId).single()
  return data
}

// GET /api/video-schedules — list all schedules for this org
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await getOrg(supabase, user.id)
  if (!org) return Response.json({ error: 'No organization' }, { status: 404 })

  const { data, error } = await supabase
    .from('video_schedules')
    .select('*')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}

// POST /api/video-schedules — create a new schedule
export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await getOrg(supabase, user.id)
  if (!org) return Response.json({ error: 'No organization' }, { status: 404 })

  const body = await request.json()
  const { name, platforms, frequency, post_time, topics, brand_voice, avatar_id, voice_id, video_length } = body

  if (!platforms?.length) return Response.json({ error: 'Select at least one platform' }, { status: 400 })
  if (!topics?.length)    return Response.json({ error: 'Add at least one topic' }, { status: 400 })

  // Calculate first next_run_at based on frequency
  const nextRun = computeNextRun(frequency, post_time)

  const { data, error } = await supabase
    .from('video_schedules')
    .insert({
      org_id:       org.id,
      name:         name || 'My Video Schedule',
      platforms:    platforms,
      frequency,
      post_time:    post_time || '10:00',
      topics,
      brand_voice:  brand_voice || null,
      avatar_id:    avatar_id  || null,
      voice_id:     voice_id   || null,
      video_length: video_length || 60,
      status:       'active',
      next_run_at:  nextRun,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}

function computeNextRun(frequency, postTime) {
  const [hours, minutes] = (postTime || '10:00').split(':').map(Number)
  const now = new Date()
  const next = new Date()
  next.setHours(hours, minutes, 0, 0)

  // If that time already passed today, advance by one period
  if (next <= now) {
    if (frequency === 'daily')   next.setDate(next.getDate() + 1)
    else if (frequency === 'weekly') next.setDate(next.getDate() + 7)
    else if (frequency === '3x_week') next.setDate(next.getDate() + 2)
  }
  return next.toISOString()
}
