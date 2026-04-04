-- ── Phase 6: Content Studio ────────────────────────────────────────────────────

-- Brand profile (one per org)
CREATE TABLE IF NOT EXISTS brand_profiles (
  org_id                  UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  business_name           TEXT,
  industry                TEXT,
  description             TEXT,
  audience                TEXT,
  tone                    TEXT DEFAULT 'professional',
  keywords_include        TEXT[],
  keywords_exclude        TEXT[],
  platforms               TEXT[]  DEFAULT ARRAY['linkedin'],
  posts_per_week          JSONB   DEFAULT '{"linkedin": 2, "instagram": 3}',
  -- LinkedIn OAuth
  linkedin_access_token   TEXT,
  linkedin_token_expiry   TIMESTAMPTZ,
  linkedin_person_urn     TEXT,
  linkedin_name           TEXT,
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- Content posts
CREATE TABLE IF NOT EXISTS content_posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID REFERENCES organizations(id) ON DELETE CASCADE,
  platform         TEXT NOT NULL,   -- linkedin | instagram
  body             TEXT NOT NULL,
  hashtags         TEXT,
  status           TEXT DEFAULT 'pending',  -- pending | approved | posted | rejected
  week_of          DATE,
  linkedin_post_id TEXT,
  posted_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── Row Level Security ─────────────────────────────────────────────────────────

ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts  ENABLE ROW LEVEL SECURITY;

-- brand_profiles: owner can read/write their org's profile
CREATE POLICY "brand_profiles_owner" ON brand_profiles
  FOR ALL USING (
    org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
  );

-- content_posts: owner can read/write their org's posts
CREATE POLICY "content_posts_owner" ON content_posts
  FOR ALL USING (
    org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
  );

-- ── Indexes ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS content_posts_org_status ON content_posts (org_id, status);
CREATE INDEX IF NOT EXISTS content_posts_week       ON content_posts (org_id, week_of);
