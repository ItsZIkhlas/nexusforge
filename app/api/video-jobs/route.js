import { createClient } from '@/lib/supabase/server'

// GET /api/video-jobs?limit=20&status=all
export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
  if (!org) return Response.json({ error: 'No organization' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const status = searchParams.get('status') // optional filter

  let query = supabase
    .from('video_jobs')
    .select('*')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}
