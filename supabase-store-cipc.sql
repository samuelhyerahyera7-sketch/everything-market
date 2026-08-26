-- ═══════════════════════════════════════════════════════════════════
-- Everything Market — CIPC Registration Number on Store Applications
-- Run in: Supabase → SQL Editor
-- Adds the column api/apply-store.js writes to and admin.html displays.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE store_applications ADD COLUMN IF NOT EXISTS cipc_number text;
