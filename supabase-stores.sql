-- ═══════════════════════════════════════════════════════════════════
-- Everything Market — Store Applications
-- Run in: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS store_applications (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL UNIQUE,
  user_email       text,
  store_name       text        NOT NULL,
  store_description text,
  store_type       text        NOT NULL DEFAULT 'retail'
                               CHECK (store_type IN ('retail','dealership','services','wholesale','other')),
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','approved','rejected')),
  applied_at       timestamptz NOT NULL DEFAULT now(),
  reviewed_at      timestamptz,
  reviewed_by      text,
  rejection_reason text,
  approved_at      timestamptz
);

CREATE INDEX IF NOT EXISTS idx_sa_status     ON store_applications (status);
CREATE INDEX IF NOT EXISTS idx_sa_user_id    ON store_applications (user_id);

-- RLS: users can only read their own application
ALTER TABLE store_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_select_sa" ON store_applications;
CREATE POLICY "owner_select_sa" ON store_applications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_insert_sa" ON store_applications;
CREATE POLICY "owner_insert_sa" ON store_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
