-- ─────────────────────────────────────────────────────────────────────────────
-- Compliance Migration — CAN-SPAM / GDPR safeguards
-- Run this once in your Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add unsubscribe & cooldown tracking to contacts
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS unsubscribe_token UUID DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS unsubscribed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_emailed_at   TIMESTAMPTZ;

-- 2. Physical mailing address for CAN-SPAM email footer
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS physical_address TEXT;

-- 3. Fast token-based unsubscribe lookups
CREATE INDEX IF NOT EXISTS idx_contacts_unsubscribe_token
  ON contacts(unsubscribe_token);

-- 4. Fast cooldown checks (org + recency)
CREATE INDEX IF NOT EXISTS idx_contacts_last_emailed
  ON contacts(org_id, last_emailed_at);

-- 5. Backfill: generate tokens for any existing contacts that don't have one
UPDATE contacts
SET unsubscribe_token = gen_random_uuid()
WHERE unsubscribe_token IS NULL;
