import { createClient } from '@/lib/supabase/server'

export async function GET(request, { params }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Verify contact belongs to user's org
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!org) return Response.json([], { status: 200 })

  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('id', id)
    .eq('org_id', org.id)
    .single()

  if (!contact) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data: activities } = await supabase
    .from('contact_activities')
    .select('*')
    .eq('contact_id', id)
    .order('created_at', { ascending: false })

  return Response.json(activities ?? [])
}

export async function POST(request, { params }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { type, content } = await request.json()

  if (!type || !content?.trim()) {
    return Response.json({ error: 'Type and content are required' }, { status: 400 })
  }

  const validTypes = ['note', 'call', 'email_sent', 'meeting', 'task']
  if (!validTypes.includes(type)) {
    return Response.json({ error: 'Invalid activity type' }, { status: 400 })
  }

  // Verify ownership
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('id', id)
    .eq('org_id', org?.id)
    .single()

  if (!contact) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data: activity, error } = await supabase
    .from('contact_activities')
    .insert({ contact_id: id, type, content: content.trim() })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(activity, { status: 201 })
}
