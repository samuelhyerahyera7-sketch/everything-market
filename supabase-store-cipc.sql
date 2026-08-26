-- ═══════════════════════════════════════════════════════════════════
-- Everything Market — CIPC Registration Number + Certificate Upload
-- Run in: Supabase → SQL Editor
-- Adds the columns api/apply-store.js writes to and admin.html displays.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE store_applications ADD COLUMN IF NOT EXISTS cipc_number text;
ALTER TABLE store_applications ADD COLUMN IF NOT EXISTS cipc_certificate_path text;

-- ── Supabase Storage Bucket ──────────────────────────────────────────
-- Create a PRIVATE bucket named 'store-documents' in Supabase Dashboard →
-- Storage. Settings: not public, 10MB file size limit, allow:
--           application/pdf, image/jpeg, image/png
-- RLS policies for 'store-documents':
--   INSERT: false  (service role only, via api/apply-store.js)
--   SELECT: false  (service role only, via api/admin-store-document.js)
--   DELETE: false  (service role only)
