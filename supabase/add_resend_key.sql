-- Add per-org Resend API key for custom sending domains
-- Run in: Supabase Dashboard → SQL Editor

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS resend_api_key text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS resend_from_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS resend_from_email text DEFAULT NULL;
