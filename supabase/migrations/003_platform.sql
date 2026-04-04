-- ============================================================
-- Nexus — Full Platform Schema
-- Run this in Supabase SQL editor AFTER 002_stripe.sql
-- ============================================================

-- ── CRM ──────────────────────────────────────────────────────

create table contacts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade,
  first_name  text,
  last_name   text,
  email       text,
  phone       text,
  company     text,
  job_title   text,
  linkedin_url text,
  website     text,
  status      text default 'lead',  -- lead, contacted, interested, negotiating, won, lost
  tags        text[],
  notes       text,
  source      text default 'manual',  -- manual, lead_finder, chat_capture, import
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Deal Pipeline
create table deals (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade,
  contact_id  uuid references contacts(id) on delete set null,
  title       text not null,
  value       numeric,
  stage       text default 'lead',  -- lead, contacted, interested, negotiating, won, lost
  position    integer default 0,    -- kanban ordering
  closed_at   timestamptz,
  created_at  timestamptz default now()
);

-- Contact Activity Log
create table contact_activities (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid references contacts(id) on delete cascade,
  type        text,  -- note, email_sent, status_change, call, meeting
  content     text,
  created_at  timestamptz default now()
);

-- ── Email Outreach ───────────────────────────────────────────

create table email_sequences (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid references organizations(id) on delete cascade,
  name       text not null,
  status     text default 'draft',  -- draft, active, paused
  created_at timestamptz default now()
);

create table sequence_steps (
  id           uuid primary key default gen_random_uuid(),
  sequence_id  uuid references email_sequences(id) on delete cascade,
  step_number  integer not null,
  delay_days   integer default 0,  -- days after previous step
  subject      text not null,
  body         text not null
);

create table sequence_enrollments (
  id           uuid primary key default gen_random_uuid(),
  sequence_id  uuid references email_sequences(id) on delete cascade,
  contact_id   uuid references contacts(id) on delete cascade,
  current_step integer default 0,
  status       text default 'active',  -- active, completed, unsubscribed, replied
  enrolled_at  timestamptz default now(),
  next_send_at timestamptz
);

create table email_events (
  id            uuid primary key default gen_random_uuid(),
  enrollment_id uuid references sequence_enrollments(id) on delete cascade,
  step_number   integer,
  event_type    text,  -- sent, opened, clicked, replied, bounced
  occurred_at   timestamptz default now()
);

-- ── Lead Finder ──────────────────────────────────────────────

create table lead_searches (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid references organizations(id) on delete cascade,
  query         jsonb,   -- { keyword, industry, location, companySize }
  results_count integer,
  credits_used  integer,
  created_at    timestamptz default now()
);

-- ── Website Builder ──────────────────────────────────────────

create table websites (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid references organizations(id) on delete cascade,
  name          text not null,
  slug          text unique not null,
  custom_domain text,
  is_published  boolean default false,
  blocks        jsonb default '[]',  -- array of section blocks
  meta          jsonb default '{}',  -- { title, description, favicon }
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── Content Studio ───────────────────────────────────────────

create table content_drafts (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid references organizations(id) on delete cascade,
  type       text,  -- blog, linkedin, instagram, email, ad, product_desc
  title      text,
  content    text,
  created_at timestamptz default now()
);

-- ── Lead Credits (on organizations) ─────────────────────────

alter table organizations
  add column if not exists lead_credits_used     integer default 0,
  add column if not exists lead_credits_reset_at timestamptz default (date_trunc('month', now()) + interval '1 month');

-- ── Row Level Security ───────────────────────────────────────

alter table contacts enable row level security;
alter table deals enable row level security;
alter table contact_activities enable row level security;
alter table email_sequences enable row level security;
alter table sequence_steps enable row level security;
alter table sequence_enrollments enable row level security;
alter table email_events enable row level security;
alter table lead_searches enable row level security;
alter table websites enable row level security;
alter table content_drafts enable row level security;

-- Contacts
create policy "org_owner_all" on contacts for all
  using (org_id in (select id from organizations where owner_id = auth.uid()));

-- Deals
create policy "org_owner_all" on deals for all
  using (org_id in (select id from organizations where owner_id = auth.uid()));

-- Contact activities
create policy "org_owner_all" on contact_activities for all
  using (
    contact_id in (
      select c.id from contacts c
      join organizations o on o.id = c.org_id
      where o.owner_id = auth.uid()
    )
  );

-- Email sequences
create policy "org_owner_all" on email_sequences for all
  using (org_id in (select id from organizations where owner_id = auth.uid()));

-- Sequence steps
create policy "org_owner_all" on sequence_steps for all
  using (
    sequence_id in (
      select s.id from email_sequences s
      join organizations o on o.id = s.org_id
      where o.owner_id = auth.uid()
    )
  );

-- Sequence enrollments (service role handles scheduling, but user can view)
create policy "org_owner_all" on sequence_enrollments for all
  using (
    sequence_id in (
      select s.id from email_sequences s
      join organizations o on o.id = s.org_id
      where o.owner_id = auth.uid()
    )
  );

-- Email events
create policy "org_owner_all" on email_events for all
  using (
    enrollment_id in (
      select e.id from sequence_enrollments e
      join email_sequences s on s.id = e.sequence_id
      join organizations o on o.id = s.org_id
      where o.owner_id = auth.uid()
    )
  );

-- Lead searches
create policy "org_owner_all" on lead_searches for all
  using (org_id in (select id from organizations where owner_id = auth.uid()));

-- Websites
create policy "org_owner_all" on websites for all
  using (org_id in (select id from organizations where owner_id = auth.uid()));

-- Content drafts
create policy "org_owner_all" on content_drafts for all
  using (org_id in (select id from organizations where owner_id = auth.uid()));

-- ── Auto-update updated_at ───────────────────────────────────

create trigger contacts_updated_at
  before update on contacts
  for each row execute function update_updated_at();

create trigger websites_updated_at
  before update on websites
  for each row execute function update_updated_at();
