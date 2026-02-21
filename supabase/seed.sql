-- ============================================
-- Save4223 Database Seed File
-- ============================================

-- ============================================
-- 1. RLS Policies
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
        CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
        ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Locations are viewable by authenticated users" ON locations;
        CREATE POLICY "Locations are viewable by authenticated users" ON locations FOR SELECT TO authenticated USING (true);
        DROP POLICY IF EXISTS "Only admins can modify locations" ON locations;
        CREATE POLICY "Only admins can modify locations" ON locations FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
        );
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'access_permissions') THEN
        ALTER TABLE access_permissions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view own permissions" ON access_permissions;
        CREATE POLICY "Users can view own permissions" ON access_permissions FOR SELECT TO authenticated USING (
            user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
        );
        DROP POLICY IF EXISTS "Users can create own permission requests" ON access_permissions;
        CREATE POLICY "Users can create own permission requests" ON access_permissions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
        DROP POLICY IF EXISTS "Only admins can approve permissions" ON access_permissions;
        CREATE POLICY "Only admins can approve permissions" ON access_permissions FOR UPDATE TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
        );
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_cards') THEN
        ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view own cards" ON user_cards;
        CREATE POLICY "Users can view own cards" ON user_cards FOR SELECT TO authenticated USING (
            user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
        );
        DROP POLICY IF EXISTS "Only admins can manage cards" ON user_cards;
        CREATE POLICY "Only admins can manage cards" ON user_cards FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
        );
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_types') THEN
        ALTER TABLE item_types ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Item types are viewable by authenticated users" ON item_types;
        CREATE POLICY "Item types are viewable by authenticated users" ON item_types FOR SELECT TO authenticated USING (true);
        DROP POLICY IF EXISTS "Only admins can modify item types" ON item_types;
        CREATE POLICY "Only admins can modify item types" ON item_types FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
        );
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'items') THEN
        ALTER TABLE items ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Items are viewable by authenticated users" ON items;
        CREATE POLICY "Items are viewable by authenticated users" ON items FOR SELECT TO authenticated USING (true);
        DROP POLICY IF EXISTS "Only admins can modify items" ON items;
        CREATE POLICY "Only admins can modify items" ON items FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
        );
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cabinet_sessions') THEN
        ALTER TABLE cabinet_sessions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view own sessions" ON cabinet_sessions;
        CREATE POLICY "Users can view own sessions" ON cabinet_sessions FOR SELECT TO authenticated USING (
            user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
        );
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_transactions') THEN
        ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view own transactions" ON inventory_transactions;
        CREATE POLICY "Users can view own transactions" ON inventory_transactions FOR SELECT TO authenticated USING (
            user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
        );
    END IF;
END $$;

-- ============================================
-- 2. Mock Data (测试数据)
-- ============================================

DO $$
DECLARE
    v_admin_id UUID := '550e8400-e29b-41d4-a716-446655440000'::UUID;
    v_user_id UUID := '550e8400-e29b-41d4-a716-446655440001'::UUID;
    v_cabinet_a_id INTEGER;
    v_cabinet_b_id INTEGER;
    v_drawer_id INTEGER;
    v_osc_id INTEGER;
    v_tool_id INTEGER;
    v_multi_id INTEGER;
    v_solder_id INTEGER;
BEGIN
    -- 检查表是否存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE NOTICE 'Tables not created yet. Run: npm run db:migrate';
        RETURN;
    END IF;

    -- 2.1 插入用户资料 (id 是主键，有唯一约束)
    INSERT INTO profiles (id, email, full_name, role, created_at)
    VALUES 
        (v_admin_id, 'admin@example.com', 'Admin User', 'ADMIN', NOW()),
        (v_user_id, 'vicky@example.com', 'Vicky', 'USER', NOW())
    ON CONFLICT (id) DO NOTHING;

    -- 2.2 插入位置 (注意: 列名是 type 不是 description, is_restricted 不是 isRestricted)
    INSERT INTO locations (name, type, is_restricted, created_at)
    VALUES 
        ('Cabinet A', 'CABINET', false, NOW()),
        ('Cabinet B', 'CABINET', true, NOW()),
        ('Drawer 1', 'DRAWER', false, NOW())
    ON CONFLICT DO NOTHING;

    -- 获取位置 ID
    SELECT id INTO v_cabinet_a_id FROM locations WHERE name = 'Cabinet A' LIMIT 1;
    SELECT id INTO v_cabinet_b_id FROM locations WHERE name = 'Cabinet B' LIMIT 1;
    SELECT id INTO v_drawer_id FROM locations WHERE name = 'Drawer 1' LIMIT 1;

    -- 2.3 插入权限申请 (没有唯一约束，用 WHERE NOT EXISTS 避免重复)
    INSERT INTO access_permissions (user_id, location_id, status, approved_by, created_at)
    SELECT v_user_id, v_cabinet_b_id, 'APPROVED', v_admin_id, NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM access_permissions 
        WHERE user_id = v_user_id AND location_id = v_cabinet_b_id
    );

    -- 2.4 插入用户卡片 (card_uid 有 unique 约束)
    INSERT INTO user_cards (user_id, card_uid, is_active, created_at)
    VALUES 
        (v_user_id, 'TEST123', true, NOW())
    ON CONFLICT (card_uid) DO NOTHING;

    -- 2.5 插入工具类型 (name 没有唯一约束，用 WHERE NOT EXISTS)
    INSERT INTO item_types (name, category, description, max_borrow_duration, created_at)
    SELECT 'Digital Oscilloscope', 'DEVICE', '100MHz digital oscilloscope for signal analysis and debugging', '14 days', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM item_types WHERE name = 'Digital Oscilloscope');

    INSERT INTO item_types (name, category, description, max_borrow_duration, created_at)
    SELECT 'Precision Screwdriver Set', 'TOOL', 'Professional precision screwdrivers for electronics repair', '7 days', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM item_types WHERE name = 'Precision Screwdriver Set');

    INSERT INTO item_types (name, category, description, max_borrow_duration, created_at)
    SELECT 'Multimeter', 'DEVICE', 'Digital multimeter for voltage, current, and resistance measurement', '7 days', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM item_types WHERE name = 'Multimeter');

    INSERT INTO item_types (name, category, description, max_borrow_duration, created_at)
    SELECT 'Soldering Station', 'TOOL', 'Temperature controlled soldering station with various tips', '14 days', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM item_types WHERE name = 'Soldering Station');

    -- 获取工具类型 ID
    SELECT id INTO v_osc_id FROM item_types WHERE name = 'Digital Oscilloscope' LIMIT 1;
    SELECT id INTO v_tool_id FROM item_types WHERE name = 'Precision Screwdriver Set' LIMIT 1;
    SELECT id INTO v_multi_id FROM item_types WHERE name = 'Multimeter' LIMIT 1;
    SELECT id INTO v_solder_id FROM item_types WHERE name = 'Soldering Station' LIMIT 1;

    -- 2.6 插入工具个体 (rfid_tag 有 unique 约束, items 表没有 created_at)
    INSERT INTO items (item_type_id, rfid_tag, status, home_location_id, current_holder_id, due_at)
    VALUES 
        (v_osc_id, 'RFID-OSC-001', 'BORROWED', v_cabinet_a_id, v_user_id, NOW() + INTERVAL '14 days'),
        (v_osc_id, 'RFID-OSC-002', 'AVAILABLE', v_cabinet_a_id, NULL, NULL),
        (v_osc_id, 'RFID-OSC-003', 'AVAILABLE', v_cabinet_a_id, NULL, NULL),
        (v_tool_id, 'RFID-TOOL-001', 'AVAILABLE', v_drawer_id, NULL, NULL),
        (v_multi_id, 'RFID-MUL-001', 'BORROWED', v_cabinet_b_id, v_user_id, NOW() + INTERVAL '5 days'),
        (v_multi_id, 'RFID-MUL-002', 'BORROWED', v_cabinet_b_id, v_user_id, NOW() + INTERVAL '12 days'),
        (v_solder_id, 'RFID-SOL-001', 'MAINTENANCE', v_cabinet_a_id, NULL, NULL)
    ON CONFLICT (rfid_tag) DO NOTHING;

    RAISE NOTICE 'Mock data inserted successfully!';
END $$;

-- ============================================
-- 3. Storage Bucket Setup
-- ============================================

-- Create the tool-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'tool-images',
    'tool-images',
    true,
    20971520,  -- 20MB in bytes
    ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies - allow authenticated users to upload/view images
DO $$
BEGIN
    -- Allow authenticated users to select (view) any object
    DROP POLICY IF EXISTS "Allow authenticated users to view images" ON storage.objects;
    CREATE POLICY "Allow authenticated users to view images"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'tool-images');

    -- Allow authenticated users to insert (upload) objects
    DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
    CREATE POLICY "Allow authenticated users to upload images"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'tool-images');

    -- Allow authenticated users to delete their own objects (optional)
    DROP POLICY IF EXISTS "Allow authenticated users to delete images" ON storage.objects;
    CREATE POLICY "Allow authenticated users to delete images"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'tool-images');
END $$;

-- ============================================
-- 4. Auth Trigger - Auto-create profile on signup
-- ============================================

-- Function to create profile when new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'USER',
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
