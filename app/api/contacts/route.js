import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe'

const SORTABLE_COLUMNS = {
  name:    'first_name',
  company: 'company',
  email:   'email',
  status:  'status',
  added:   'created_at',
}

export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!org) return Response.json([])

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''
  const page   = parseInt(searchParams.get('page') ?? '1')
  const limit  = parseInt(searchParams.get('limit') ?? '25')
  const offset = (page - 1) * limit

  // Sort params — default: added desc
  const sortKey     = searchParams.get('sort')  ?? 'added'
  const orderParam  = searchParams.get('order') ?? 'desc'
  const sortColumn  = SORTABLE_COLUMNS[sortKey] ?? 'created_at'
  const ascending   = orderParam === 'asc'

  let query = supabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .eq('org_id', org.id)
    .order(sortColumn, { ascending })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`
    )
  }
  if (status) {
    query = query.eq('status', status)
  }

  const { data: contacts, count, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ contacts: contacts ?? [], total: count ?? 0, page, limit })
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: org } = await supabase
    .from('organizations')
    .select('id, plan_id')
    .eq('owner_id', user.id)
    .single()

  if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })

  // Enforce contact limit per plan
  const plan = PLANS[org.plan_id] ?? PLANS.starter
  if (plan.maxContacts !== Infinity) {
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id)

    if (count >= plan.maxContacts) {
      return Response.json(
        { error: `Your ${plan.name} plan allows ${plan.maxContacts.toLocaleString()} contacts. Upgrade to add more.` },
        { status: 403 }
      )
    }
  }

  const body = await request.json()
  const { first_name, last_name, email, phone, company, job_title,
          linkedin_url, website, status = 'lead', tags = [], notes = '', source = 'manual' } = body

  if (!first_name?.trim() && !email?.trim()) {
    return Response.json({ error: 'First name or email is required' }, { status: 400 })
  }

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      org_id: org.id,
      first_name: first_name?.trim() ?? '',
      last_name:  last_name?.trim()  ?? '',
      email:      email?.trim()      ?? '',
      phone:      phone?.trim()      ?? '',
      company:    company?.trim()    ?? '',
      job_title:  job_title?.trim()  ?? '',
      linkedin_url: linkedin_url?.trim() ?? '',
      website:    website?.trim()    ?? '',
      status,
      tags,
      notes,
      source,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })

  // Log creation activity
  await supabase.from('contact_activities').insert({
    contact_id: contact.id,
    type: 'note',
    content: 'Contact created',
  })

  return Response.json(contact, { status: 201 })
}
