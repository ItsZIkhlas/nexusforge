import { createClient } from '@/lib/supabase/server'

export async function GET(request, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: faqs } = await supabase
    .from('faq_items')
    .select('*')
    .eq('bot_id', id)
    .order('created_at')

  return Response.json(faqs ?? [])
}

export async function POST(request, { params }) {
  const { id } = await params
  const { question, answer } = await request.json()

  if (!question?.trim() || !answer?.trim()) {
    return Response.json({ error: 'Question and answer are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('faq_items')
    .insert({ bot_id: id, question: question.trim(), answer: answer.trim() })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data, { status: 201 })
}

export async function DELETE(request) {
  const { faqId } = await request.json()
  if (!faqId) return Response.json({ error: 'faqId required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('faq_items').delete().eq('id', faqId)
  return new Response(null, { status: 204 })
}
