-- ─────────────────────────────────────────────────────────────
-- Phase 4 — Email Outreach tables
-- Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Campaigns
create table if not exists email_campaigns (
  id          uuid  default gen_random_uuid() primary key,
  org_id      uuid  references organizations(id) on delete cascade not null,
  name        text  not null,
  status      text  default 'draft' check (status in ('draft','active','paused')),
  from_name   text  default '',
  from_email  text  default '',
  reply_to    text  default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table email_campaigns enable row level security;
create policy "owner access" on email_campaigns for all
  using (org_id in (select id from organizations where owner_id = auth.uid()));

-- 2. Sequence steps
create table if not exists email_steps (
  id           uuid  default gen_random_uuid() primary key,
  campaign_id  uuid  references email_campaigns(id) on delete cascade not null,
  step_number  int   not null,
  subject      text  default '',
  body         text  default '',
  delay_days   int   default 0,
  created_at   timestamptz default now()
);
alter table email_steps enable row level security;
create policy "owner access" on email_steps for all
  using (campaign_id in (
    select id from email_campaigns
    where org_id in (select id from organizations where owner_id = auth.uid())
  ));

-- 3. Enrollments (contact ↔ campaign)
create table if not exists email_enrollments (
  id           uuid  default gen_random_uuid() primary key,
  campaign_id  uuid  references email_campaigns(id) on delete cascade not null,
  contact_id   uuid  references contacts(id) on delete cascade not null,
  org_id       uuid  references organizations(id) on delete cascade not null,
  status       text  default 'active'
                 check (status in ('active','completed','unsubscribed','bounced')),
  current_step int   default 1,
  enrolled_at  timestamptz default now(),
  unique(campaign_id, contact_id)
);
alter table email_enrollments enable row level security;
create policy "owner access" on email_enrollments for all
  using (org_id in (select id from organizations where owner_id = auth.uid()));

-- 4. Individual email sends
create table if not exists email_sends (
  id             uuid  default gen_random_uuid() primary key,
  enrollment_id  uuid  references email_enrollments(id) on delete cascade,
  step_id        uuid  references email_steps(id),
  contact_id     uuid  references contacts(id) on delete cascade,
  org_id         uuid  references organizations(id) on delete cascade,
  resend_id      text,
  subject        text,
  status         text  default 'sent',
  sent_at        timestamptz default now()
);
alter table email_sends enable row level security;
create policy "owner access" on email_sends for all
  using (org_id in (select id from organizations where owner_id = auth.uid()));
