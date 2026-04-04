-- ─────────────────────────────────────────────────────────────────────────────
-- Content Studio Feature Migrations
-- Run this in your Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Personal Brand OS — new columns on brand_profiles ─────────────────────
ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS content_pillars  text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS positioning      text,
  ADD COLUMN IF NOT EXISTS brand_mission    text;

-- ── 2. Content Funnels ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_funnels (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        text          NOT NULL,
  goal        text,
  platform    text          NOT NULL DEFAULT 'linkedin',
  stages      jsonb         NOT NULL DEFAULT '[]',
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_funnels_org_id_idx ON content_funnels(org_id);

-- RLS
ALTER TABLE content_funnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage funnels"
  ON content_funnels FOR ALL
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- ── 3. Content Experiments ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_experiments (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text          NOT NULL,
  hypothesis      text,
  platform        text          NOT NULL DEFAULT 'linkedin',
  variant_a_body  text          NOT NULL,
  variant_b_body  text          NOT NULL,
  status          text          NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'complete')),
  winner          text          CHECK (winner IN ('a', 'b')),
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_experiments_org_id_idx ON content_experiments(org_id);

-- RLS
ALTER TABLE content_experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage experiments"
  ON content_experiments FOR ALL
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- ── 4. Tags on content_posts (for Assets Library) ────────────────────────────
ALTER TABLE content_posts
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
