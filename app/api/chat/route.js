import { createServiceClient } from '@/lib/supabase/service'
import { groq, buildBotSystemPrompt } from '@/lib/groq'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function POST(request) {
  const { botId, messages, conversationId } = await request.json()

  if (!botId || !messages?.length) {
    return Response.json(
      { error: 'Missing botId or messages' },
      { status: 400, headers: CORS }
    )
  }

  const supabase = createServiceClient()

  const { data: bot, error } = await supabase
    .from('bots')
    .select('*, faq_items(*)')
    .eq('id', botId)
    .eq('is_active', true)
    .single()

  if (error || !bot) {
    return Response.json({ error: 'Bot not found' }, { status: 404, headers: CORS })
  }

  // Domain whitelist check
  const origin = request.headers.get('origin') ?? ''
  if (bot.allowed_domains?.length > 0 && !bot.allowed_domains.includes('*')) {
    try {
      const reqDomain = new URL(origin).hostname
      if (!bot.allowed_domains.includes(reqDomain)) {
        return Response.json({ error: 'Domain not allowed' }, { status: 403, headers: CORS })
      }
    } catch {
      return Response.json({ error: 'Invalid origin' }, { status: 403, headers: CORS })
    }
  }

  const systemPrompt = buildBotSystemPrompt(bot)
  const chatMessages = messages.map(({ role, content }) => ({ role, content }))

  const encoder = new TextEncoder()
  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const groqStream = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1024,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatMessages,
          ],
        })

        for await (const chunk of groqStream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            fullResponse += text
            controller.enqueue(encoder.encode(text))
          }
        }

        controller.close()

        saveConversation(supabase, botId, conversationId, messages, fullResponse).catch(console.error)
      } catch (err) {
        console.error('Stream error:', err)
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', ...CORS },
  })
}

async function saveConversation(supabase, botId, conversationId, messages, assistantResponse) {
  let convId = conversationId

  if (!convId) {
    const { data } = await supabase
      .from('conversations')
      .insert({ bot_id: botId })
      .select('id')
      .single()
    convId = data?.id
  }

  if (!convId) return

  const lastUserMsg = messages.at(-1)

  await supabase.from('messages').insert([
    { conversation_id: convId, role: 'user',      content: lastUserMsg.content },
    { conversation_id: convId, role: 'assistant', content: assistantResponse },
  ])

  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', convId)
}
