import { createClient } from '@/lib/supabase/server'

const UNCERTAIN_PHRASES = [
  "i don't know", "i'm not sure", "i don't have",
  "i'm unable to", "i cannot", "i can't find",
  "i'm sorry, i don't", "unfortunately, i", "i'm not aware",
  "i have no information", "outside of my", "beyond my knowledge",
  "i lack", "no information about", "not in my knowledge",
]

function isUnanswered(content) {
  const lower = (content ?? '').toLowerCase()
  return UNCERTAIN_PHRASES.some(p => lower.includes(p))
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!org) return Response.json({ conversations: [], stats: {} })

  const { data: bots } = await supabase
    .from('bots')
    .select('id, name, color')
    .eq('org_id', org.id)

  if (!bots?.length) return Response.json({ conversations: [], stats: {} })

  const botIds = bots.map(b => b.id)
  const botMap = Object.fromEntries(bots.map(b => [b.id, { name: b.name, color: b.color }]))

  const { data: rawConvs } = await supabase
    .from('conversations')
    .select('id, bot_id, visitor_id, started_at, last_message_at, messages(id, role, content, created_at)')
    .in('bot_id', botIds)
    .order('last_message_at', { ascending: false })
    .limit(200)

  const conversations = (rawConvs ?? []).map(conv => {
    const msgs = (conv.messages ?? []).sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    )

    const unansweredMsgs = msgs.filter(m => m.role === 'assistant' && isUnanswered(m.content))

    const gaps = unansweredMsgs.map(aMsg => {
      const idx     = msgs.indexOf(aMsg)
      const userMsg = idx > 0 ? msgs[idx - 1] : null
      return {
        userQuestion: userMsg?.content ?? null,
        aiResponse:   aMsg.content,
        at:           aMsg.created_at,
      }
    })

    return {
      id:               conv.id,
      bot_id:           conv.bot_id,
      bot_name:         botMap[conv.bot_id]?.name  ?? 'Unknown Bot',
      bot_color:        botMap[conv.bot_id]?.color ?? '#6366f1',
      visitor_id:       conv.visitor_id,
      started_at:       conv.started_at,
      last_message_at:  conv.last_message_at,
      message_count:    msgs.length,
      messages:         msgs,
      has_gap:          unansweredMsgs.length > 0,
      gaps,
    }
  })

  const totalMessages   = conversations.reduce((s, c) => s + c.message_count, 0)
  const unansweredConvs = conversations.filter(c => c.has_gap)

  return Response.json({
    conversations,
    stats: {
      total_conversations: conversations.length,
      total_messages:      totalMessages,
      unanswered_count:    unansweredConvs.length,
      avg_messages:        conversations.length
        ? Number((totalMessages / conversations.length).toFixed(1))
        : 0,
    },
  })
}
