/**
 * Cron: /api/cron/video-pipeline
 * Runs every 15 minutes (set in vercel.json or via external cron).
 *
 * Three phases per run:
 *   1. Fire due schedules → generate script+caption → submit to HeyGen → create job (status=generating)
 *   2. Poll HeyGen for generating jobs → when done, set status=ready + store video URL
 *   3. Post ready jobs to connected platforms → set status=posted
 */

import { createServiceClient } from '@/lib/supabase/service'
import { groq, DEFAULT_MODEL } from '@/lib/groq'

const HEYGEN_BASE = 'https://api.heygen.com'
const GRAPH       = 'https://graph.facebook.com/v19.0'
const TIKTOK_BASE = 'https://open.tiktokapis.com/v2'
const MAX_POLL    = 40 // give up after 40 poll attempts (~10 hours)

// ─── Auth guard ──────────────────────────────────────────────────────────────

function authorized(request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true // dev mode
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${cronSecret}`
}

// ─── Groq helpers ────────────────────────────────────────────────────────────

async function generateScriptAndCaption(topic, brandVoice, videoLength) {
  const lengthWords = videoLength <= 30 ? '60-80' : videoLength <= 60 ? '120-150' : '200-240'

  const scriptRes = await groq.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a social media video scriptwriter. Write engaging spoken scripts for short-form video.
${brandVoice ? `Brand voice: ${brandVoice}` : ''}
Rules: No stage directions. No [brackets]. Just the words the presenter speaks. Hook in the first sentence. ${lengthWords} words.`,
      },
      { role: 'user', content: `Write a video script about: ${topic}` },
    ],
  })

  const captionRes = await groq.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a social media copywriter. Write engaging captions for short-form video posts.
${brandVoice ? `Brand voice: ${brandVoice}` : ''}
Format: 2-3 punchy sentences + 5-8 relevant hashtags on a new line. Under 200 characters before hashtags.`,
      },
      { role: 'user', content: `Write a caption for a video about: ${topic}` },
    ],
  })

  const script  = scriptRes.choices[0]?.message?.content?.trim()  ?? ''
  const caption = captionRes.choices[0]?.message?.content?.trim() ?? ''
  return { script, caption }
}

// ─── HeyGen helpers ──────────────────────────────────────────────────────────

async function submitHeyGen(script, avatarId, voiceId, apiKey) {
  const body = {
    video_inputs: [{
      character: {
        type:      'avatar',
        avatar_id: avatarId,
        ...(voiceId ? { voice_id: voiceId } : {}),
      },
      voice: {
        type:       'text',
        input_text: script,
        ...(voiceId ? { voice_id: voiceId } : {}),
      },
    }],
    dimension: { width: 1080, height: 1920 }, // vertical for Reels/TikTok
    aspect_ratio: null,
  }

  const res  = await fetch(`${HEYGEN_BASE}/v2/video/generate`, {
    method:  'POST',
    headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const data = await res.json()
  return data.data?.video_id ?? null
}

async function pollHeyGen(videoId, apiKey) {
  const res  = await fetch(`${HEYGEN_BASE}/v1/video_status.get?video_id=${videoId}`, {
    headers: { 'X-Api-Key': apiKey },
  })
  const data = await res.json()
  const info = data.data ?? {}
  return {
    status:    info.status,      // 'pending'|'processing'|'completed'|'failed'
    videoUrl:  info.video_url    ?? null,
    thumbUrl:  info.thumbnail_url ?? null,
  }
}

// ─── Platform posting helpers ─────────────────────────────────────────────────

async function postToInstagram(igAccountId, accessToken, videoUrl, caption) {
  // Step 1: create container
  const createRes = await fetch(`${GRAPH}/${igAccountId}/media`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type:  'REELS',
      video_url:   videoUrl,
      caption,
      share_to_feed: true,
      access_token: accessToken,
    }),
  })
  const createData = await createRes.json()
  const creationId = createData.id
  if (!creationId) throw new Error(`IG container failed: ${JSON.stringify(createData)}`)

  // Step 2: wait for video processing (poll up to 60s)
  let ready = false
  for (let i = 0; i < 12; i++) {
    await delay(5000)
    const statusRes  = await fetch(`${GRAPH}/${creationId}?fields=status_code&access_token=${accessToken}`)
    const statusData = await statusRes.json()
    if (statusData.status_code === 'FINISHED') { ready = true; break }
    if (statusData.status_code === 'ERROR') throw new Error('IG video processing failed')
  }
  if (!ready) throw new Error('IG video processing timed out')

  // Step 3: publish
  const pubRes  = await fetch(`${GRAPH}/${igAccountId}/media_publish`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: creationId, access_token: accessToken }),
  })
  const pubData = await pubRes.json()
  if (!pubData.id) throw new Error(`IG publish failed: ${JSON.stringify(pubData)}`)
  return pubData.id
}

async function postToFacebook(pageId, accessToken, videoUrl, caption) {
  const res = await fetch(`${GRAPH}/${pageId}/videos`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_url:     videoUrl,
      description:  caption,
      access_token: accessToken,
    }),
  })
  const data = await res.json()
  if (!data.id) throw new Error(`FB post failed: ${JSON.stringify(data)}`)
  return data.id
}

async function postToTikTok(accessToken, videoUrl, caption) {
  // Init upload
  const initRes = await fetch(`${TIKTOK_BASE}/post/publish/video/init/`, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({
      post_info: {
        title:        caption.slice(0, 150),
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet:  false,
        disable_comment: false,
        disable_stitch:  false,
      },
      source_info: {
        source:        'PULL_FROM_URL',
        video_url:     videoUrl,
        video_size:    0,
        chunk_size:    0,
        total_chunk_count: 0,
      },
    }),
  })
  const initData = await initRes.json()
  const publishId = initData.data?.publish_id
  if (!publishId) throw new Error(`TikTok init failed: ${JSON.stringify(initData)}`)

  // Poll for completion
  for (let i = 0; i < 24; i++) {
    await delay(5000)
    const statusRes = await fetch(`${TIKTOK_BASE}/post/publish/status/fetch/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ publish_id: publishId }),
    })
    const statusData = await statusRes.json()
    const st = statusData.data?.status
    if (st === 'PUBLISH_COMPLETE') return publishId
    if (st === 'FAILED') throw new Error(`TikTok publish failed: ${statusData.data?.fail_reason ?? 'unknown'}`)
  }
  throw new Error('TikTok publish timed out')
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function GET(request) {
  if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const now      = new Date().toISOString()
  const results  = { phase1: 0, phase2: 0, phase3: 0, errors: [] }

  // ── Phase 1: Fire due schedules ─────────────────────────────────────────────
  const { data: dueSchedules } = await supabase
    .from('video_schedules')
    .select('*, organizations!inner(id, owner_id)')
    .eq('status', 'active')
    .lte('next_run_at', now)
    .limit(10) // process max 10 per run

  for (const schedule of dueSchedules ?? []) {
    try {
      const orgId = schedule.org_id

      // Get HeyGen API key from brand_profiles
      const { data: brand } = await supabase
        .from('brand_profiles')
        .select('heygen_api_key')
        .eq('org_id', orgId)
        .maybeSingle()

      const heygenKey = brand?.heygen_api_key?.trim()
      if (!heygenKey) throw new Error('No HeyGen API key')
      if (!schedule.avatar_id) throw new Error('No avatar ID set on schedule')

      // Pick next topic (rotate through list)
      const { count: jobCount } = await supabase
        .from('video_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('schedule_id', schedule.id)

      const topic = schedule.topics[(jobCount ?? 0) % schedule.topics.length]

      // Generate script + caption
      const { script, caption } = await generateScriptAndCaption(
        topic,
        schedule.brand_voice,
        schedule.video_length
      )

      // Submit to HeyGen
      const heygenVideoId = await submitHeyGen(
        script,
        schedule.avatar_id,
        schedule.voice_id,
        heygenKey
      )
      if (!heygenVideoId) throw new Error('HeyGen returned no video_id')

      // Create job record
      await supabase.from('video_jobs').insert({
        org_id:          orgId,
        schedule_id:     schedule.id,
        topic,
        script,
        caption,
        platforms:       schedule.platforms,
        heygen_video_id: heygenVideoId,
        status:          'generating',
      })

      // Advance next_run_at
      await supabase.from('video_schedules').update({
        last_run_at: now,
        next_run_at: computeNextRunFrom(schedule.frequency, schedule.post_time, new Date()),
      }).eq('id', schedule.id)

      results.phase1++
    } catch (err) {
      results.errors.push(`schedule ${schedule.id}: ${err.message}`)
      // Don't let one failure block others
    }
  }

  // ── Phase 2: Poll HeyGen for generating jobs ─────────────────────────────────
  const { data: generatingJobs } = await supabase
    .from('video_jobs')
    .select('id, org_id, heygen_video_id, poll_attempts')
    .eq('status', 'generating')
    .lt('poll_attempts', MAX_POLL)
    .limit(20)

  for (const job of generatingJobs ?? []) {
    try {
      const { data: brand } = await supabase
        .from('brand_profiles')
        .select('heygen_api_key')
        .eq('org_id', job.org_id)
        .maybeSingle()

      const heygenKey = brand?.heygen_api_key?.trim()
      if (!heygenKey) continue

      const { status, videoUrl, thumbUrl } = await pollHeyGen(job.heygen_video_id, heygenKey)

      const updates = { poll_attempts: (job.poll_attempts ?? 0) + 1 }

      if (status === 'completed' && videoUrl) {
        updates.status            = 'ready'
        updates.heygen_video_url  = videoUrl
        updates.thumbnail_url     = thumbUrl ?? null
        results.phase2++
      } else if (status === 'failed') {
        updates.status = 'failed'
        updates.error  = 'HeyGen reported failure'
      }

      await supabase.from('video_jobs').update(updates).eq('id', job.id)
    } catch (err) {
      results.errors.push(`poll job ${job.id}: ${err.message}`)
    }
  }

  // ── Phase 3: Post ready jobs to platforms ─────────────────────────────────────
  const { data: readyJobs } = await supabase
    .from('video_jobs')
    .select('*')
    .eq('status', 'ready')
    .limit(10)

  for (const job of readyJobs ?? []) {
    try {
      // Get social connections for this org
      const { data: connections } = await supabase
        .from('org_social_connections')
        .select('*')
        .eq('org_id', job.org_id)

      const connByPlatform = {}
      for (const c of connections ?? []) connByPlatform[c.platform] = c

      const postIds = {}
      const platforms = job.platforms ?? []

      await supabase.from('video_jobs').update({ status: 'posting' }).eq('id', job.id)

      for (const platform of platforms) {
        try {
          if (platform === 'instagram') {
            const conn = connByPlatform['meta']
            if (!conn?.instagram_account_id) throw new Error('Instagram not connected')
            postIds.instagram = await postToInstagram(
              conn.instagram_account_id,
              conn.access_token,
              job.heygen_video_url,
              job.caption
            )
          } else if (platform === 'facebook') {
            const conn = connByPlatform['meta']
            if (!conn?.facebook_page_id) throw new Error('Facebook page not connected')
            postIds.facebook = await postToFacebook(
              conn.facebook_page_id,
              conn.access_token,
              job.heygen_video_url,
              job.caption
            )
          } else if (platform === 'tiktok') {
            const conn = connByPlatform['tiktok']
            if (!conn?.access_token) throw new Error('TikTok not connected')
            postIds.tiktok = await postToTikTok(
              conn.access_token,
              job.heygen_video_url,
              job.caption
            )
          }
        } catch (platformErr) {
          results.errors.push(`job ${job.id} platform ${platform}: ${platformErr.message}`)
          postIds[`${platform}_error`] = platformErr.message
        }
      }

      const allFailed = platforms.every(p => postIds[`${p}_error`])
      await supabase.from('video_jobs').update({
        status:    allFailed ? 'failed' : 'posted',
        post_ids:  postIds,
        posted_at: allFailed ? null : new Date().toISOString(),
        error:     allFailed ? 'All platforms failed' : null,
      }).eq('id', job.id)

      if (!allFailed) results.phase3++
    } catch (err) {
      results.errors.push(`post job ${job.id}: ${err.message}`)
      await supabase.from('video_jobs').update({ status: 'failed', error: err.message }).eq('id', job.id)
    }
  }

  return Response.json({ ok: true, ...results })
}

function computeNextRunFrom(frequency, postTime, fromDate) {
  const [hours, minutes] = (postTime || '10:00').split(':').map(Number)
  const next = new Date(fromDate)
  next.setHours(hours, minutes, 0, 0)

  const daysToAdd = frequency === 'weekly' ? 7 : frequency === '3x_week' ? 2 : 1
  next.setDate(next.getDate() + daysToAdd)
  return next.toISOString()
}
