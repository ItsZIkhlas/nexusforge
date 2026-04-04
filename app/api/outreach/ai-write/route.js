import { createClient } from '@/lib/supabase/server'
import { groq, DEFAULT_MODEL } from '@/lib/groq'

const BODY_EXAMPLE = `Hi {{first_name}},

[Opening hook — 1-2 sentences referencing them or their company.]

[Value proposition — what you offer and why it matters to them. 1-2 sentences.]

[Call to action — one clear, low-friction ask.]

Best,
{{sender_name}}`

const FORMAT_RULES = `The body MUST follow this exact letter structure with blank lines between each section:

${BODY_EXAMPLE}

Rules:
- Max 2-3 sentences per paragraph
- No filler like "I hope this finds you well"
- Use merge tags where natural: {{first_name}}, {{company}}, {{sender_name}}`

/**
 * The AI often outputs real newlines inside JSON string values, which is invalid JSON.
 * Walk the string char-by-char and escape any bare newlines/carriage-returns inside strings.
 */
function fixJsonNewlines(raw) {
  // Strip markdown fences if present
  const text = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim()

  let out = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (escaped) {
      out += ch
      escaped = false
      continue
    }
    if (ch === '\\') {
      out += ch
      escaped = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      out += ch
      continue
    }
    if (inString && ch === '\n') { out += '\\n'; continue }
    if (inString && ch === '\r') { out += '\\r'; continue }
    if (inString && ch === '\t') { out += '\\t'; continue }

    out += ch
  }
  return out
}

function parseAiJson(text) {
  const fixed = fixJsonNewlines(text)
  // Try array first — the greedy {[\s\S]*} regex breaks on multi-object arrays
  const arrStr = fixed.match(/\[[\s\S]*\]/)?.[0]
  if (arrStr) {
    try { return { type: 'array', value: JSON.parse(arrStr) } } catch {}
  }
  const objStr = fixed.match(/\{[\s\S]*\}/)?.[0]
  if (objStr) {
    try { return { type: 'object', value: JSON.parse(objStr) } } catch {}
  }
  throw new Error('No valid JSON found')
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { mode, prompt, audience, stepNumber, totalSteps, stepCount } = await request.json()
  if (!prompt?.trim()) return Response.json({ error: 'Prompt is required' }, { status: 400 })

  // ── Single step ────────────────────────────────────────────────────────────
  if (mode === 'step') {
    const followUp = stepNumber > 1
      ? `This is follow-up #${stepNumber - 1}. Briefly reference a previous email was sent.`
      : 'This is the first email — no prior contact.'

    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert B2B cold email copywriter.\n\n${FORMAT_RULES}\n\nRespond with ONLY valid JSON, no markdown. Format: {"subject":"...","body":"..."}`,
        },
        {
          role: 'user',
          content: `Write step ${stepNumber} of ${totalSteps} for this campaign:\nDescription: ${prompt.trim()}${audience ? `\nAudience: ${audience.trim()}` : ''}\n${followUp}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 700,
    })

    const text = completion.choices[0]?.message?.content ?? ''
    try {
      const { value } = parseAiJson(text)
      return Response.json(value)
    } catch {
      console.error('[ai-write step] parse failed. raw:', text)
      return Response.json({ error: 'AI returned an unexpected format. Try again.' }, { status: 500 })
    }
  }

  // ── Full campaign ──────────────────────────────────────────────────────────
  if (mode === 'campaign') {
    const n = Math.min(Math.max(parseInt(stepCount) || 3, 1), 5)

    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert B2B cold email copywriter specializing in outreach sequences.\n\n${FORMAT_RULES}\n\nRespond with ONLY a valid JSON array, no markdown. Format: [{"subject":"...","body":"...","delay_days":N}, ...]`,
        },
        {
          role: 'user',
          content: `Create a ${n}-step cold email sequence.\nGoal: ${prompt.trim()}${audience ? `\nAudience: ${audience.trim()}` : ''}\n- Step 1 delay_days must be 0. Subsequent steps: 3–7 days apart.\n- Each step must be distinct — different angle or gentle bump.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const text = completion.choices[0]?.message?.content ?? ''
    try {
      const { value } = parseAiJson(text)
      const arr = Array.isArray(value) ? value : [value]
      return Response.json({ steps: arr.slice(0, n) })
    } catch {
      console.error('[ai-write campaign] parse failed. raw:', text)
      return Response.json({ error: 'AI returned an unexpected format. Try again.' }, { status: 500 })
    }
  }

  return Response.json({ error: 'Invalid mode' }, { status: 400 })
}
