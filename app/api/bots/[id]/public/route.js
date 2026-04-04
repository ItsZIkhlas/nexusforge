import { createServiceClient } from '@/lib/supabase/service'

// Public endpoint — no auth required.
// Returns only the fields the widget needs (name, color, welcome_message).
export async function GET(request, { params }) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: bot, error } = await supabase
    .from('bots')
    .select('id, name, color, welcome_message')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error || !bot) {
    return Response.json({ error: 'Bot not found' }, { status: 404 })
  }

  return Response.json(bot)
}
