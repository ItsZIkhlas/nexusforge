import { createClient } from '@/lib/supabase/server'
import { groq, DEFAULT_MODEL } from '@/lib/groq'

const SERPER_BASE = 'https://google.serper.dev'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/content/trends
// Returns 8 AI-curated trend cards based on the org's industry.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // ── Validate Serper key ─────────────────────────────────────────────────
    const apiKey = process.env.SERPER_API_KEY
    if (!apiKey || apiKey === 'your_serper_api_key') {
      return Response.json(
        { error: 'SERPER_API_KEY not configured in .env.local' },
        { status: 503 }
      )
    }

    // ── Load org + brand ────────────────────────────────────────────────────
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })

    const { data: brand } = await supabase
      .from('brand_profiles')
      .select('industry, business_name, audience, tone')
      .eq('org_id', org.id)
      .maybeSingle()

    const industry = brand?.industry ?? 'business'

    // ── Build search queries ────────────────────────────────────────────────
    const queries = [
      `trending ${industry} topics for content creators 2026`,
      `${industry} viral content ideas`,
    ]

    // ── Run 2 Serper searches in parallel ───────────────────────────────────
    const serperFetch = async (q) => {
      const res = await fetch(`${SERPER_BASE}/search`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key':    apiKey,
        },
        body: JSON.stringify({ q, num: 10 }),
      })

      if (!res.ok) {
        const text = await res.text()
        console.error('[trends] Serper error:', res.status, text)
        throw new Error(`Serper returned ${res.status}`)
      }

      const data = await res.json()
      return data.organic ?? []
    }

    let allOrganic = []
    try {
      const [r1, r2] = await Promise.all(queries.map(serperFetch))
      allOrganic = [...r1, ...r2]
    } catch (err) {
      console.error('[trends] Serper fetch failed:', err)
      return Response.json({ error: 'Failed to reach search API' }, { status: 502 })
    }

    if (allOrganic.length === 0) {
      return Response.json({ error: 'No search results returned. Please try again.' }, { status: 502 })
    }

    // ── Summarise results for AI ────────────────────────────────────────────
    const searchSummary = allOrganic
      .slice(0, 16) // cap tokens
      .map((item, i) =>
        `${i + 1}. ${item.title ?? ''}\n   ${item.snippet ?? ''}`
      )
      .join('\n\n')

    // ── Call Groq to extract 8 trend cards ──────────────────────────────────
    const systemPrompt = `You are a content strategy expert. Given raw search results about trending topics in ${industry}, extract the 8 most actionable trend cards for a content creator in this industry.

Return ONLY a valid JSON array — no markdown, no explanation:
[
  {
    "title": "short trend name (3-6 words)",
    "context": "one sentence explaining why this is trending or relevant right now",
    "angle": "a specific, concrete angle for a post (e.g. 'Share a personal story about...', 'Debunk the myth that...', 'Give a hot take on...')"
  }
]

Rules:
- Be specific — no generic filler like "AI is changing things"
- Each card must feel immediately actionable
- Vary the angles: mix opinion, how-to, story, data insight, controversy
- Tailor to the ${industry} industry`

    const completion = await groq.chat.completions.create({
      model:       DEFAULT_MODEL,
      temperature: 0.75,
      max_tokens:  1200,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Industry: ${industry}\n\nSearch results:\n${searchSummary}`,
        },
      ],
    })

    let raw = completion.choices[0]?.message?.content?.trim() ?? '[]'
    raw = raw.replace(/^```[\w]*\s*/i, '').replace(/\s*```$/, '').trim()

    let trends
    try {
      trends = JSON.parse(raw)
      if (!Array.isArray(trends)) throw new Error('Not an array')
    } catch {
      console.error('[trends] JSON parse failed:', raw)
      return Response.json(
        { error: 'AI returned malformed data. Please try again.' },
        { status: 500 }
      )
    }

    // Guarantee exactly 8 items (trim or pad if AI misbehaved)
    trends = trends.slice(0, 8)

    return Response.json({ trends, industry })
  } catch (err) {
    console.error('[trends]', err)
    return Response.json({ error: err.message ?? 'Unexpected error' }, { status: 500 })
  }
}
