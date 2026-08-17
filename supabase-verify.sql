-- ═══════════════════════════════════════════════════════════════════
-- Everything Market — Verification System Database Migration
-- Run in: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- 1. Phone verification sessions (WhatsApp-based)
CREATE TABLE IF NOT EXISTS phone_verifications (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL,
  token_hash     text        NOT NULL,
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','verified','expired','failed')),
  phone_number   text,
  wa_message_id  text        UNIQUE,
  attempts       integer     NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified_at    timestamptz,
  used_at        timestamptz
);

-- 2. Biometric verification records (one active record per user)
CREATE TABLE IF NOT EXISTS biometric_verifications (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid        NOT NULL UNIQUE,
  job_id                      text,
  status                      text        NOT NULL DEFAULT 'pending'
                                          CHECK (status IN ('pending','processing','approved','review','rejected')),
  decision                    text        CHECK (decision IN ('APPROVE','REVIEW','REJECT', NULL)),
  selfie_verified             boolean     NOT NULL DEFAULT false,
  id_face_match_verified      boolean     NOT NULL DEFAULT false,
  face_match_score            numeric(6,4),
  face_match_score_calibrated numeric(6,4),
  liveness_score              numeric(6,4),
  is_live                     boolean,
  challenge_passed            boolean,
  deepfake_suspicious         boolean,
  rejection_reason            text,
  verification_provider       text        DEFAULT 'biometrical-verify',
  verification_reference      text,
  -- Ed25519-signed evidence receipt from biometric service (do not expose to clients)
  receipt                     jsonb,
  admin_reviewed_by           text,
  admin_notes                 text,
  admin_reviewed_at           timestamptz,
  admin_decision              text        CHECK (admin_decision IN ('approved','rejected', NULL)),
  files_deleted_at            timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  verified_at                 timestamptz,
  expires_at                  timestamptz
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS bv_updated_at ON biometric_verifications;
CREATE TRIGGER bv_updated_at
  BEFORE UPDATE ON biometric_verifications
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

-- 3. Processed WhatsApp message IDs (prevents duplicate webhook processing)
CREATE TABLE IF NOT EXISTS wa_processed_messages (
  message_id   text        PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Verification attempt log (rate limiting + POPIA audit trail)
--    Does NOT store tokens, IDs, or biometric data — only metadata
CREATE TABLE IF NOT EXISTS verification_attempts (
  id           bigserial   PRIMARY KEY,
  user_id      uuid        NOT NULL,
  type         text        NOT NULL,  -- 'phone', 'biometric', 'phone_duplicate'
  ip           text,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pv_user_status    ON phone_verifications (user_id, status);
CREATE INDEX IF NOT EXISTS idx_pv_token_hash     ON phone_verifications (token_hash);
CREATE INDEX IF NOT EXISTS idx_pv_status_exp     ON phone_verifications (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_bv_user_id        ON biometric_verifications (user_id);
CREATE INDEX IF NOT EXISTS idx_bv_status         ON biometric_verifications (status);
CREATE INDEX IF NOT EXISTS idx_va_user_type_time ON verification_attempts (user_id, type, attempted_at);
CREATE INDEX IF NOT EXISTS idx_wpm_processed_at  ON wa_processed_messages (processed_at);

-- ── Row Level Security ───────────────────────────────────────────────
ALTER TABLE phone_verifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_verifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own verification rows
-- (service key bypasses RLS — used by all serverless functions)
DROP POLICY IF EXISTS "owner_select_pv" ON phone_verifications;
CREATE POLICY "owner_select_pv" ON phone_verifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_select_bv" ON biometric_verifications;
CREATE POLICY "owner_select_bv" ON biometric_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- ── Supabase Realtime ────────────────────────────────────────────────
-- Frontend subscribes to these tables for live status updates
ALTER PUBLICATION supabase_realtime ADD TABLE phone_verifications;
ALTER PUBLICATION supabase_realtime ADD TABLE biometric_verifications;

-- ── Scheduled cleanup (run manually or via pg_cron) ─────────────────
-- Expire pending phone sessions older than 10 minutes:
-- UPDATE phone_verifications SET status = 'expired'
-- WHERE status = 'pending' AND expires_at < now();

-- Clean old processed message IDs (>7 days):
-- DELETE FROM wa_processed_messages WHERE processed_at < now() - interval '7 days';

-- Clean old attempt logs (>90 days):
-- DELETE FROM verification_attempts WHERE attempted_at < now() - interval '90 days';

-- ── Supabase Storage Bucket ──────────────────────────────────────────
-- Create a PRIVATE bucket named 'biometric-temp' in Supabase Dashboard → Storage
-- Settings: not public, 25MB file size limit, allow: image/jpeg, image/png,
--           image/webp, video/mp4, video/webm
-- RLS policies for 'biometric-temp':
--   INSERT: auth.uid()::text = (storage.foldername(name))[1]
--   SELECT: false  (service role only via serverless functions)
--   DELETE: false  (service role only via serverless functions)
