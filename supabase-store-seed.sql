-- ═══════════════════════════════════════════════════════════════════
-- Everything Market — Real Store Seed Data
-- Run AFTER supabase-store-system.sql
-- Creates two approved stores: Crates & Boxes, Custom Mugs SA
-- Uses real product images from GitHub repositories
-- ═══════════════════════════════════════════════════════════════════

-- Add logo_url column if it doesn't exist yet
ALTER TABLE store_applications ADD COLUMN IF NOT EXISTS logo_url text;

-- ── Raw GitHub image base URLs ───────────────────────────────────
-- Crates & Boxes: https://raw.githubusercontent.com/samuelhyerahyera7-sketch/crates-and-boxes/main/images/
-- Custom Mugs SA: https://raw.githubusercontent.com/samuelhyerahyera7-sketch/custommugs/main/images/

DO $$
DECLARE
  crates_store_id  uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  mugs_store_id    uuid := 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
  crates_user_id   uuid := 'c3d4e5f6-a7b8-9012-cdef-123456789012';
  mugs_user_id     uuid := 'd4e5f6a7-b8c9-0123-defa-234567890123';
  cb  text := 'https://raw.githubusercontent.com/samuelhyerahyera7-sketch/crates-and-boxes/main/images/';
  cm  text := 'https://raw.githubusercontent.com/samuelhyerahyera7-sketch/custommugs/main/images/';
  cat_hat    uuid;
  cat_square uuid;
  cat_clam   uuid;
  cat_wine   uuid;
  cat_heart  uuid;
  cat_sa     uuid;
  cat_awkward uuid;
  cat_bday   uuid;
  cat_metal  uuid;
BEGIN

-- ── Clean slate for products / categories (safe to re-run) ─────
DELETE FROM store_products   WHERE store_id = crates_store_id;
DELETE FROM store_products   WHERE store_id = mugs_store_id;
DELETE FROM store_categories WHERE store_id = crates_store_id;
DELETE FROM store_categories WHERE store_id = mugs_store_id;

-- ── Store 1: Crates & Boxes ──────────────────────────────────────
INSERT INTO store_applications
  (id, user_id, user_email, store_name, store_description, store_type, status,
   applied_at, approved_at, reviewed_at, reviewed_by, logo_url)
VALUES (
  crates_store_id, crates_user_id,
  'cratesnboxes@demo.everythingmarket.co.za',
  'Crates & Boxes',
  'Premium luxury gift boxes for every occasion. We stock hat boxes, heart boxes, wine boxes, magnetic ribbon clamshells, square boxes and more — all available in a range of colours. Perfect for florists, gift shops, hamper businesses and corporate gifting. Based in Gauteng.',
  'retail', 'approved',
  now() - interval '10 days', now() - interval '8 days',
  now() - interval '8 days', 'admin',
  'https://raw.githubusercontent.com/samuelhyerahyera7-sketch/crates-and-boxes/main/favicon.svg'
) ON CONFLICT (id) DO UPDATE SET
  store_description = EXCLUDED.store_description,
  logo_url = EXCLUDED.logo_url;

-- Categories for Crates & Boxes
INSERT INTO store_categories (id, store_id, name, sort_order) VALUES
  (gen_random_uuid(), crates_store_id, 'Hat Boxes',       0),
  (gen_random_uuid(), crates_store_id, 'Square Boxes',    1),
  (gen_random_uuid(), crates_store_id, 'Clamshell Boxes', 2),
  (gen_random_uuid(), crates_store_id, 'Wine Boxes',      3),
  (gen_random_uuid(), crates_store_id, 'Heart Boxes',     4);

SELECT id INTO cat_hat    FROM store_categories WHERE store_id = crates_store_id AND name = 'Hat Boxes'       LIMIT 1;
SELECT id INTO cat_square FROM store_categories WHERE store_id = crates_store_id AND name = 'Square Boxes'    LIMIT 1;
SELECT id INTO cat_clam   FROM store_categories WHERE store_id = crates_store_id AND name = 'Clamshell Boxes' LIMIT 1;
SELECT id INTO cat_wine   FROM store_categories WHERE store_id = crates_store_id AND name = 'Wine Boxes'      LIMIT 1;
SELECT id INTO cat_heart  FROM store_categories WHERE store_id = crates_store_id AND name = 'Heart Boxes'     LIMIT 1;

-- Products for Crates & Boxes (real images from GitHub)
INSERT INTO store_products (store_id, user_id, title, description, price, category_id, category_name, condition, photos, available, loc) VALUES

-- Hat Boxes
(crates_store_id, crates_user_id, 'Round Hat Box (S)',
 'Compact round hat box with a fitted lid — ideal for small bouquets, candles, and single-item luxury gifts. 100mm dia × 100mm (h).',
 30.00, cat_hat, 'Hat Boxes', 'New',
 format('["%s","%s","%s"]', cb||'round-small-1.jpg.png', cb||'round-small-2.jpg.png', cb||'round-small-3.jpg.png'),
 true, 'Gauteng'),

(crates_store_id, crates_user_id, 'Round Hat Box (M)',
 'Medium round hat box with a fitted lid — ideal for bouquets, candles, and luxury gift arrangements. 250mm dia × 200mm (h).',
 45.00, cat_hat, 'Hat Boxes', 'New',
 format('["%s","%s","%s","%s"]', cb||'round-med-1.jpg.png', cb||'round-med-2.jpg.png', cb||'round-med-3.jpg.png', cb||'round-med-4.jpg.png'),
 true, 'Gauteng'),

(crates_store_id, crates_user_id, 'Shallow Hat Box (S)',
 'Wide shallow round hat box — great for small bouquets, spa products, and personalised keepsakes. 200mm dia × 100mm (h).',
 30.00, cat_hat, 'Hat Boxes', 'New',
 format('["%s","%s","%s"]', cb||'hat-shallow-sm-2.jpg', cb||'hat-shallow-sm-1.jpg', cb||'hat-shallow-sm-3.jpg'),
 true, 'Gauteng'),

(crates_store_id, crates_user_id, 'Shallow Hat Box (L)',
 'Wide shallow round hat box — a florist favourite for floral arrangements and luxury gift displays. 287mm dia × 100mm (h).',
 40.00, cat_hat, 'Hat Boxes', 'New',
 format('["%s","%s","%s"]', cb||'hat-shallow-lg-2.jpg', cb||'hat-shallow-lg-1.jpg', cb||'hat-shallow-lg-3.jpg'),
 true, 'Gauteng'),

(crates_store_id, crates_user_id, 'Extra Large Hat Box',
 'Our tallest hat box — perfect for dramatic floral displays and oversized luxury hampers. 287mm dia × 300mm (h).',
 110.00, cat_hat, 'Hat Boxes', 'New',
 format('["%s","%s","%s"]', cb||'hat-xlarge-1.jpg', cb||'hat-xlarge-2.jpg', cb||'hat-xlarge-3.jpg'),
 true, 'Gauteng'),

(crates_store_id, crates_user_id, 'Tall Hat Box',
 'Slim, tall cylindrical box designed for single-stem flowers, bottles, and vertical gift arrangements. 160mm dia × 250mm (h).',
 60.00, cat_hat, 'Hat Boxes', 'New',
 format('["%s","%s","%s"]', cb||'tall-hat-1.jpg.png', cb||'tall-hat-2.jpg.png', cb||'tall-hat-3.jpg.png'),
 true, 'Gauteng'),

-- Square Boxes
(crates_store_id, crates_user_id, 'Square Mini Box (S)',
 'Compact cube gift box — ideal for jewellery, small treats, and single-item luxury presents. 100mm × 100mm × 100mm.',
 25.00, cat_square, 'Square Boxes', 'New',
 format('["%s","%s","%s"]', cb||'square-small-1.jpg', cb||'square-small-2.jpg', cb||'square-small-3.jpg'),
 true, 'Gauteng'),

(crates_store_id, crates_user_id, 'Square Box (M)',
 'Mid-size square box available in multiple colours, great for candles, cosmetics, and gift sets. 130mm × 130mm × 130mm.',
 35.00, cat_square, 'Square Boxes', 'New',
 format('["%s","%s","%s"]', cb||'square-medium-1.jpg', cb||'square-medium-2.jpg', cb||'square-medium-3.jpg'),
 true, 'Gauteng'),

(crates_store_id, crates_user_id, 'Square Cube Box',
 'Classic cube gift box with a separate lid, perfect for premium products and branded packaging. 150mm × 150mm × 150mm.',
 45.00, cat_square, 'Square Boxes', 'New',
 format('["%s","%s","%s"]', cb||'square-cube-1.jpg.png', cb||'square-cube-2.jpg.png', cb||'square-cube-3.jpg.png'),
 true, 'Gauteng'),

-- Clamshell Boxes
(crates_store_id, crates_user_id, 'Small Ribbon Clamshell Box',
 'Magnetic clamshell box with a pre-attached satin ribbon — opens beautifully for an impressive unboxing. 200mm × 200mm × 100mm.',
 55.00, cat_clam, 'Clamshell Boxes', 'New',
 format('["%s","%s","%s"]', cb||'clamshell-large-3.jpg', cb||'clamshell-large-2.jpg', cb||'clamshell-large-1.jpg'),
 true, 'Gauteng'),

(crates_store_id, crates_user_id, 'Medium Ribbon Clamshell Box',
 'Rectangular magnetic gift box with ribbon closure — elegant for corporate gifts and hampers. 300mm × 200mm × 100mm.',
 75.00, cat_clam, 'Clamshell Boxes', 'New',
 format('["%s","%s","%s","%s"]', cb||'clamshell-large-2.jpg', cb||'clamshell-large-1.jpg', cb||'clamshell-large-4.jpg', cb||'clamshell-large-3.jpg'),
 true, 'Gauteng'),

(crates_store_id, crates_user_id, 'Extra Large Ribbon Clamshell Box',
 'Our biggest magnetic clamshell — the statement piece for luxury hampers and oversized gifts. 450mm × 350mm × 200mm.',
 155.00, cat_clam, 'Clamshell Boxes', 'New',
 format('["%s","%s","%s","%s"]', cb||'clamshell-large-2.jpg', cb||'clamshell-large-3.jpg', cb||'clamshell-large-4.jpg', cb||'clamshell-large-1.jpg'),
 true, 'Gauteng'),

(crates_store_id, crates_user_id, 'Small Book Style Box',
 'Magnetic book-style gift box with a satin ribbon bow — elegant fold-open design perfect for clothing, accessories, and luxury gifts. 210mm × 140mm × 80mm.',
 65.00, cat_clam, 'Clamshell Boxes', 'New',
 format('["%s","%s","%s"]', cb||'book-small-1.jpg.png', cb||'book-small-2.jpg.png', cb||'book-small-3.jpg.png'),
 true, 'Gauteng'),

(crates_store_id, crates_user_id, 'Large Book Style Box',
 'Large magnetic book-style box with a satin ribbon bow — a luxurious fold-open design perfect for hampers, clothing, and premium gifts. 280mm × 280mm × 100mm.',
 95.00, cat_clam, 'Clamshell Boxes', 'New',
 format('["%s","%s"]', cb||'book-large-1.jpg.png', cb||'book-large-2.jpg.png'),
 true, 'Gauteng'),

-- Wine Boxes
(crates_store_id, crates_user_id, 'Wine Box Standard with Lid',
 'Sleek standard wine box with a fitted lid — designed to hold a single bottle with style. 355mm × 100mm × 100mm.',
 65.00, cat_wine, 'Wine Boxes', 'New',
 format('["%s","%s","%s","%s"]', cb||'wine-standard-1.jpg', cb||'wine-standard-2.jpg', cb||'wine-standard-3.jpg', cb||'wine-standard-4.jpg'),
 true, 'Gauteng'),

(crates_store_id, crates_user_id, 'Wine Magnet Closure Box',
 'Luxury magnetic closure wine box — opens flat to reveal the bottle for a dramatic gifting moment. 355mm × 110mm × 110mm.',
 80.00, cat_wine, 'Wine Boxes', 'New',
 format('["%s","%s","%s"]', cb||'wine-magnet-2.jpg', cb||'wine-magnet-1.jpg', cb||'wine-magnet-3.jpg'),
 true, 'Gauteng'),

-- Heart Boxes
(crates_store_id, crates_user_id, 'Small Heart Box',
 'Heart-shaped gift box — perfect for Valentine''s Day, Mother''s Day, and romantic hampers. 250mm × 210mm × 100mm.',
 75.00, cat_heart, 'Heart Boxes', 'New',
 format('["%s","%s","%s","%s"]', cb||'heart-small-1.jpg', cb||'heart-small-2.jpg', cb||'heart-small-3.jpg', cb||'heart-small-4.jpg'),
 true, 'Gauteng'),

(crates_store_id, crates_user_id, 'Medium Heart Box',
 'Medium heart box with generous depth — fits chocolates, wine, flowers, and curated pamper gifts. 300mm × 260mm × 100mm.',
 95.00, cat_heart, 'Heart Boxes', 'New',
 format('["%s","%s","%s","%s"]', cb||'heart-medium-1.jpg', cb||'heart-medium-2.jpg', cb||'heart-medium-3.jpg', cb||'heart-medium-4.jpg'),
 true, 'Gauteng'),

(crates_store_id, crates_user_id, 'Large Heart Box',
 'Our largest heart box — a showstopper for luxury Valentine''s, anniversary, and celebration gifts. 360mm × 312mm × 100mm.',
 120.00, cat_heart, 'Heart Boxes', 'New',
 format('["%s","%s","%s","%s"]', cb||'heart-large-1.jpg', cb||'heart-large-5.jpg', cb||'heart-large-3.jpg', cb||'heart-large-4.jpg'),
 true, 'Gauteng');

-- Subscription for Crates & Boxes
INSERT INTO store_subscriptions (store_id, user_id, plan, status, paid_at, paid_until, amount)
VALUES (crates_store_id, crates_user_id, 'basic', 'active', now() - interval '8 days', now() + interval '22 days', 299.00)
ON CONFLICT (store_id) DO NOTHING;


-- ── Store 2: Custom Mugs SA ──────────────────────────────────────
INSERT INTO store_applications
  (id, user_id, user_email, store_name, store_description, store_type, status,
   applied_at, approved_at, reviewed_at, reviewed_by, logo_url)
VALUES (
  mugs_store_id, mugs_user_id,
  'custommugs@demo.everythingmarket.co.za',
  'Custom Mugs SA',
  'Printed-to-order mugs designed in South Africa. SA-themed designs, Afrikaans sayings, awkward conversation starters, birthday mugs, pop-culture prints, and metal camping mugs. Fast Gauteng delivery. WhatsApp your design or choose from our range.',
  'retail', 'approved',
  now() - interval '7 days', now() - interval '5 days',
  now() - interval '5 days', 'admin',
  'https://raw.githubusercontent.com/samuelhyerahyera7-sketch/custommugs/main/images/1000849588.jpg'
) ON CONFLICT (id) DO UPDATE SET
  store_description = EXCLUDED.store_description,
  logo_url = EXCLUDED.logo_url;

-- Categories for Custom Mugs SA
INSERT INTO store_categories (id, store_id, name, sort_order) VALUES
  (gen_random_uuid(), mugs_store_id, 'SA-Themed Mugs',     0),
  (gen_random_uuid(), mugs_store_id, 'Awkward Questions',  1),
  (gen_random_uuid(), mugs_store_id, 'Birthday & Occasions', 2),
  (gen_random_uuid(), mugs_store_id, 'Metal Travel Mugs',  3);

SELECT id INTO cat_sa      FROM store_categories WHERE store_id = mugs_store_id AND name = 'SA-Themed Mugs'     LIMIT 1;
SELECT id INTO cat_awkward FROM store_categories WHERE store_id = mugs_store_id AND name = 'Awkward Questions'  LIMIT 1;
SELECT id INTO cat_bday    FROM store_categories WHERE store_id = mugs_store_id AND name = 'Birthday & Occasions' LIMIT 1;
SELECT id INTO cat_metal   FROM store_categories WHERE store_id = mugs_store_id AND name = 'Metal Travel Mugs'  LIMIT 1;

-- Products for Custom Mugs SA (real images from GitHub)
INSERT INTO store_products (store_id, user_id, title, description, price, category_id, category_name, condition, photos, available, loc) VALUES

-- SA-Themed Mugs
(mugs_store_id, mugs_user_id, '"Boer Maak ''n Plan" Mug',
 'Classic Afrikaans saying on a quality 330ml ceramic mug. Because a South African always makes a plan. Printed in full colour. Dishwasher safe.',
 149.00, cat_sa, 'SA-Themed Mugs', 'New',
 format('["%s"]', cm||'afrikaans-boer-maak-n-plan.jpg.png.jpeg'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, '"Nou Gaan Ons Braai!" Mug',
 'The mug every South African braai master needs. 330ml ceramic, full-colour print, dishwasher safe. Because there''s always a reason to braai.',
 149.00, cat_sa, 'SA-Themed Mugs', 'New',
 format('["%s","%s"]', cm||'afrikaans-nou-gaan-ons-braai.jpg.png.jpeg', cm||'afrikaans-nou-gaan-ons-braai-1.jpg.png.jpeg'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, 'Bafana Bafana Mug',
 'Show your Bafana Bafana pride every morning. SA football fan gift. 330ml ceramic mug with full-colour sublimation print.',
 149.00, cat_sa, 'SA-Themed Mugs', 'New',
 format('["%s"]', cm||'Bafana-bafana-stress-is-different-za.jpg.png.jpeg'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, 'Before & After Coffee Garfield Set',
 'Two-mug gift set — Before Coffee Garfield and After Coffee Garfield. The perfect set for any coffee lover. 330ml ceramic each, dishwasher safe.',
 299.00, cat_sa, 'SA-Themed Mugs', 'New',
 format('["%s","%s"]', cm||'before-coffee-Garfield.jpg.png.jpeg', cm||'after-coffee-Garfield.jpg.png.jpeg'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, 'Coffee Jutsu — Naruto Mug',
 'For the anime fan who runs on coffee. Naruto-themed coffee mug. 330ml ceramic, full wrap sublimation print.',
 149.00, cat_sa, 'SA-Themed Mugs', 'New',
 format('["%s"]', cm||'coffee-jutsu-Naruto.jpg.png.jpeg'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, '"Fellow South African" Mug',
 'A tribute to being proudly South African. 330ml ceramic with full-colour sublimation print. A great local gift.',
 149.00, cat_sa, 'SA-Themed Mugs', 'New',
 format('["%s"]', cm||'fellow-south-africa-za.jpg.png.jpeg'),
 true, 'Gauteng'),

-- Awkward Questions
(mugs_store_id, mugs_user_id, '"Are You Happy?" Awkward Mug',
 'Part of our Awkward Questions series — because someone needs to ask. Great conversation starter. 330ml ceramic, full-colour print.',
 159.00, cat_awkward, 'Awkward Questions', 'New',
 format('["%s"]', cm||'awkward-are-you-happy.jpg.png.jpeg'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, '"Body Count" Awkward Mug',
 'The mug that starts the conversation nobody wants to have. Part of the Awkward Questions series. 330ml ceramic.',
 159.00, cat_awkward, 'Awkward Questions', 'New',
 format('["%s"]', cm||'awkward-body-count.jpg.png.jpeg'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, '"How Old Are You?" Awkward Mug',
 'Ask the question everyone''s thinking. Part of the Awkward Questions series. 330ml ceramic mug.',
 159.00, cat_awkward, 'Awkward Questions', 'New',
 format('["%s"]', cm||'awkward-how-old-are-you.jpg.png.jpeg'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, '"Still Single?" Awkward Mug',
 'For the family reunion you didn''t ask for. Part of the Awkward Questions series. 330ml ceramic.',
 159.00, cat_awkward, 'Awkward Questions', 'New',
 format('["%s"]', cm||'awkward-still-single.jpg.png.jpeg'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, '"Am I Your Type?" Awkward Mug',
 'For the situationship you can''t explain. Part of the Awkward Questions series. 330ml ceramic mug.',
 159.00, cat_awkward, 'Awkward Questions', 'New',
 format('["%s"]', cm||'awkward-am-i-your-type.jpg.png.jpeg'),
 true, 'Gauteng'),

-- Birthday & Occasions
(mugs_store_id, mugs_user_id, 'Birthday Cat Mug',
 'Cute birthday cat with cake design. Perfect birthday gift. 330ml ceramic with full-colour sublimation print. Dishwasher safe.',
 149.00, cat_bday, 'Birthday & Occasions', 'New',
 format('["%s"]', cm||'birthday-cat-cake.jpg.png'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, 'Happy Birthday Gold Mug',
 'Elegant gold "Happy Birthday" design mug. A classy gift for any birthday. 330ml ceramic, full-colour print.',
 149.00, cat_bday, 'Birthday & Occasions', 'New',
 format('["%s"]', cm||'birthday-happy-gold.jpg.png'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, '"Best Dad In The World" Mug',
 'Tell dad he''s the best — with coffee. Ceramic 330ml mug with full-colour print. Perfect Father''s Day or birthday gift.',
 149.00, cat_bday, 'Birthday & Occasions', 'New',
 format('["%s"]', cm||'best-dad-in-the-world.jpg.png.jpeg'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, '"Best Mom Ever" Mug',
 'Because she deserves it every morning. Ceramic 330ml mug with full-colour print. Perfect Mother''s Day or birthday gift.',
 149.00, cat_bday, 'Birthday & Occasions', 'New',
 format('["%s","%s"]', cm||'best-mom-ever.jpg.png.jpeg', cm||'best-mom-ever-1.jpg.png.jpeg'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, 'Baby Shower Mug',
 'Celebrate the new arrival with a keepsake mug. 330ml ceramic, full-colour print. Great baby shower gift.',
 149.00, cat_bday, 'Birthday & Occasions', 'New',
 format('["%s"]', cm||'baby-shower.jpg.png.jpeg'),
 true, 'Gauteng'),

-- Metal Travel Mugs
(mugs_store_id, mugs_user_id, '"Braai Dop Repeat" Metal Mug',
 'The SA braai lifestyle in a robust metal camping mug. Perfect for outdoor use, camping trips, and braais. Stainless steel with handle.',
 199.00, cat_metal, 'Metal Travel Mugs', 'New',
 format('["%s"]', cm||'metal-braai-dop-repeat.jpg.png.jpeg'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, '"Load Shedding" Metal Mug',
 'South Africa''s most relatable metal mug. Stainless steel camping mug — because at least the coffee still works when the power is out.',
 199.00, cat_metal, 'Metal Travel Mugs', 'New',
 format('["%s"]', cm||'metal-load-shedding.jpg.png.jpeg'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, '"Eish!" Metal Mug',
 'The quintessential South African expression on a rugged metal camping mug. Stainless steel with handle.',
 199.00, cat_metal, 'Metal Travel Mugs', 'New',
 format('["%s"]', cm||'metal-eish.jpg.png.jpeg'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, '"Howzit" Metal Mug',
 'SA''s favourite greeting on a durable metal camping mug. Great gift for any South African. Stainless steel with handle.',
 199.00, cat_metal, 'Metal Travel Mugs', 'New',
 format('["%s"]', cm||'metal-howzit.jpg.png.jpeg'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, '"Sharp Sharp" Metal Mug',
 'Only in SA. The metal camping mug for the South African who is always sharp. Stainless steel with handle.',
 199.00, cat_metal, 'Metal Travel Mugs', 'New',
 format('["%s"]', cm||'metal-sharp-sharp.jpg.png.jpeg'),
 true, 'Gauteng'),

(mugs_store_id, mugs_user_id, '"Camping Mode On" Metal Mug',
 'For the outdoor enthusiast. Stainless steel camping mug that says exactly what you''re feeling when you escape the city.',
 199.00, cat_metal, 'Metal Travel Mugs', 'New',
 format('["%s"]', cm||'metal-camping-mug.jpg.png.jpeg'),
 true, 'Gauteng');

-- Subscription for Custom Mugs SA
INSERT INTO store_subscriptions (store_id, user_id, plan, status, paid_at, paid_until, amount)
VALUES (mugs_store_id, mugs_user_id, 'basic', 'active', now() - interval '5 days', now() + interval '25 days', 299.00)
ON CONFLICT (store_id) DO NOTHING;

END $$;
