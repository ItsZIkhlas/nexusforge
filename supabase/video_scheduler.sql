-- ─────────────────────────────────────────────────────────────────────────────
-- Video Scheduler Migration
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Stores OAuth tokens for Meta (Instagram+Facebook) and TikTok per org
CREATE TABLE IF NOT EXISTS org_social_connections (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform             text NOT NULL,           -- 'meta' | 'tiktok'
  access_token         text NOT NULL,
  refresh_token        text,
  token_expires_at     timestamptz,
  platform_user_id     text,
  platform_username    text,
  -- Meta-specific
  instagram_account_id text,
  facebook_page_id     text,
  facebook_page_name   text,
  -- TikTok-specific
  tiktok_open_id       text,
  connected_at         timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  UNIQUE(org_id, platform)
);

ALTER TABLE org_social_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_social_connections_owner" ON org_social_connections
  USING (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- Stores recurring video schedule configs
CREATE TABLE IF NOT EXISTS video_schedules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name         text NOT NULL DEFAULT 'My Video Schedule',
  platforms    text[] NOT NULL DEFAULT '{}',   -- ['instagram','facebook','tiktok']
  frequency    text NOT NULL DEFAULT 'daily',  -- 'daily'|'3x_week'|'weekly'
  post_time    text NOT NULL DEFAULT '10:00',  -- HH:MM local time
  topics       text[] NOT NULL DEFAULT '{}',   -- rotating topic list
  brand_voice  text,                           -- tone/style instructions
  avatar_id    text,                           -- HeyGen avatar ID
  voice_id     text,                           -- HeyGen voice ID
  video_length integer NOT NULL DEFAULT 60,    -- seconds: 30|60|90
  status       text NOT NULL DEFAULT 'active', -- 'active'|'paused'
  next_run_at  timestamptz,
  last_run_at  timestamptz,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE video_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "video_schedules_owner" ON video_schedules
  USING (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- Stores individual video job runs (one per schedule fire or manual trigger)
CREATE TABLE IF NOT EXISTS video_jobs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  schedule_id      uuid REFERENCES video_schedules(id) ON DELETE SET NULL,
  topic            text,
  script           text,
  caption          text,
  hashtags         text,
  platforms        text[] NOT NULL DEFAULT '{}',
  heygen_video_id  text,
  heygen_video_url text,
  thumbnail_url    text,
  -- status flow: queued → generating → ready → posting → posted | failed
  status           text NOT NULL DEFAULT 'queued',
  error            text,
  -- per-platform post IDs after successful post
  post_ids         jsonb DEFAULT '{}',
  poll_attempts    integer DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  posted_at        timestamptz
);

ALTER TABLE video_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "video_jobs_owner" ON video_jobs
  USING (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- Indexes for cron queries
CREATE INDEX IF NOT EXISTS video_schedules_next_run ON video_schedules(next_run_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS video_jobs_status ON video_jobs(status);
CREATE INDEX IF NOT EXISTS video_jobs_org ON video_jobs(org_id);
