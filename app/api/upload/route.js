import { createClient } from '@/lib/supabase/server'

export const config = { api: { bodyParser: false } }

// POST /api/upload — upload a JPG image to Supabase Storage, return public URL
export async function POST(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'jpg' && ext !== 'jpeg') {
      return Response.json({ error: 'Only JPG images are accepted.' }, { status: 400 })
    }

    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const path   = `uploads/${user.id}/${Date.now()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, buffer, { contentType: 'image/jpeg', upsert: false })

    if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)

    return Response.json({ url: publicUrl })
  } catch (e) {
    console.error('[upload]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
