-- Run this in Supabase → SQL Editor
-- Step 1: Add missing columns
ALTER TABLE ads ADD COLUMN IF NOT EXISTS user_id text;

-- Give the id column a default (timestamp-based bigint) so inserts without an id still work
ALTER TABLE ads ALTER COLUMN id SET DEFAULT floor(extract(epoch from now()) * 1000)::bigint;

-- Step 2: Enable RLS
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop old policies (if any exist)
DROP POLICY IF EXISTS "public_select"  ON ads;
DROP POLICY IF EXISTS "public_insert"  ON ads;
DROP POLICY IF EXISTS "owner_update"   ON ads;
DROP POLICY IF EXISTS "owner_delete"   ON ads;
DROP POLICY IF EXISTS "auth_insert"    ON ads;

-- Step 4: Allow anyone to read all ads
CREATE POLICY "public_select" ON ads FOR SELECT USING (true);

-- Step 5: Allow anyone to insert ads
CREATE POLICY "public_insert" ON ads FOR INSERT WITH CHECK (true);

-- Step 6: Allow owners to update their own ads
CREATE POLICY "owner_update" ON ads FOR UPDATE
  USING (user_id IS NULL OR auth.uid()::text = user_id);

-- Step 7: Allow owners to delete their own ads
CREATE POLICY "owner_delete" ON ads FOR DELETE
  USING (user_id IS NULL OR auth.uid()::text = user_id);
