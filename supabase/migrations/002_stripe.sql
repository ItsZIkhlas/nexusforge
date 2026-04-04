-- ============================================================
-- Nexus — Stripe Billing Columns
-- Run this in Supabase SQL editor AFTER 001_initial.sql
-- ============================================================

alter table organizations
  add column if not exists stripe_customer_id      text,
  add column if not exists stripe_subscription_id  text,
  add column if not exists subscription_status     text not null default 'trialing',
  add column if not exists plan_id                 text not null default 'starter',
  add column if not exists trial_ends_at           timestamptz default (now() + interval '14 days');

-- subscription_status values:
--   trialing   → free trial, full access
--   active     → paying customer
--   past_due   → payment failed, grace period
--   canceled   → subscription ended
--   inactive   → never subscribed
