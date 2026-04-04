import { createServiceClient } from '@/lib/supabase/service'
import { PLANS } from '@/lib/stripe'

const RESEND_BASE  = 'https://api.resend.com'
const THREE_DAYS   = 3 * 86_400_000
const APP_URL      = process.env.NEXT_PUBLIC_APP_URL ?? ''

function merge(template, contact, fromName) {
  return (template ?? '')
    .replace(/\{\{first_name\}\}/gi,  contact.first_name ?? '')
    .replace(/\{\{last_name\}\}/gi,   contact.last_name  ?? '')
    .replace(/\{\{full_name\}\}/gi,   `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim())
    .replace(/\{\{company\}\}/gi,     contact.company    ?? '')
    .replace(/\{\{email\}\}/gi,       contact.email      ?? '')
    .replace(/\{\{sender_name\}\}/gi, fromName           ?? '')
}

/** Build full HTML email: body paragraphs + CAN-SPAM footer */
function buildHtml(rawBody, unsubscribeToken, physicalAddress) {
  const bodyHtml = '<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#111">'
    + rawBody
        .split(/\n{2,}/)
        .map(p => `<p style="margin:0 0 16px 0">${p.replace(/\n/g, '<br>')}</p>`)
        .join('')
    + '</div>'

  const unsubscribeUrl = unsubscribeToken
    ? `${APP_URL}/unsubscribe?token=${unsubscribeToken}`
    : null

  const footerParts = []
  if (physicalAddress) {
    footerParts.push(`<p style="margin:0 0 5px 0">${physicalAddress}</p>`)
  }
  if (unsubscribeUrl) {
    footerParts.push(`<p style="margin:0"><a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline">Unsubscribe</a></p>`)
  }

  const footer = footerParts.length
    ? `<div style="margin-top:36px;padding-top:14px;border-top:1px solid #e5e7eb;font-family:sans-serif;font-size:11px;line-height:1.5;color:#9ca3af;text-align:center">${footerParts.join('')}</div>`
    : ''

  return bodyHtml + footer
}

async function sendEmail({ to, from, replyTo, subject, html, apiKey }) {
  try {
    const res = await fetch(`${RESEND_BASE}/emails`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ from, to, ...(replyTo ? { reply_to: replyTo } : {}), subject, html }),
    })
    const json = await res.json()
    if (!res.ok) return { error: json.message ?? 'Send failed' }
    return { resend_id: json.id }
  } catch (err) {
    return { error: err.message }
  }
}

export async function GET(request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createServiceClient()

  const { data: enrollments, error } = await supabase
    .from('email_enrollments')
    .select(`
      id, campaign_id, contact_id, org_id, current_step,
      contacts(
        id, first_name, last_name, email, company,
        unsubscribe_token, unsubscribed_at, last_emailed_at
      ),
      email_campaigns(
        id, name, from_name, from_email, reply_to, org_id,
        organizations(
          id, plan_id, resend_api_key, resend_from_name, resend_from_email,
          physical_address
        )
      )
    `)
    .eq('status', 'active')
    .not('next_send_at', 'is', null)
    .lte('next_send_at', new Date().toISOString())
    .limit(200)

  if (error) {
    console.error('[cron/send] query error:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  if (!enrollments?.length) {
    return Response.json({ sent: 0, failed: 0, skipped: 0 })
  }

  // Cache steps per campaign
  const stepCache = {}
  async function getSteps(campaignId) {
    if (stepCache[campaignId]) return stepCache[campaignId]
    const { data } = await supabase
      .from('email_steps').select('*').eq('campaign_id', campaignId).order('step_number')
    stepCache[campaignId] = data ?? []
    return stepCache[campaignId]
  }

  // Monthly send count (plan cap)
  const orgMonthlySent = {}
  async function getOrgSentThisMonth(orgId, plan) {
    if (plan.emailSends === Infinity) return 0
    if (orgMonthlySent[orgId] !== undefined) return orgMonthlySent[orgId]
    const startOfMonth = new Date()
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('email_sends').select('*', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'sent')
      .gte('sent_at', startOfMonth.toISOString())
    orgMonthlySent[orgId] = count ?? 0
    return orgMonthlySent[orgId]
  }

  // Daily send count (anti-spam cap, scales with plan)
  const orgDailySent = {}
  async function getOrgSentToday(orgId) {
    if (orgDailySent[orgId] !== undefined) return orgDailySent[orgId]
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('email_sends').select('*', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'sent')
      .gte('sent_at', startOfDay.toISOString())
    orgDailySent[orgId] = count ?? 0
    return orgDailySent[orgId]
  }

  let sent = 0, failed = 0, skipped = 0

  for (const enrollment of enrollments) {
    const contact  = enrollment.contacts
    const campaign = enrollment.email_campaigns
    const org      = campaign?.organizations

    if (!contact?.email || !campaign || !org) { skipped++; continue }

    // ── Unsubscribe check ────────────────────────────────────────────────────
    if (contact.unsubscribed_at) {
      await supabase.from('email_enrollments')
        .update({ status: 'unsubscribed' }).eq('id', enrollment.id)
      skipped++
      continue
    }

    // ── 3-day contact cooldown ───────────────────────────────────────────────
    if (contact.last_emailed_at) {
      if (Date.now() - new Date(contact.last_emailed_at).getTime() < THREE_DAYS) {
        skipped++
        continue
      }
    }

    // ── Monthly plan cap ─────────────────────────────────────────────────────
    const plan        = PLANS[org.plan_id] ?? PLANS.starter
    const monthlySent = await getOrgSentThisMonth(org.id, plan)
    if (plan.emailSends !== Infinity && monthlySent >= plan.emailSends) {
      skipped++
      continue
    }

    // ── Daily anti-spam cap ──────────────────────────────────────────────────
    const dailyLimit = plan.dailyEmailLimit ?? 200
    const dailySent  = await getOrgSentToday(org.id)
    if (dailySent >= dailyLimit) {
      skipped++
      continue
    }

    const allSteps = await getSteps(campaign.id)
    const step     = allSteps.find(s => s.step_number === enrollment.current_step)

    if (!step) {
      await supabase.from('email_enrollments').update({ status: 'completed' }).eq('id', enrollment.id)
      skipped++
      continue
    }

    const apiKey = org.resend_api_key?.trim() || process.env.RESEND_API_KEY
    if (!apiKey) { skipped++; continue }

    const fromName    = campaign.from_name?.trim()  || org.resend_from_name?.trim()  || ''
    const fromEmail   = campaign.from_email?.trim() || org.resend_from_email?.trim() || ''
    if (!fromEmail) { skipped++; continue }

    const fromAddress = fromName ? `${fromName} <${fromEmail}>` : fromEmail
    const subject     = merge(step.subject, contact, fromName)
    const rawBody     = merge(step.body,    contact, fromName)
    const html        = buildHtml(rawBody, contact.unsubscribe_token, org.physical_address)

    const { resend_id, error: sendErr } = await sendEmail({
      to: contact.email, from: fromAddress,
      replyTo: campaign.reply_to || undefined,
      subject, html, apiKey,
    })

    if (sendErr) {
      await supabase.from('email_sends').insert({
        enrollment_id: enrollment.id, step_id: step.id,
        contact_id: contact.id, org_id: org.id, subject, status: 'failed',
      })
      failed++
      continue
    }

    // Log send
    await supabase.from('email_sends').insert({
      enrollment_id: enrollment.id, step_id: step.id,
      contact_id: contact.id, org_id: org.id, resend_id, subject, status: 'sent',
    })

    // Update contact's last_emailed_at
    await supabase.from('contacts')
      .update({ last_emailed_at: new Date().toISOString() }).eq('id', contact.id)

    // Advance enrollment to next step
    const nextStep     = enrollment.current_step + 1
    const nextStepData = allSteps.find(s => s.step_number === nextStep)
    const nextSendAt   = nextStepData
      ? new Date(Date.now() + nextStepData.delay_days * 86_400_000).toISOString()
      : null

    await supabase.from('email_enrollments').update({
      current_step: nextStep,
      status:       nextStepData ? 'active' : 'completed',
      next_send_at: nextSendAt,
    }).eq('id', enrollment.id)

    await supabase.from('contact_activities').insert({
      contact_id: contact.id,
      type:       'email_sent',
      content:    `Email sent: "${subject}" (Campaign: ${campaign.name}, Step ${step.step_number})`,
    })

    // Update in-memory counters so we don't exceed limits in the same tick
    if (org.id in orgMonthlySent) orgMonthlySent[org.id]++
    if (org.id in orgDailySent)   orgDailySent[org.id]++
    sent++
  }

  console.log(`[cron/send] sent=${sent} failed=${failed} skipped=${skipped}`)
  return Response.json({ sent, failed, skipped })
}
