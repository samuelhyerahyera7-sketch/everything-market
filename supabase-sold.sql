-- ═══════════════════════════════════════════════════════════════════
-- Everything Market — Mark as Sold
-- Run in: Supabase → SQL Editor
-- Adds the column api/edit-ad.js and api/load-ads.js rely on.
-- A sold ad stays public with a SOLD badge for 7 days, then is hidden.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE ads ADD COLUMN IF NOT EXISTS sold_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_ads_sold_at ON ads (sold_at);
