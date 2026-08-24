-- ═══════════════════════════════════════════════════════════════════
-- Everything Market — Account/Listing Suspension
-- Run in: Supabase → SQL Editor
-- Adds the column api/suspend-user.js and api/load-ads.js rely on to
-- hide a suspended seller's listings from the public marketplace.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE ads ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ads_suspended ON ads (suspended);
