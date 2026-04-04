-- ============================================================
-- Nexus — Phase 6: Content Studio
-- Run in Supabase SQL editor
-- ============================================================

-- Brand profile (one per org)
create table if not exists brand_profiles (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid references organizations(id) on delete cascade unique,
  business_name        text,
  industry             text,
  description          text,           -- what the business does
  audience             text,           -- who they're targeting
  tone                 text default 'professional', -- professional | casual | bold | friendly
  keywords_include     text[],         -- words/phrases to always use
  keywords_exclude     text[],         -- words/phrases to never use
  platforms            text[],         -- ['linkedin', 'instagram']
  posts_per_week       jsonb default '{"linkedin": 2, "instagram": 3}',
  -- LinkedIn OAuth
  linkedin_access_token  text,
  linkedin_token_expiry  timestamptz,
  linkedin_person_urn    text,         -- urn:li:person:xxx
  linkedin_name          text,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Individual content posts
create table if not exists content_posts (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid references organizations(id) on delete cascade,
  platform      text not null,   -- 'linkedin' | 'instagram'
  body          text not null,
  hashtags      text,            -- for instagram
  status        text default 'pending', -- pending | approved | posted | rejected
  week_of       date,            -- Monday of the week this was generated for
  posted_at     timestamptz,
  linkedin_post_id text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Indexes
create index if not exists content_posts_org_id_idx    on content_posts(org_id);
create index if not exists content_posts_status_idx    on content_posts(status);
create index if not exists content_posts_week_of_idx   on content_posts(week_of);
create index if not exists brand_profiles_org_id_idx   on brand_profiles(org_id);

-- RLS
alter table brand_profiles enable row level security;
alter table content_posts   enable row level security;

create policy "org owner can manage brand profile"
  on brand_profiles for all
  using (org_id in (select id from organizations where owner_id = auth.uid()));

create policy "org owner can manage content posts"
  on content_posts for all
  using (org_id in (select id from organizations where owner_id = auth.uid()));
