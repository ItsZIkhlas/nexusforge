import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, plan_id, created_at')
    .eq('owner_id', user.id)
    .single()
  if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })

  // Fetch all user data in parallel
  const [
    { data: contacts },
    { data: deals },
    { data: bots },
    { data: campaigns },
    { data: contentPosts },
  ] = await Promise.all([
    supabase.from('contacts').select('*').eq('org_id', org.id),
    supabase.from('deals').select('*').eq('org_id', org.id),
    supabase.from('bots').select('id, name, created_at').eq('org_id', org.id),
    supabase.from('email_campaigns').select('id, name, status, created_at').eq('org_id', org.id),
    supabase.from('content_posts').select('platform, caption, status, created_at').eq('org_id', org.id),
  ])

  const exportData = {
    exported_at:    new Date().toISOString(),
    organization:   { id: org.id, name: org.name, plan: org.plan_id, created_at: org.created_at },
    user:           { id: user.id, email: user.email },
    contacts:       contacts  ?? [],
    deals:          deals     ?? [],
    bots:           bots      ?? [],
    campaigns:      campaigns ?? [],
    content_posts:  contentPosts ?? [],
  }

  const json  = JSON.stringify(exportData, null, 2)
  const date  = new Date().toISOString().slice(0, 10)
  return new Response(json, {
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': `attachment; filename="nexus-export-${date}.json"`,
    },
  })
}
