-- ═══════════════════════════════════════════════════════════════════
-- Everything Market — Store System Tables
-- Run in: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- 1. Custom categories per store
CREATE TABLE IF NOT EXISTS store_categories (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   uuid        NOT NULL,
  name       text        NOT NULL,
  sort_order integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sc_store_id ON store_categories (store_id, sort_order);

-- 2. Store products (separate from general classified ads)
CREATE TABLE IF NOT EXISTS store_products (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     uuid        NOT NULL,
  user_id      uuid        NOT NULL,
  title        text        NOT NULL,
  description  text,
  price        numeric(12,2),
  neg          boolean     NOT NULL DEFAULT false,
  category_id  uuid        REFERENCES store_categories(id) ON DELETE SET NULL,
  category_name text,
  condition    text        NOT NULL DEFAULT 'New',
  photos       jsonb       NOT NULL DEFAULT '[]',
  stock_qty    integer,
  available    boolean     NOT NULL DEFAULT true,
  loc          text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sp_store_id   ON store_products (store_id, available);
CREATE INDEX IF NOT EXISTS idx_sp_user_id    ON store_products (user_id);
CREATE INDEX IF NOT EXISTS idx_sp_category   ON store_products (category_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION _sp_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS sp_updated_at ON store_products;
CREATE TRIGGER sp_updated_at
  BEFORE UPDATE ON store_products
  FOR EACH ROW EXECUTE FUNCTION _sp_set_updated_at();

-- 3. Store subscriptions / payment tracking
CREATE TABLE IF NOT EXISTS store_subscriptions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     uuid        NOT NULL UNIQUE,
  user_id      uuid        NOT NULL,
  plan         text        NOT NULL DEFAULT 'basic'
                           CHECK (plan IN ('basic','premium')),
  status       text        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','expired','cancelled','trial')),
  paid_at      timestamptz,
  paid_until   timestamptz,
  amount       numeric(10,2),
  pf_payment_id text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ss_store_id ON store_subscriptions (store_id);

-- Add storeId column back to store_applications for joins
ALTER TABLE store_applications ADD COLUMN IF NOT EXISTS store_id uuid DEFAULT gen_random_uuid();

-- RLS for store_products (public read, owner write)
ALTER TABLE store_products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_sp"  ON store_products;
CREATE POLICY "public_read_sp" ON store_products FOR SELECT USING (available = true);

DROP POLICY IF EXISTS "owner_write_sp" ON store_products;
CREATE POLICY "owner_write_sp" ON store_products
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "public_read_sc"  ON store_categories;
CREATE POLICY "public_read_sc" ON store_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "owner_write_sc" ON store_categories;
CREATE POLICY "owner_write_sc" ON store_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM store_applications sa
      WHERE sa.id = store_categories.store_id
        AND sa.user_id = auth.uid()
    )
  );
