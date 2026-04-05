import { createClient } from '@/lib/supabase/server'
import { groq, DEFAULT_MODEL } from '@/lib/groq'

// ── Tool definitions ───────────────────────────────────────────────────────────
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_business_summary',
      description:
        'Get a complete high-level snapshot of all business metrics: contacts, deals, won revenue, email outreach performance, chatbot conversations, websites, content posts, and lead credit usage. Always call this first when the user asks for an overview or "how is my business doing".',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_contacts',
      description:
        'List CRM contacts with optional filters. Returns name, email, company, status, source, and dates. Use to answer questions about specific contacts, new leads, contacts in a particular stage, etc.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['lead', 'contacted', 'interested', 'negotiating', 'won', 'lost'],
            description: 'Filter contacts by status',
          },
          limit: { type: 'number', description: 'Max contacts to return (default 20, max 50)' },
          days_since_added: { type: 'number', description: 'Only contacts added in the last N days' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_pipeline',
      description:
        'Get the sales pipeline: deal count and total value by stage. Optionally include individual deal details. Use to analyze pipeline health, stuck deals, revenue potential.',
      parameters: {
        type: 'object',
        properties: {
          stage: {
            type: 'string',
            enum: ['lead', 'contacted', 'interested', 'negotiating', 'won', 'lost'],
            description: 'Filter to a specific stage',
          },
          include_deals: {
            type: 'boolean',
            description: 'Include individual deal titles, values, and stages (default false)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_email_performance',
      description:
        'Get full email outreach performance: sequences, enrollment counts, send/open/click/reply rates broken down by sequence. Use when asked about email results, outreach effectiveness, or which sequences are working.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stale_contacts',
      description:
        'Find contacts that haven\'t been updated recently and may need follow-up. Essential for identifying neglected leads. Use when asked about who to follow up with, dormant contacts, or pipeline maintenance.',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Flag contacts not updated in this many days (default 14)',
          },
          status: {
            type: 'string',
            description:
              'Filter by status — e.g. "contacted" finds people waiting for a reply, "interested" finds warm leads going cold',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_activity',
      description:
        'Get recent activity across the platform: new contacts added, deals created, lead searches, new conversations in the last N days. Good for weekly reviews and momentum checks.',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Look-back window in days (default 7)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'draft_email',
      description:
        'Draft an email for the user to send. ONLY call this when the user explicitly asks you to write, draft, or create an email. Never call this for general questions or casual messages.',
      parameters: {
        type: 'object',
        properties: {
          to_name: { type: 'string', description: 'Recipient name' },
          to_company: { type: 'string', description: 'Recipient company' },
          purpose: {
            type: 'string',
            enum: ['follow_up', 'introduction', 'proposal', 'breakup', 'check_in', 'thank_you'],
            description: 'Email purpose',
          },
          context: {
            type: 'string',
            description:
              'Any context to personalize: what they discussed, pain points, last interaction, what the sender offers',
          },
        },
        required: ['purpose'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_content_and_websites',
      description:
        'Get content posts (drafts, published, scheduled) and website status. Use when asked about content strategy, what has been published, or website performance.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
]

// ── Tool execution ─────────────────────────────────────────────────────────────
async function executeTool(name, args, supabase, orgId) {
  switch (name) {
    case 'get_business_summary': {
      const thirtyDays = new Date(Date.now() - 30 * 864e5).toISOString()
      const [
        { count: totalContacts },
        { data: deals },
        { data: bots },
        { data: sequences },
        { count: totalWebsites },
        { data: contentPosts },
        { data: leadSearches },
        { data: org },
      ] = await Promise.all([
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('deals').select('stage, value').eq('org_id', orgId),
        supabase.from('bots').select('id').eq('org_id', orgId),
        supabase.from('email_sequences').select('id, name, status').eq('org_id', orgId),
        supabase.from('websites').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('content_posts').select('status, type').eq('org_id', orgId),
        supabase.from('lead_searches').select('credits_used').eq('org_id', orgId).gte('created_at', thirtyDays),
        supabase.from('organizations').select('lead_credits_used, plan_id, subscription_status').eq('id', orgId).single(),
      ])

      const botIds = (bots ?? []).map(b => b.id)
      const seqIds = (sequences ?? []).map(s => s.id)

      let totalConversations = 0
      let emailEvents = []
      let totalEnrollments = 0

      if (botIds.length) {
        const { count } = await supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .in('bot_id', botIds)
        totalConversations = count ?? 0
      }

      if (seqIds.length) {
        const { data: enr } = await supabase
          .from('sequence_enrollments')
          .select('id')
          .in('sequence_id', seqIds)
        totalEnrollments = enr?.length ?? 0
        if (enr?.length) {
          const { data: ev } = await supabase
            .from('email_events')
            .select('event_type')
            .in('enrollment_id', enr.map(e => e.id))
          emailEvents = ev ?? []
        }
      }

      const wonRevenue = (deals ?? [])
        .filter(d => d.stage === 'won')
        .reduce((s, d) => s + (Number(d.value) || 0), 0)
      const activeDeals = (deals ?? []).filter(d => !['won', 'lost'].includes(d.stage)).length
      const stageCounts = {}
      for (const d of (deals ?? [])) stageCounts[d.stage] = (stageCounts[d.stage] ?? 0) + 1

      const sent = emailEvents.filter(e => e.event_type === 'sent').length
      const opened = emailEvents.filter(e => e.event_type === 'opened').length
      const clicked = emailEvents.filter(e => e.event_type === 'clicked').length
      const replied = emailEvents.filter(e => e.event_type === 'replied').length
      const creditsUsed = (leadSearches ?? []).reduce((s, x) => s + (x.credits_used ?? 0), 0)

      return {
        contacts: { total: totalContacts ?? 0 },
        pipeline: {
          total_deals: deals?.length ?? 0,
          active_deals: activeDeals,
          won_revenue: wonRevenue,
          by_stage: stageCounts,
        },
        email_outreach: {
          sequences: sequences?.length ?? 0,
          total_enrollments: totalEnrollments,
          emails_sent: sent,
          open_rate: sent > 0 ? `${Math.round((opened / sent) * 100)}%` : 'N/A',
          click_rate: opened > 0 ? `${Math.round((clicked / opened) * 100)}%` : 'N/A',
          reply_rate: sent > 0 ? `${Math.round((replied / sent) * 100)}%` : 'N/A',
        },
        chatbot: { bots: botIds.length, total_conversations: totalConversations },
        websites: { total: totalWebsites ?? 0 },
        content_posts: {
          total: contentPosts?.length ?? 0,
          by_status: contentPosts?.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] ?? 0) + 1
            return acc
          }, {}),
        },
        lead_credits_used_this_month: creditsUsed,
        plan: org?.data?.plan_id ?? org?.plan_id ?? 'unknown',
      }
    }

    case 'get_contacts': {
      let query = supabase
        .from('contacts')
        .select('first_name, last_name, email, company, job_title, status, source, created_at, updated_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(Math.min(args.limit ?? 20, 50))

      if (args.status) query = query.eq('status', args.status)
      if (args.days_since_added) {
        const since = new Date(Date.now() - args.days_since_added * 864e5).toISOString()
        query = query.gte('created_at', since)
      }

      const { data } = await query
      return {
        contacts: (data ?? []).map(c => ({
          name: [c.first_name, c.last_name].filter(Boolean).join(' ') || '(unnamed)',
          email: c.email,
          company: c.company,
          job_title: c.job_title,
          status: c.status,
          source: c.source,
          added: c.created_at?.slice(0, 10),
          last_updated: c.updated_at?.slice(0, 10),
        })),
        count: data?.length ?? 0,
      }
    }

    case 'get_pipeline': {
      let query = supabase
        .from('deals')
        .select('title, value, stage, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (args.stage) query = query.eq('stage', args.stage)

      const { data: deals } = await query

      const stageCounts = {}
      const stageValues = {}
      for (const d of (deals ?? [])) {
        stageCounts[d.stage] = (stageCounts[d.stage] ?? 0) + 1
        stageValues[d.stage] = (stageValues[d.stage] ?? 0) + (Number(d.value) || 0)
      }

      const result = {
        total_deals: deals?.length ?? 0,
        won_revenue: stageValues['won'] ?? 0,
        active_deals: (deals ?? []).filter(d => !['won', 'lost'].includes(d.stage)).length,
        by_stage: Object.entries(stageCounts).map(([stage, count]) => ({
          stage,
          count,
          total_value: stageValues[stage] ?? 0,
        })),
      }

      if (args.include_deals) result.deals = deals ?? []
      return result
    }

    case 'get_email_performance': {
      const { data: sequences } = await supabase
        .from('email_sequences')
        .select('id, name, status')
        .eq('org_id', orgId)

      if (!sequences?.length)
        return { sequences: [], message: 'No email sequences have been created yet.' }

      const seqIds = sequences.map(s => s.id)
      const { data: enrollments } = await supabase
        .from('sequence_enrollments')
        .select('id, status, sequence_id')
        .in('sequence_id', seqIds)

      if (!enrollments?.length)
        return { sequences, total_enrollments: 0, message: 'No contacts enrolled in sequences yet.' }

      const enrollIds = enrollments.map(e => e.id)
      const { data: events } = await supabase
        .from('email_events')
        .select('event_type, enrollment_id')
        .in('enrollment_id', enrollIds)

      const sent = events?.filter(e => e.event_type === 'sent').length ?? 0
      const opened = events?.filter(e => e.event_type === 'opened').length ?? 0
      const clicked = events?.filter(e => e.event_type === 'clicked').length ?? 0
      const replied = events?.filter(e => e.event_type === 'replied').length ?? 0

      const bySequence = sequences.map(s => {
        const seqEnr = enrollments.filter(e => e.sequence_id === s.id)
        return {
          name: s.name,
          status: s.status,
          enrolled: seqEnr.length,
          active: seqEnr.filter(e => e.status === 'active').length,
          completed: seqEnr.filter(e => e.status === 'completed').length,
          unsubscribed: seqEnr.filter(e => e.status === 'unsubscribed').length,
        }
      })

      return {
        total_sequences: sequences.length,
        total_enrollments: enrollments.length,
        emails_sent: sent,
        open_rate: sent > 0 ? `${Math.round((opened / sent) * 100)}%` : 'N/A',
        click_rate: opened > 0 ? `${Math.round((clicked / opened) * 100)}%` : 'N/A',
        reply_rate: sent > 0 ? `${Math.round((replied / sent) * 100)}%` : 'N/A',
        by_sequence: bySequence,
      }
    }

    case 'get_stale_contacts': {
      const days = args.days ?? 14
      const cutoff = new Date(Date.now() - days * 864e5).toISOString()

      let query = supabase
        .from('contacts')
        .select('first_name, last_name, email, company, status, updated_at, created_at')
        .eq('org_id', orgId)
        .lt('updated_at', cutoff)
        .order('updated_at', { ascending: true })
        .limit(30)

      if (args.status) query = query.eq('status', args.status)

      const { data } = await query
      return {
        stale_contacts: (data ?? []).map(c => ({
          name: [c.first_name, c.last_name].filter(Boolean).join(' ') || '(unnamed)',
          email: c.email,
          company: c.company,
          status: c.status,
          last_updated: c.updated_at?.slice(0, 10),
          days_stale: Math.floor((Date.now() - new Date(c.updated_at)) / 864e5),
        })),
        count: data?.length ?? 0,
        cutoff_days: days,
        message:
          data?.length
            ? `Found ${data.length} contacts not updated in the last ${days} days.`
            : `All contacts have been updated within the last ${days} days — pipeline is healthy.`,
      }
    }

    case 'get_recent_activity': {
      const days = args.days ?? 7
      const since = new Date(Date.now() - days * 864e5).toISOString()

      const [
        { count: newContacts },
        { data: newDeals },
        { data: leadSearches },
      ] = await Promise.all([
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('org_id', orgId).gte('created_at', since),
        supabase.from('deals').select('title, stage, value, created_at').eq('org_id', orgId).gte('created_at', since),
        supabase.from('lead_searches').select('created_at, credits_used, results_count').eq('org_id', orgId).gte('created_at', since),
      ])

      const { data: bots } = await supabase.from('bots').select('id').eq('org_id', orgId)
      let recentConversations = 0
      if (bots?.length) {
        const { count } = await supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .in('bot_id', bots.map(b => b.id))
          .gte('created_at', since)
        recentConversations = count ?? 0
      }

      return {
        period_days: days,
        new_contacts: newContacts ?? 0,
        new_deals: newDeals?.length ?? 0,
        new_deals_detail: (newDeals ?? []).map(d => ({
          title: d.title,
          stage: d.stage,
          value: d.value,
          date: d.created_at?.slice(0, 10),
        })),
        lead_searches: leadSearches?.length ?? 0,
        lead_credits_spent: (leadSearches ?? []).reduce((s, x) => s + (x.credits_used ?? 0), 0),
        new_conversations: recentConversations,
      }
    }

    case 'draft_email': {
      // Signal to the model to write the email in its final response
      return {
        action: 'draft_email',
        to_name: args.to_name ?? 'the contact',
        to_company: args.to_company ?? '',
        purpose: args.purpose,
        context: args.context ?? '',
        instruction:
          'Based on these parameters, write a complete, polished email in your response. Include a compelling subject line and a concise 2-3 paragraph body. Use [Your Name] and [Your Company] as placeholders. Make it feel human and specific, not templated.',
      }
    }

    case 'get_content_and_websites': {
      const [{ data: posts }, { data: websites }, { data: videoPosts }] = await Promise.all([
        supabase.from('content_posts').select('type, status, title, created_at').eq('org_id', orgId).order('created_at', { ascending: false }).limit(20),
        supabase.from('websites').select('name, slug, is_published, created_at').eq('org_id', orgId),
        supabase.from('video_projects').select('title, status, created_at').eq('org_id', orgId).limit(10),
      ])

      return {
        content_posts: {
          total: posts?.length ?? 0,
          by_status: posts?.reduce((acc, p) => { acc[p.status] = (acc[p.status] ?? 0) + 1; return acc }, {}),
          recent: (posts ?? []).slice(0, 5).map(p => ({ title: p.title, type: p.type, status: p.status, date: p.created_at?.slice(0, 10) })),
        },
        websites: {
          total: websites?.length ?? 0,
          published: websites?.filter(w => w.is_published).length ?? 0,
          list: (websites ?? []).map(w => ({ name: w.name, slug: w.slug, published: w.is_published })),
        },
        video_projects: {
          total: videoPosts?.length ?? 0,
          by_status: videoPosts?.reduce((acc, v) => { acc[v.status] = (acc[v.status] ?? 0) + 1; return acc }, {}),
        },
      }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}

// ── System prompt builder ──────────────────────────────────────────────────────
const TONE_INSTRUCTIONS = {
  direct:
    'Be extremely direct and concise. Lead with the bottom line immediately. Short sentences. Cut all filler. If the answer is a number or a name, say it first.',
  analytical:
    'Be thorough and data-driven. Include specific numbers, percentages, and comparisons wherever available. Explain the "why" behind patterns you spot. Use structured breakdowns.',
  coaching:
    'Take a coaching approach. Ask one clarifying question when useful. Help the user think through their situation rather than just giving answers. Offer multiple angles.',
  executive:
    'Give executive-level briefings only. Start with the single most important decision or priority. Be high-level and strategic. Omit implementation detail unless explicitly asked.',
}

function buildSystemPrompt(settings) {
  const tone = settings?.tone ?? 'direct'
  const memory = settings?.memory?.trim() ?? ''
  const toneGuide = TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS.direct

  return `You are NexusForge AI Advisor — a sharp, direct business advisor built into the user's NexusForge dashboard. You have tools to look up their real business data when needed.

Personality:
- Conversational and human. Match the user's energy — if they're casual, be casual back.
- Sharp and direct when giving business advice. No waffle.
- Never robotic. Never recite a list of zeros.

When to use tools:
- Only use tools when the user is ACTUALLY asking about their business, data, contacts, emails, pipeline, or content.
- Do NOT call any tool for greetings, casual chat, or general questions ("hey", "what can you do", "wussap").
- Do NOT call draft_email unless the user explicitly asks you to write or draft an email for them.

When data is empty:
- Don't just list zeros. Acknowledge it briefly, then pivot to what they should do first to get value from the platform. Keep it short — 2-3 sentences max.

When giving business advice:
- Reference actual numbers and names from their data
- Use bullet points for lists, **bold** for key figures
- Prioritize by highest impact — don't give 10 recommendations, give the top 2-3

When writing emails (only when asked):
- Include a subject line
- Write copy that sounds human, not templated
- Never use [Your Company] or [Your Name] as placeholders — use what you know about their business

Response style: ${toneGuide}
${memory ? `\nBusiness context (always keep in mind):\n${memory}` : ''}`
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function POST(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, plan_id')
    .eq('owner_id', user.id)
    .single()
  if (!org) return Response.json({ error: 'No organization found' }, { status: 404 })

  const { messages, settings } = await req.json()
  if (!messages?.length) return Response.json({ error: 'No messages provided' }, { status: 400 })

  const groqMessages = [{ role: 'system', content: buildSystemPrompt(settings) }, ...messages]

  // Agentic loop — max 6 iterations to allow multi-tool calls
  for (let i = 0; i < 6; i++) {
    const response = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: groqMessages,
      tools: TOOLS,
      tool_choice: 'auto',
      temperature: 0.35,
      max_tokens: 2048,
    })

    const choice = response.choices[0]
    groqMessages.push(choice.message)

    // Final text response — done
    if (!choice.message.tool_calls?.length) {
      return Response.json({ content: choice.message.content })
    }

    // Execute all tool calls in parallel
    const toolResults = await Promise.all(
      choice.message.tool_calls.map(async tc => {
        let result
        try {
          const args = JSON.parse(tc.function.arguments || '{}')
          result = await executeTool(tc.function.name, args, supabase, org.id)
        } catch (err) {
          result = { error: err.message }
        }
        return {
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        }
      })
    )

    groqMessages.push(...toolResults)
  }

  return Response.json({ content: 'I ran into an issue analyzing your data. Please try again.' })
}
