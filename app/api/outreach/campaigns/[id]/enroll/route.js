import { createClient } from '@/lib/supabase/server'

export async function POST(request, { params }) {
  const { id: campaignId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: org } = await supabase
    .from('organizations').select('id').eq('owner_id', user.id).single()
  if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })

  // Verify campaign belongs to org
  const { data: campaign } = await supabase
    .from('email_campaigns').select('id').eq('id', campaignId).eq('org_id', org.id).single()
  if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 })

  const { contact_ids = [] } = await request.json()
  if (!contact_ids.length) return Response.json({ error: 'No contacts provided' }, { status: 400 })

  // Verify contacts belong to org
  const { data: contacts } = await supabase
    .from('contacts').select('id').eq('org_id', org.id).in('id', contact_ids)

  const validIds = (contacts ?? []).map(c => c.id)
  if (!validIds.length) return Response.json({ error: 'No valid contacts found' }, { status: 400 })

  // Upsert enrollments (skip already-enrolled)
  const rows = validIds.map(cid => ({
    campaign_id:  campaignId,
    contact_id:   cid,
    org_id:       org.id,
    status:       'active',
    current_step: 1,
    next_send_at: null, // null = waiting for first manual send; cron takes over after that
  }))

  const { data, error } = await supabase
    .from('email_enrollments')
    .upsert(rows, { onConflict: 'campaign_id,contact_id', ignoreDuplicates: true })
    .select()

  if (error) return Response.json({ error: error.message }, { status: 400 })

  return Response.json({
    enrolled: data?.length ?? 0,
    skipped:  validIds.length - (data?.length ?? 0),
  }, { status: 201 })
}
