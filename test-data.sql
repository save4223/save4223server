-- Test data for Smart Lab Inventory System
-- Run this in Supabase SQL Editor (http://127.0.0.1:54323/project/default)

-- 1. Create a test user in Supabase Auth (or use existing)
-- Note: This requires Supabase Auth. For testing, we'll use a dummy UUID.

-- Test user UUID (generate a new one if needed)
-- SELECT gen_random_uuid(); -- Run this to get a new UUID

-- Insert test profile (replace with actual auth.users id)
INSERT INTO profiles (id, email, full_name, role) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'Test User', 'USER');

-- 2. Create test locations (cabinets)
INSERT INTO locations (name, type, is_restricted) VALUES 
  ('Cabinet A - Open Access', 'CABINET', false),
  ('Cabinet B - Restricted', 'CABINET', true),
  ('Drawer 1', 'DRAWER', false);

-- 3. Create test card
INSERT INTO user_cards (user_id, card_uid, is_active) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'TEST123', true);

-- 4. Create permission for restricted cabinet
INSERT INTO access_permissions (user_id, location_id, status, valid_from, valid_until) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 2, 'APPROVED', NOW(), NOW() + INTERVAL '30 days');

-- 5. Create item types
INSERT INTO item_types (name, category, description, max_borrow_duration) VALUES 
  ('Oscilloscope', 'DEVICE', 'Digital oscilloscope', '14 days'),
  ('Screwdriver Set', 'TOOL', 'Precision screwdrivers', '7 days');

-- 6. Create test items with RFID tags
INSERT INTO items (item_type_id, rfid_tag, status, home_location_id) VALUES 
  (1, 'RFID-OSC-001', 'AVAILABLE', 1),
  (1, 'RFID-OSC-002', 'AVAILABLE', 1),
  (2, 'RFID-TOOL-001', 'AVAILABLE', 1);

-- Verify data
SELECT 'Profiles' as table_name, count(*) as count FROM profiles
UNION ALL
SELECT 'Locations', count(*) FROM locations
UNION ALL
SELECT 'User Cards', count(*) FROM user_cards
UNION ALL
SELECT 'Access Permissions', count(*) FROM access_permissions
UNION ALL
SELECT 'Item Types', count(*) FROM item_types
UNION ALL
SELECT 'Items', count(*) FROM items;
