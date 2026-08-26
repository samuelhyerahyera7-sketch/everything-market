-- ═══════════════════════════════════════════════════════════════════
-- Everything Market — Ad Reports
-- Run in: Supabase → SQL Editor
-- Reports are already written by js/em-analytics.js (emReport) directly
-- against this table name. This migration makes the table (and the
-- columns the admin dashboard needs to review/action them) explicit.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reports (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id          text        NOT NULL,
  ad_title       text,
  reason         text,
  status         text        NOT NULL DEFAULT 'open'
                             CHECK (status IN ('open', 'actioned', 'dismissed')),
  admin_action   text,
  admin_notes    text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  resolved_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_reports_status     ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_ad_id       ON reports (ad_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at  ON reports (created_at DESC);
