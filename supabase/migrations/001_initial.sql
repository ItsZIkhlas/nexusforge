-- ============================================================
-- Nexus — Initial Schema
-- Run this in your Supabase SQL editor FIRST
-- ============================================================

-- Organizations (one per user account)
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  owner_id    uuid references auth.users(id) on delete cascade,
  plan        text not null default 'starter',
  created_at  timestamptz default now()
);

-- Bots (AI chatbot widgets)
create table bots (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid references organizations(id) on delete cascade,
  name             text not null default 'Assistant',
  color            text not null default '#6366f1',
  welcome_message  text not null default 'Hi! How can I help you today?',
  system_prompt    text,
  allowed_domains  text[],
  is_active        boolean default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- FAQ / Knowledge base items
create table faq_items (
  id         uuid primary key default gen_random_uuid(),
  bot_id     uuid references bots(id) on delete cascade,
  question   text not null,
  answer     text not null,
  created_at timestamptz default now()
);

-- Conversations (one per widget session)
create table conversations (
  id               uuid primary key default gen_random_uuid(),
  bot_id           uuid references bots(id) on delete cascade,
  visitor_id       text,
  started_at       timestamptz default now(),
  last_message_at  timestamptz default now()
);

-- Messages
create table messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid references conversations(id) on delete cascade,
  role             text check (role in ('user', 'assistant')),
  content          text not null,
  created_at       timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table organizations enable row level security;
alter table bots enable row level security;
alter table faq_items enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- Organizations: users only access their own
create policy "owner_all" on organizations for all
  using (owner_id = auth.uid());

-- Bots: users access bots in their org
create policy "org_owner_all" on bots for all
  using (
    org_id in (select id from organizations where owner_id = auth.uid())
  );

-- FAQ items: users manage their bots' FAQs
create policy "org_owner_all" on faq_items for all
  using (
    bot_id in (
      select b.id from bots b
      join organizations o on o.id = b.org_id
      where o.owner_id = auth.uid()
    )
  );

-- Conversations & messages: service role only (via API routes)

-- ============================================================
-- Auto-update updated_at on bots
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger bots_updated_at
  before update on bots
  for each row execute function update_updated_at();
