-- ============================================
-- Save4223 Database Seed File
-- ============================================
-- 
-- 这个文件会在 `supabase db reset` 后自动执行
-- 用于插入测试数据和应用 RLS policies

-- ============================================
-- 1. RLS Policies
-- ============================================

DO $$
BEGIN
    -- Profiles 表
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
        CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;

    -- Locations 表
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
        ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Locations are viewable by authenticated users" ON locations;
        CREATE POLICY "Locations are viewable by authenticated users" ON locations FOR SELECT TO authenticated USING (true);
        DROP POLICY IF EXISTS "Only admins can modify locations" ON locations;
        CREATE POLICY "Only admins can modify locations" ON locations FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
        );
    END IF;

    -- Access Permissions 表
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

    -- User Cards 表
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

    -- Item Types 表
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_types') THEN
        ALTER TABLE item_types ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Item types are viewable by authenticated users" ON item_types;
        CREATE POLICY "Item types are viewable by authenticated users" ON item_types FOR SELECT TO authenticated USING (true);
        DROP POLICY IF EXISTS "Only admins can modify item types" ON item_types;
        CREATE POLICY "Only admins can modify item types" ON item_types FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
        );
    END IF;

    -- Items 表
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'items') THEN
        ALTER TABLE items ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Items are viewable by authenticated users" ON items;
        CREATE POLICY "Items are viewable by authenticated users" ON items FOR SELECT TO authenticated USING (true);
        DROP POLICY IF EXISTS "Only admins can modify items" ON items;
        CREATE POLICY "Only admins can modify items" ON items FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
        );
    END IF;

    -- Cabinet Sessions 表
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cabinet_sessions') THEN
        ALTER TABLE cabinet_sessions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view own sessions" ON cabinet_sessions;
        CREATE POLICY "Users can view own sessions" ON cabinet_sessions FOR SELECT TO authenticated USING (
            user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
        );
    END IF;

    -- Inventory Transactions 表
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
BEGIN
    -- 检查表是否存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE NOTICE 'Tables not created yet. Run: npm run db:migrate';
        RETURN;
    END IF;

    -- 2.1 插入用户资料
    INSERT INTO profiles (id, email, full_name, role, created_at)
    VALUES 
        (v_admin_id, 'admin@example.com', 'Admin User', 'ADMIN', NOW()),
        (v_user_id, 'vicky@example.com', 'Vicky', 'USER', NOW())
    ON CONFLICT (id) DO NOTHING;

    -- 2.2 插入位置
    INSERT INTO locations (name, description, is_restricted, created_at)
    VALUES 
        ('Cabinet A', 'Open access cabinet', false, NOW()),
        ('Cabinet B', 'Restricted cabinet', true, NOW()),
        ('Drawer 1', 'Tool drawer', false, NOW())
    ON CONFLICT DO NOTHING;

    -- 获取位置 ID
    SELECT id INTO v_cabinet_a_id FROM locations WHERE name = 'Cabinet A' LIMIT 1;
    SELECT id INTO v_cabinet_b_id FROM locations WHERE name = 'Cabinet B' LIMIT 1;
    SELECT id INTO v_drawer_id FROM locations WHERE name = 'Drawer 1' LIMIT 1;

    -- 2.3 插入权限申请 (Vicky 可以访问 Cabinet B)
    INSERT INTO access_permissions (user_id, location_id, status, approved_by, approved_at, created_at)
    VALUES 
        (v_user_id, v_cabinet_b_id, 'APPROVED', v_admin_id, NOW(), NOW())
    ON CONFLICT DO NOTHING;

    -- 2.4 插入用户卡片
    INSERT INTO user_cards (user_id, card_uid, is_active, created_at)
    VALUES 
        (v_user_id, 'TEST123', true, NOW())
    ON CONFLICT (card_uid) DO NOTHING;

    -- 2.5 插入工具类型
    INSERT INTO item_types (name, category, description, max_borrow_duration, created_at)
    VALUES 
        ('Digital Oscilloscope', 'DEVICE', '100MHz digital oscilloscope for signal analysis and debugging', '14 days', NOW()),
        ('Precision Screwdriver Set', 'TOOL', 'Professional precision screwdrivers for electronics repair', '7 days', NOW()),
        ('Multimeter', 'DEVICE', 'Digital multimeter for voltage, current, and resistance measurement', '7 days', NOW()),
        ('Soldering Station', 'TOOL', 'Temperature controlled soldering station with various tips', '14 days', NOW())
    ON CONFLICT (name) DO NOTHING;

    -- 获取工具类型 ID
    SELECT id INTO v_osc_id FROM item_types WHERE name = 'Digital Oscilloscope' LIMIT 1;
    SELECT id INTO v_tool_id FROM item_types WHERE name = 'Precision Screwdriver Set' LIMIT 1;
    SELECT id INTO v_multi_id FROM item_types WHERE name = 'Multimeter' LIMIT 1;

    -- 2.6 插入工具个体
    INSERT INTO items (item_type_id, rfid_tag, status, location_id, current_holder_id, due_at, created_at)
    VALUES 
        -- Oscilloscopes
        (v_osc_id, 'RFID-OSC-001', 'BORROWED', v_cabinet_a_id, v_user_id, NOW() + INTERVAL '14 days', NOW()),
        (v_osc_id, 'RFID-OSC-002', 'AVAILABLE', v_cabinet_a_id, NULL, NULL, NOW()),
        (v_osc_id, 'RFID-OSC-003', 'AVAILABLE', v_cabinet_a_id, NULL, NULL, NOW()),
        -- Screwdriver
        (v_tool_id, 'RFID-TOOL-001', 'AVAILABLE', v_drawer_id, NULL, NULL, NOW()),
        -- Multimeters
        (v_multi_id, 'RFID-MUL-001', 'BORROWED', v_cabinet_b_id, v_user_id, NOW() + INTERVAL '5 days', NOW()),
        (v_multi_id, 'RFID-MUL-002', 'BORROWED', v_cabinet_b_id, v_user_id, NOW() + INTERVAL '12 days', NOW()),
        -- Soldering Station
        (v_tool_id + 2, 'RFID-SOL-001', 'MAINTENANCE', v_cabinet_a_id, NULL, NULL, NOW())
    ON CONFLICT (rfid_tag) DO NOTHING;

    RAISE NOTICE 'Mock data inserted successfully!';
END $$;
