-- Run this in Supabase → SQL Editor
-- Fixes RLS policies so ads can be inserted and read by everyone

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon + authenticated) to read all ads
DROP POLICY IF EXISTS "public_select" ON ads;
CREATE POLICY "public_select" ON ads FOR SELECT USING (true);

-- Allow anyone to insert ads (server uses service key which bypasses this anyway)
DROP POLICY IF EXISTS "public_insert" ON ads;
CREATE POLICY "public_insert" ON ads FOR INSERT WITH CHECK (true);

-- Allow ad owners to update their own ads
DROP POLICY IF EXISTS "owner_update" ON ads;
CREATE POLICY "owner_update" ON ads FOR UPDATE USING (auth.uid()::text = user_id OR user_id IS NULL);

-- Allow ad owners to delete their own ads
DROP POLICY IF EXISTS "owner_delete" ON ads;
CREATE POLICY "owner_delete" ON ads FOR DELETE USING (auth.uid()::text = user_id OR user_id IS NULL);
