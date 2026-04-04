import { createServiceClient } from '@/lib/supabase/service'
import { groq, DEFAULT_MODEL } from '@/lib/groq'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function getWeekMonday() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().slice(0, 10)
}

function buildBrandContext(brand) {
  return `
Business: ${brand.business_name}
Industry: ${brand.industry ?? 'Not specified'}
What they do: ${brand.description ?? 'Not specified'}
Target audience: ${brand.audience ?? 'Not specified'}
Tone: ${brand.tone ?? 'professional'}
${brand.keywords_include?.length ? `Always include: ${brand.keywords_include.join(', ')}` : ''}
${brand.keywords_exclude?.length ? `Never use: ${brand.keywords_exclude.join(', ')}` : ''}
`.trim()
}

async function generatePostsForPlatform(platform, count, brandContext) {
  const systemPrompt = platform === 'linkedin'
    ? `You are a LinkedIn content strategist. Write high-performing posts for business owners.
Rules: Strong hook (no "I" as first word), short paragraphs, real insight, ends with question/CTA, 150-250 words, NO hashtags.
Return JSON array of ${count} objects: [{ "body": "..." }, ...]
Return ONLY the JSON array.`
    : `You are a TikTok content strategist. Write engaging captions for business accounts.
Rules: Strong hook first line, short punchy conversational text, clear CTA, 30-80 words, 3-6 hashtags on new line.
Return JSON array of ${count} objects: [{ "body": "...", "hashtags": "#tag1 #tag2" }, ...]
Return ONLY the JSON array.`

  const completion = await groq.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.8,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: `Brand:\n${brandContext}\n\nGenerate ${count} ${platform} posts for this week.` },
    ],
  })

  let raw = completion.choices[0]?.message?.content?.trim() ?? '[]'
  raw = raw.replace(/^```[\w]*\s*/i, '').replace(/\s*```$/, '').trim()

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Called by Vercel cron every Monday at 8am
// vercel.json: { "crons": [{ "path": "/api/cron/content", "schedule": "0 8 * * 1" }] }
export async function POST(req) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const weekOf   = getWeekMonday()

  // Get all orgs with a brand profile that has at least one platform
  const { data: brands, error } = await supabase
    .from('brand_profiles')
    .select('*, organizations(name)')
    .not('platforms', 'is', null)
    .not('business_name', 'is', null)

  if (error || !brands?.length) {
    return Response.json({ message: 'No brand profiles found', count: 0 })
  }

  let totalGenerated = 0

  for (const brand of brands) {
    try {
      const platforms    = brand.platforms ?? []
      const postsPerWeek = brand.posts_per_week ?? { linkedin: 2, tiktok: 3 }
      const brandContext = buildBrandContext(brand)
      const allPosts     = []

      for (const platform of platforms) {
        const count = postsPerWeek[platform] ?? 2
        const posts = await generatePostsForPlatform(platform, count, brandContext)
        allPosts.push(...posts.map(p => ({
          org_id:   brand.org_id,
          platform,
          body:     p.body,
          hashtags: p.hashtags ?? null,
          status:   'pending',
          week_of:  weekOf,
        })))
      }

      if (allPosts.length > 0) {
        await supabase.from('content_posts').insert(allPosts)
        totalGenerated += allPosts.length

        // Send notification email to org owner
        const { data: org } = await supabase
          .from('organizations')
          .select('owner_id')
          .eq('id', brand.org_id)
          .single()

        let ownerEmail = null
        if (org?.owner_id) {
          const { data: ownerUser } = await supabase.auth.admin.getUserById(org.owner_id)
          ownerEmail = ownerUser?.user?.email ?? null
        }
        if (ownerEmail) {
          await resend.emails.send({
            from:    'NexusForge <noreply@nexusforge.app>',
            to:      ownerEmail,
            subject: `Your weekly content is ready — ${allPosts.length} posts need approval`,
            html: `
              <p>Hi there,</p>
              <p>Your AI marketing assistant has generated <strong>${allPosts.length} posts</strong> for this week.</p>
              <p>Review and approve them in Nexus:</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/content" style="background:#10b981;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Review Posts →</a></p>
              <p style="color:#64748b;font-size:12px;">Once approved, LinkedIn and TikTok posts will publish automatically.</p>
            `,
          })
        }
      }
    } catch (e) {
      console.error(`[cron/content] Failed for org ${brand.org_id}:`, e)
    }
  }

  return Response.json({ message: 'Done', weekOf, totalGenerated })
}
