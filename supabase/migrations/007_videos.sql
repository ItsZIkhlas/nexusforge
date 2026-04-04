-- ── Phase 6b: AI Video Projects ───────────────────────────────────────────────

-- Add HeyGen API key to brand_profiles
ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS heygen_api_key TEXT;

-- Video projects table
CREATE TABLE IF NOT EXISTS video_projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title            TEXT,
  script           TEXT,
  platform         TEXT DEFAULT 'instagram',  -- instagram | linkedin
  avatar_id        TEXT,
  avatar_name      TEXT,
  heygen_video_id  TEXT,
  status           TEXT DEFAULT 'draft',       -- draft | generating | ready | failed
  video_url        TEXT,
  thumbnail_url    TEXT,
  duration_secs    INT,
  error_msg        TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS video_projects_org_id_idx ON video_projects (org_id);
CREATE INDEX IF NOT EXISTS video_projects_status_idx ON video_projects (org_id, status);

ALTER TABLE video_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org owner can manage video projects"
  ON video_projects FOR ALL
  USING (org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));
