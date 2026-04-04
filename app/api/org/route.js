import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: org } = await service
    .from('organizations')
    .select('resend_api_key, resend_from_name, resend_from_email, physical_address')
    .eq('owner_id', user.id)
    .single()

  return Response.json({
    hasKey:          !!org?.resend_api_key,
    fromName:        org?.resend_from_name   ?? '',
    fromEmail:       org?.resend_from_email  ?? '',
    physicalAddress: org?.physical_address   ?? '',
  })
}

export async function PATCH(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const allowed = ['name', 'resend_api_key', 'resend_from_name', 'resend_from_email', 'physical_address']
  const updates = {}
  for (const key of allowed) {
    if (key in body) {
      updates[key] = typeof body[key] === 'string' ? body[key].trim() : body[key]
    }
  }

  if ('name' in updates && !updates.name) {
    return Response.json({ error: 'Business name is required' }, { status: 400 })
  }

  if (!Object.keys(updates).length) {
    return Response.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('organizations')
    .update(updates)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
