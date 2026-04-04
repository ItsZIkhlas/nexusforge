import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe'

const RESEND_BASE = 'https://api.resend.com'
const THREE_DAYS  = 3 * 86_400_000
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL ?? ''

function merge(template, contact, fromName) {
  return (template ?? '')
    .replace(/\{\{first_name\}\}/gi, contact.first_name ?? '')
    .replace(/\{\{last_name\}\}/gi,  contact.last_name  ?? '')
    .replace(/\{\{full_name\}\}/gi,  `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim())
    .replace(/\{\{company\}\}/gi,    contact.company    ?? '')
    .replace(/\{\{email\}\}/gi,      contact.email      ?? '')
    .replace(/\{\{sender_name\}\}/gi, fromName ?? '')
}

/** Build full HTML email: body paragraphs + CAN-SPAM footer */
function buildHtml(rawBody, unsubscribeToken, physicalAddress) {
  const bodyHtml = '<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#111">'
    + rawBody
        .split(/\n{2,}/)
        .map(para => `<p style="margin:0 0 16px 0">${para.replace(/\n/g, '<br>')}</p>`)
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

export async function POST(request, { params }) {
  const { id: campaignId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: org } = await supabase
    .from('organizations')
    .select('id, plan_id, resend_api_key, resend_from_name, resend_from_email, physical_address')
    .eq('owner_id', user.id)
    .single()
  if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })

  const orgKey = org.resend_api_key?.trim()
  const apiKey = orgKey || process.env.RESEND_API_KEY
  const keySource = orgKey ? 'Settings (org key)' : 'Environment variable'

  if (!apiKey || apiKey === 'your_resend_api_key') {
    return Response.json({
      error: 'No Resend API key configured. Add yours in Settings → Email Sending.',
    }, { status: 503 })
  }

  const { data: campaign } = await supabase
    .from('email_campaigns').select('*').eq('id', campaignId).eq('org_id', org.id).single()
  if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 })

  const plan = PLANS[org.plan_id] ?? PLANS.starter

  // Monthly cap
  if (plan.emailSends !== Infinity) {
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
    const { count: sentThisMonth } = await supabase
      .from('email_sends').select('*', { count: 'exact', head: true })
      .eq('org_id', org.id).eq('status', 'sent').gte('sent_at', startOfMonth.toISOString())
    if ((sentThisMonth ?? 0) >= plan.emailSends) {
      return Response.json({
        error: `Monthly email limit reached (${plan.emailSends.toLocaleString()} on ${plan.name} plan).`,
      }, { status: 403 })
    }
  }

  // Daily anti-spam cap
  const dailyLimit = plan.dailyEmailLimit ?? 200
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
  const { count: sentToday } = await supabase
    .from('email_sends').select('*', { count: 'exact', head: true })
    .eq('org_id', org.id).eq('status', 'sent').gte('sent_at', startOfDay.toISOString())
  if ((sentToday ?? 0) >= dailyLimit) {
    return Response.json({
      error: `Daily send limit reached (${dailyLimit} emails/day on ${plan.name} plan). Resets at midnight.`,
    }, { status: 429 })
  }

  const { data: allSteps } = await supabase
    .from('email_steps').select('*').eq('campaign_id', campaignId).order('step_number')
  if (!allSteps?.length) {
    return Response.json({ error: 'Add at least one step before sending' }, { status: 400 })
  }

  const { data: enrollments } = await supabase
    .from('email_enrollments')
    .select('*, contacts(id, first_name, last_name, email, company, unsubscribe_token, unsubscribed_at, last_emailed_at)')
    .eq('campaign_id', campaignId)
    .eq('status', 'active')
  if (!enrollments?.length) {
    return Response.json({ error: 'No active enrolled contacts to send to' }, { status: 400 })
  }

  const fromName    = campaign.from_name?.trim()  || org.resend_from_name?.trim()  || ''
  const fromEmail   = campaign.from_email?.trim() || org.resend_from_email?.trim() || ''
  if (!fromEmail) {
    return Response.json({ error: 'Set a From email on the campaign (or in Settings → Email Sending) before sending.' }, { status: 400 })
  }
  const fromAddress = fromName ? `${fromName} <${fromEmail}>` : fromEmail

  let sent = 0, failed = 0, skipped = 0
  const errors = []

  for (const enrollment of enrollments) {
    const contact = enrollment.contacts
    const step    = allSteps.find(s => s.step_number === enrollment.current_step)

    if (!step) {
      await supabase.from('email_enrollments').update({ status: 'completed' }).eq('id', enrollment.id)
      skipped++; continue
    }
    if (!contact?.email) { skipped++; continue }

    // Unsubscribe check
    if (contact.unsubscribed_at) {
      await supabase.from('email_enrollments').update({ status: 'unsubscribed' }).eq('id', enrollment.id)
      skipped++; continue
    }

    // 3-day cooldown
    if (contact.last_emailed_at) {
      if (Date.now() - new Date(contact.last_emailed_at).getTime() < THREE_DAYS) {
        skipped++; continue
      }
    }

    const subject = merge(step.subject, contact, fromName)
    const rawBody = merge(step.body,    contact, fromName)
    const html    = buildHtml(rawBody, contact.unsubscribe_token, org.physical_address)

    const { resend_id, error: sendErr } = await sendEmail({
      to: contact.email, from: fromAddress,
      replyTo: campaign.reply_to || undefined,
      subject, html, apiKey,
    })

    if (sendErr) {
      errors.push(`${sendErr} (key source: ${keySource})`)
      await supabase.from('email_sends').insert({
        enrollment_id: enrollment.id, step_id: step.id,
        contact_id: contact.id, org_id: org.id, subject, status: 'failed',
      })
      failed++; continue
    }

    await supabase.from('email_sends').insert({
      enrollment_id: enrollment.id, step_id: step.id,
      contact_id: contact.id, org_id: org.id, resend_id, subject, status: 'sent',
    })

    // Update contact cooldown timestamp
    await supabase.from('contacts')
      .update({ last_emailed_at: new Date().toISOString() }).eq('id', contact.id)

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

    sent++
  }

  return Response.json({ sent, failed, skipped, errors })
}
