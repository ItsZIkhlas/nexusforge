import { createClient } from '@/lib/supabase/server'

// GET /api/content/videos/avatars — fetch available avatars from HeyGen
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single()
  if (!org?.id) return Response.json({ error: 'No org' }, { status: 400 })

  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('heygen_api_key')
    .eq('org_id', org.id)
    .maybeSingle()

  const heygenKey = brand?.heygen_api_key
  if (!heygenKey) return Response.json({ error: 'No HeyGen API key' }, { status: 400 })

  try {
    const res = await fetch('https://api.heygen.com/v2/avatars', {
      headers: { 'X-Api-Key': heygenKey },
    })
    const data = await res.json()

    if (!res.ok) return Response.json({ error: data.message ?? 'HeyGen error' }, { status: res.status })

    // Return simplified avatar list
    const avatars = (data.data?.avatars ?? []).map(a => ({
      id:        a.avatar_id,
      name:      a.avatar_name,
      gender:    a.gender,
      thumbnail: a.preview_image_url ?? a.preview_video_url ?? null,
    }))

    return Response.json(avatars)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
