import { createClient } from '@/lib/supabase/server'

async function getAuthedBot(supabase, botId, userId) {
  const { data: bot } = await supabase
    .from('bots')
    .select('*, faq_items(*), organizations!inner(owner_id)')
    .eq('id', botId)
    .eq('organizations.owner_id', userId)
    .single()
  return bot
}

export async function GET(request, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const bot = await getAuthedBot(supabase, id, user.id)
  if (!bot) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(bot)
}

export async function PATCH(request, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const bot = await getAuthedBot(supabase, id, user.id)
  if (!bot) return Response.json({ error: 'Not found' }, { status: 404 })

  const updates = await request.json()
  const allowed = ['name', 'color', 'welcome_message', 'system_prompt', 'allowed_domains', 'is_active']
  const sanitized = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowed.includes(key))
  )

  const { data, error } = await supabase
    .from('bots')
    .update(sanitized)
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data)
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const bot = await getAuthedBot(supabase, id, user.id)
  if (!bot) return Response.json({ error: 'Not found' }, { status: 404 })

  await supabase.from('bots').delete().eq('id', id)
  return new Response(null, { status: 204 })
}
