-- ═══════════════════════════════════════════════════════════════════
-- Everything Market — Demo Store Seed Data
-- Run AFTER supabase-store-system.sql
-- Creates two approved demo stores: Crates & Boxes, Custom Mugs
-- ═══════════════════════════════════════════════════════════════════

-- Demo user IDs (these are placeholder UUIDs for demo stores)
-- Replace with real user_ids once store owners register
DO $$
DECLARE
  crates_store_id  uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  mugs_store_id    uuid := 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
  crates_user_id   uuid := 'c3d4e5f6-a7b8-9012-cdef-123456789012';
  mugs_user_id     uuid := 'd4e5f6a7-b8c9-0123-defa-234567890123';
  cat_moving       uuid;
  cat_storage      uuid;
  cat_wine         uuid;
  cat_wooden       uuid;
  cat_photo        uuid;
  cat_corporate    uuid;
  cat_travel       uuid;
  cat_color        uuid;
BEGIN

-- ── Store 1: Crates & Boxes ──────────────────────────────────────
INSERT INTO store_applications (id, user_id, user_email, store_name, store_description, store_type, status, applied_at, approved_at, reviewed_at, reviewed_by)
VALUES (
  crates_store_id, crates_user_id,
  'cratesnboxes@demo.everythingmarket.co.za',
  'Crates & Boxes',
  'Quality packaging, storage and moving solutions. We supply wooden crates, plastic crates, moving boxes and wine crates for homes and businesses across South Africa.',
  'retail', 'approved', now() - interval '10 days', now() - interval '8 days', now() - interval '8 days', 'admin'
) ON CONFLICT (id) DO NOTHING;

-- Categories for Crates & Boxes
INSERT INTO store_categories (id, store_id, name, sort_order) VALUES
  (gen_random_uuid(), crates_store_id, 'Moving Boxes',    0),
  (gen_random_uuid(), crates_store_id, 'Storage Crates',  1),
  (gen_random_uuid(), crates_store_id, 'Wine Crates',     2),
  (gen_random_uuid(), crates_store_id, 'Wooden Crates',   3)
ON CONFLICT DO NOTHING;

SELECT id INTO cat_moving   FROM store_categories WHERE store_id = crates_store_id AND name = 'Moving Boxes'   LIMIT 1;
SELECT id INTO cat_storage  FROM store_categories WHERE store_id = crates_store_id AND name = 'Storage Crates' LIMIT 1;
SELECT id INTO cat_wine     FROM store_categories WHERE store_id = crates_store_id AND name = 'Wine Crates'    LIMIT 1;
SELECT id INTO cat_wooden   FROM store_categories WHERE store_id = crates_store_id AND name = 'Wooden Crates'  LIMIT 1;

-- Products for Crates & Boxes
INSERT INTO store_products (store_id, user_id, title, description, price, category_id, category_name, condition, photos, stock_qty, loc) VALUES
(crates_store_id, crates_user_id,
 'Large Moving Box (Pack of 10)',
 'Heavy-duty double-wall cardboard moving boxes. Perfect for household moves. Each box measures 60x40x40cm. Rated for up to 25kg.',
 189.00, cat_moving, 'Moving Boxes', 'New',
 '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&fit=crop&auto=format","https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&fit=crop&auto=format"]',
 150, 'Gauteng'),
(crates_store_id, crates_user_id,
 'Medium Moving Box (Pack of 20)',
 'Versatile medium-sized moving boxes for clothes, books and kitchen items. 40x30x30cm. Strong and stackable.',
 219.00, cat_moving, 'Moving Boxes', 'New',
 '["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&fit=crop&auto=format"]',
 200, 'Gauteng'),
(crates_store_id, crates_user_id,
 'Stackable Plastic Storage Crate',
 'Heavy-duty stackable plastic storage crate in black/green. 60L capacity. Ventilated sides, solid base. Ideal for warehouses, farms and home storage.',
 149.00, cat_storage, 'Storage Crates', 'New',
 '["https://images.unsplash.com/photo-1595246140520-1991cbc8853e?w=600&fit=crop&auto=format"]',
 80, 'Gauteng'),
(crates_store_id, crates_user_id,
 'Collapsible Storage Crate (Set of 4)',
 'Space-saving collapsible plastic crates. Fold flat when not in use. 32L each. Great for retail, logistics and pantry storage.',
 299.00, cat_storage, 'Storage Crates', 'New',
 '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&fit=crop&auto=format"]',
 60, 'Gauteng'),
(crates_store_id, crates_user_id,
 'Rustic Wooden Wine Crate',
 'Authentic pine wood wine crate. Holds 6 standard wine bottles. Great for storage, display or DIY projects. Natural finish, can be painted or stained.',
 89.00, cat_wine, 'Wine Crates', 'New',
 '["https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&fit=crop&auto=format"]',
 120, 'Gauteng'),
(crates_store_id, crates_user_id,
 'Custom Branded Wine Crate',
 'Personalize a wooden wine crate with your logo or message. Minimum order 10 units. Lead time 5 working days. Perfect for corporate gifts.',
 135.00, cat_wine, 'Wine Crates', 'New',
 '["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&fit=crop&auto=format"]',
 NULL, 'Gauteng'),
(crates_store_id, crates_user_id,
 'Heavy-Duty Wooden Pallet Crate',
 'Solid pine pallet crate for industrial shipping. Internal dimensions 80x60x50cm. Rated 150kg. Comes flat-packed with assembly instructions.',
 450.00, cat_wooden, 'Wooden Crates', 'New',
 '["https://images.unsplash.com/photo-1527689638836-411945a2b57c?w=600&fit=crop&auto=format"]',
 40, 'Gauteng'),
(crates_store_id, crates_user_id,
 'Decorative Wooden Display Crate',
 'Slatted pine display crate, perfect for retail merchandising or home décor. Natural wood finish. Available in small (30x20x15cm) and large (50x35x25cm).',
 65.00, cat_wooden, 'Wooden Crates', 'New',
 '["https://images.unsplash.com/photo-1567539720668-df3a8ba2c3dc?w=600&fit=crop&auto=format"]',
 200, 'Gauteng');

-- Subscription for Crates & Boxes
INSERT INTO store_subscriptions (store_id, user_id, plan, status, paid_at, paid_until, amount)
VALUES (crates_store_id, crates_user_id, 'basic', 'active', now() - interval '8 days', now() + interval '22 days', 299.00)
ON CONFLICT (store_id) DO NOTHING;


-- ── Store 2: Custom Mugs ─────────────────────────────────────────
INSERT INTO store_applications (id, user_id, user_email, store_name, store_description, store_type, status, applied_at, approved_at, reviewed_at, reviewed_by)
VALUES (
  mugs_store_id, mugs_user_id,
  'custommugs@demo.everythingmarket.co.za',
  'Custom Mugs SA',
  'Premium personalised mugs for corporate gifts, events and everyday use. Photo mugs, colour-change mugs, travel mugs and more. Printed in South Africa. Fast turnaround.',
  'retail', 'approved', now() - interval '7 days', now() - interval '5 days', now() - interval '5 days', 'admin'
) ON CONFLICT (id) DO NOTHING;

-- Categories for Custom Mugs
INSERT INTO store_categories (id, store_id, name, sort_order) VALUES
  (gen_random_uuid(), mugs_store_id, 'Photo Mugs',       0),
  (gen_random_uuid(), mugs_store_id, 'Corporate Mugs',   1),
  (gen_random_uuid(), mugs_store_id, 'Travel Mugs',      2),
  (gen_random_uuid(), mugs_store_id, 'Magic Colour Mugs',3)
ON CONFLICT DO NOTHING;

SELECT id INTO cat_photo     FROM store_categories WHERE store_id = mugs_store_id AND name = 'Photo Mugs'        LIMIT 1;
SELECT id INTO cat_corporate FROM store_categories WHERE store_id = mugs_store_id AND name = 'Corporate Mugs'    LIMIT 1;
SELECT id INTO cat_travel    FROM store_categories WHERE store_id = mugs_store_id AND name = 'Travel Mugs'       LIMIT 1;
SELECT id INTO cat_color     FROM store_categories WHERE store_id = mugs_store_id AND name = 'Magic Colour Mugs' LIMIT 1;

-- Products for Custom Mugs
INSERT INTO store_products (store_id, user_id, title, description, price, category_id, category_name, condition, photos, stock_qty, loc) VALUES
(mugs_store_id, mugs_user_id,
 'Personalised Photo Mug (330ml)',
 'Classic 330ml ceramic mug with your photo or design printed in full colour. Dishwasher safe. Print wraps 75% of the mug. Design submitted via WhatsApp or email. Delivery 2-3 days.',
 129.00, cat_photo, 'Photo Mugs', 'New',
 '["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&fit=crop&auto=format","https://images.unsplash.com/photo-1572119865084-43c285814d63?w=600&fit=crop&auto=format"]',
 NULL, 'Gauteng'),
(mugs_store_id, mugs_user_id,
 'Heart Handle Photo Mug',
 'Romantic heart-shaped handle mug with custom photo print. 325ml. Perfect anniversary, Valentine''s or birthday gift. Full-wrap colour print. Comes in gift box.',
 149.00, cat_photo, 'Photo Mugs', 'New',
 '["https://images.unsplash.com/photo-1544047281-c0be80640b5d?w=600&fit=crop&auto=format"]',
 NULL, 'Gauteng'),
(mugs_store_id, mugs_user_id,
 'Corporate Branded Mug (Min 20)',
 'High-quality white 11oz ceramic mug with your company logo. Minimum order 20 units. Price per unit. Full-colour sublimation print. Lead time 3-5 business days. Perfect for staff gifts and conferences.',
 85.00, cat_corporate, 'Corporate Mugs', 'New',
 '["https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&fit=crop&auto=format"]',
 NULL, 'Gauteng'),
(mugs_store_id, mugs_user_id,
 'Premium Matte Black Corporate Mug',
 'Stylish matte black 11oz ceramic mug. White or gold imprint of your logo. Minimum 10 units. The professional choice for corporate gifting and office branding.',
 110.00, cat_corporate, 'Corporate Mugs', 'New',
 '["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&fit=crop&auto=format"]',
 NULL, 'Gauteng'),
(mugs_store_id, mugs_user_id,
 'Stainless Steel Travel Mug (450ml)',
 'Double-wall vacuum insulated travel mug. Keeps drinks hot 6 hours, cold 12 hours. Spill-proof lid. Custom logo or photo wrap print available. Fits standard car cup holders.',
 249.00, cat_travel, 'Travel Mugs', 'New',
 '["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&fit=crop&auto=format"]',
 50, 'Gauteng'),
(mugs_store_id, mugs_user_id,
 'Personalised Bamboo Travel Cup',
 'Eco-friendly bamboo travel cup with stainless steel interior. 350ml. Laser-engraved personalisation. A sustainable gift for the environmentally conscious.',
 199.00, cat_travel, 'Travel Mugs', 'New',
 '["https://images.unsplash.com/photo-1558618047-f4e60d9e3498?w=600&fit=crop&auto=format"]',
 30, 'Gauteng'),
(mugs_store_id, mugs_user_id,
 'Magic Colour-Change Mug',
 'Black mug that reveals your custom photo when hot liquid is added! 325ml ceramic. Great novelty gift. Full colour image hidden until filled. Comes gift-wrapped.',
 159.00, cat_color, 'Magic Colour Mugs', 'New',
 '["https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&fit=crop&auto=format"]',
 NULL, 'Gauteng'),
(mugs_store_id, mugs_user_id,
 'Glow-in-the-Dark Custom Mug',
 'Fun glow-in-the-dark mug that shows your hidden design in the dark! 330ml ceramic. Unique birthday or novelty gift. Custom design or photo. Charging takes 30 seconds in sunlight.',
 175.00, cat_color, 'Magic Colour Mugs', 'New',
 '["https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=600&fit=crop&auto=format"]',
 NULL, 'Gauteng');

-- Subscription for Custom Mugs
INSERT INTO store_subscriptions (store_id, user_id, plan, status, paid_at, paid_until, amount)
VALUES (mugs_store_id, mugs_user_id, 'basic', 'active', now() - interval '5 days', now() + interval '25 days', 299.00)
ON CONFLICT (store_id) DO NOTHING;

END $$;
