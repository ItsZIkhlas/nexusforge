import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

async function getOrgAndCampaign(supabase, userId, campaignId) {
  const { data: org } = await supabase
    .from('organizations').select('id, plan_id').eq('owner_id', userId).single()
  if (!org) return { error: 'Organization not found', status: 404 }

  const { data: campaign } = await supabase
    .from('email_campaigns').select('*').eq('id', campaignId).eq('org_id', org.id).single()
  if (!campaign) return { error: 'Campaign not found', status: 404 }

  return { org, campaign }
}

export async function GET(request, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { error, status, org, campaign } = await getOrgAndCampaign(supabase, user.id, id)
  if (error) return Response.json({ error }, { status })

  // Steps
  const { data: steps } = await supabase
    .from('email_steps').select('*').eq('campaign_id', id).order('step_number')

  // Enrollments with contact info
  const { data: enrollments } = await supabase
    .from('email_enrollments')
    .select('*, contacts(id, first_name, last_name, email, company)')
    .eq('campaign_id', id)
    .order('enrolled_at', { ascending: false })

  // Send stats
  const { data: sends } = await supabase
    .from('email_sends').select('id, status, sent_at, step_id').eq('campaign_id' , id)

  // Attach campaign_id to sends for the query (via enrollment)
  const { count: sentCount } = await supabase
    .from('email_sends')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org.id)
    .eq('enrollment_id', id)  // won't match but we'll just get total via enrollments

  // Simpler: count sends where enrollment is in this campaign
  const enrollmentIds = (enrollments ?? []).map(e => e.id)

  let totalSent = 0
  if (enrollmentIds.length > 0) {
    const { count } = await supabase
      .from('email_sends')
      .select('*', { count: 'exact', head: true })
      .in('enrollment_id', enrollmentIds)
    totalSent = count ?? 0
  }

  return Response.json({
    ...campaign,
    steps:      steps ?? [],
    enrollments: (enrollments ?? []).map(e => ({
      ...e,
      contact: e.contacts,
      contacts: undefined,
    })),
    stats: {
      enrolled: enrollments?.length ?? 0,
      active:   enrollments?.filter(e => e.status === 'active').length ?? 0,
      completed: enrollments?.filter(e => e.status === 'completed').length ?? 0,
      total_sent: totalSent,
    },
  })
}

export async function PATCH(request, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { error, status, campaign } = await getOrgAndCampaign(supabase, user.id, id)
  if (error) return Response.json({ error }, { status })

  const body = await request.json()
  const { steps, ...fields } = body

  // Update campaign fields
  const allowed = ['name', 'status', 'from_name', 'from_email', 'reply_to']
  const updates = {}
  for (const k of allowed) {
    if (k in fields) updates[k] = fields[k]
  }

  // Use service client for writes — ownership already verified above
  const svc = createServiceClient()

  let savedCampaign = campaign

  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString()
    console.log('[PATCH campaign] Updating id:', id, 'with:', updates)
    const { data: updated, error: upErr } = await svc
      .from('email_campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (upErr) {
      console.error('[PATCH campaign] Update error:', upErr.message, upErr.code)
      return Response.json({ error: upErr.message }, { status: 400 })
    }
    if (!updated) {
      console.error('[PATCH campaign] Update returned null — 0 rows matched for id:', id)
      return Response.json({ error: 'Save failed: campaign row not found. Try refreshing the page.' }, { status: 500 })
    }
    console.log('[PATCH campaign] Saved OK:', updated)
    savedCampaign = updated
  }

  // Replace steps if provided
  let savedSteps = null
  if (Array.isArray(steps)) {
    // Null out step_id on any sends that reference these steps (FK constraint)
    const { data: existingSteps } = await svc
      .from('email_steps').select('id').eq('campaign_id', id)
    if (existingSteps?.length > 0) {
      const stepIds = existingSteps.map(s => s.id)
      await svc.from('email_sends').update({ step_id: null }).in('step_id', stepIds)
    }

    const { error: delErr } = await svc.from('email_steps').delete().eq('campaign_id', id)
    if (delErr) {
      console.error('[PATCH campaign] Step delete error:', delErr.message)
      return Response.json({ error: 'Failed to update steps: ' + delErr.message }, { status: 500 })
    }
    if (steps.length > 0) {
      const stepRows = steps.map((s, i) => ({
        campaign_id: id,
        step_number: i + 1,
        subject:    s.subject ?? '',
        body:       s.body ?? '',
        delay_days: s.delay_days ?? (i === 0 ? 0 : 3),
      }))
      const { error: insErr } = await svc.from('email_steps').insert(stepRows)
      if (insErr) {
        console.error('[PATCH campaign] Step insert error:', insErr.message)
        return Response.json({ error: 'Failed to save steps: ' + insErr.message }, { status: 500 })
      }
    }
    // Return fresh steps from DB so frontend state matches exactly
    const { data: freshSteps } = await svc
      .from('email_steps').select('*').eq('campaign_id', id).order('step_number')
    savedSteps = freshSteps ?? []
  }

  // Return the confirmed saved state so the UI can update from real DB data
  return Response.json({ ok: true, campaign: savedCampaign, steps: savedSteps })
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { error, status } = await getOrgAndCampaign(supabase, user.id, id)
  if (error) return Response.json({ error }, { status })

  const svc = createServiceClient()

  // 1. Get enrollments so we can delete their sends
  const { data: enrollments } = await svc
    .from('email_enrollments').select('id').eq('campaign_id', id)
  const enrollmentIds = (enrollments ?? []).map(e => e.id)

  // 2. Null out step_id on sends (FK: email_sends.step_id → email_steps.id)
  const { data: stepsToDelete } = await svc
    .from('email_steps').select('id').eq('campaign_id', id)
  const stepIds = (stepsToDelete ?? []).map(s => s.id)
  if (stepIds.length > 0) {
    await svc.from('email_sends').update({ step_id: null }).in('step_id', stepIds)
  }

  // 3. Delete sends for all enrollments
  if (enrollmentIds.length > 0) {
    await svc.from('email_sends').delete().in('enrollment_id', enrollmentIds)
  }

  // 4. Delete enrollments, steps, then campaign
  await svc.from('email_enrollments').delete().eq('campaign_id', id)
  await svc.from('email_steps').delete().eq('campaign_id', id)
  await svc.from('email_campaigns').delete().eq('id', id)

  return Response.json({ ok: true })
}
