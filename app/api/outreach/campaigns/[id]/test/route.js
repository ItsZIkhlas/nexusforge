import { createClient } from '@/lib/supabase/server'

const RESEND_BASE = 'https://api.resend.com'

function merge(template, contact, fromName) {
  return (template ?? '')
    .replace(/\{\{first_name\}\}/gi, contact.first_name ?? 'there')
    .replace(/\{\{last_name\}\}/gi,  contact.last_name  ?? '')
    .replace(/\{\{full_name\}\}/gi,  `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() || 'there')
    .replace(/\{\{company\}\}/gi,    contact.company    ?? 'your company')
    .replace(/\{\{email\}\}/gi,      contact.email      ?? '')
    .replace(/\{\{sender_name\}\}/gi, fromName ?? '')
}

export async function POST(request, { params }) {
  const { id: campaignId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { email: toEmail } = await request.json()
  if (!toEmail?.trim()) return Response.json({ error: 'Email is required' }, { status: 400 })

  const { data: org } = await supabase
    .from('organizations')
    .select('id, resend_api_key, resend_from_name, resend_from_email')
    .eq('owner_id', user.id)
    .single()
  if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })

  const apiKey = org.resend_api_key?.trim() || process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 'your_resend_api_key') {
    return Response.json({ error: 'No Resend API key configured.' }, { status: 503 })
  }

  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*, email_steps(*)')
    .eq('id', campaignId)
    .eq('org_id', org.id)
    .single()
  if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 })

  const steps = (campaign.email_steps ?? []).sort((a, b) => a.step_number - b.step_number)
  const step  = steps[0]
  if (!step) return Response.json({ error: 'No steps configured for this campaign' }, { status: 400 })

  const fromName  = campaign.from_name?.trim()  || org.resend_from_name?.trim()  || ''
  const fromEmail = campaign.from_email?.trim() || org.resend_from_email?.trim() || ''
  if (!fromEmail) return Response.json({ error: 'Set a From email on the campaign before sending.' }, { status: 400 })

  const fromAddress = fromName ? `${fromName} <${fromEmail}>` : fromEmail

  // Use a fake contact so merge tags resolve to something sensible
  const fakeContact = { first_name: 'Test', last_name: 'User', email: toEmail, company: 'NexusForge Test' }
  const subject = merge(step.subject, fakeContact, fromName)
  const rawBody = merge(step.body,    fakeContact, fromName)
  const html = '<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#111">'
    + '<p style="background:#f59e0b22;border:1px solid #f59e0b44;color:#92400e;padding:10px 14px;border-radius:6px;font-size:13px;margin-bottom:20px">🧪 This is a <strong>test email</strong> from NexusForge — sent to you as a preview.</p>'
    + rawBody
        .split(/\n{2,}/)
        .map(para => `<p style="margin:0 0 16px 0">${para.replace(/\n/g, '<br>')}</p>`)
        .join('')
    + '</div>'

  const res = await fetch(`${RESEND_BASE}/emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ from: fromAddress, to: toEmail.trim(), subject: `[TEST] ${subject}`, html }),
  })
  const json = await res.json()
  if (!res.ok) return Response.json({ error: json.message ?? 'Send failed' }, { status: 502 })

  return Response.json({ ok: true, to: toEmail })
}
