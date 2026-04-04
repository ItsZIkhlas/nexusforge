// Using Groq (free tier). 14,400 requests/day — covers all AI features during development.
// To switch to a paid model later: swap apiKey and model, no other code changes needed.
import Groq from 'groq-sdk'

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

/**
 * Builds the system prompt for a chatbot widget.
 */
export function buildBotSystemPrompt(bot) {
  const faqs = bot.faq_items ?? []

  let prompt = bot.system_prompt?.trim()
    ? bot.system_prompt.trim()
    : `You are ${bot.name}, a helpful AI assistant. Be friendly, professional, and concise.`

  if (faqs.length > 0) {
    prompt += '\n\n---\n## Business Knowledge Base\n'
    prompt += 'Use the following Q&A pairs to answer customer questions accurately:\n\n'
    faqs.forEach(({ question, answer }) => {
      prompt += `Q: ${question}\nA: ${answer}\n\n`
    })
  }

  prompt += [
    '---',
    'Rules:',
    '- Keep answers short and helpful.',
    "- If you don't know something, say so and offer to connect them with a human.",
    '- Stay focused on topics relevant to the business.',
    '- Never make up information that is not in the knowledge base.',
  ].join('\n')

  return prompt
}
