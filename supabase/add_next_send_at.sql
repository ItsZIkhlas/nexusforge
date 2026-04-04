-- Add next_send_at to email_enrollments
-- Run in: Supabase Dashboard → SQL Editor

ALTER TABLE email_enrollments
  ADD COLUMN IF NOT EXISTS next_send_at TIMESTAMPTZ DEFAULT now();

-- Index so the cron query (WHERE status='active' AND next_send_at <= now()) is fast
CREATE INDEX IF NOT EXISTS idx_enrollments_cron
  ON email_enrollments(next_send_at)
  WHERE status = 'active';
