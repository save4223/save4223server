-- ============================================
-- Save4223 Database Seed File
-- ============================================
-- 
-- 这个文件会在 `supabase db reset` 后自动执行
-- 用于插入测试数据和应用 RLS policies
--
-- ⚠️ 注意: 表结构由 Drizzle ORM 管理，不是这里
-- RLS policies 在这里应用，因为 seed.sql 在 schema 初始化后运行

-- ============================================
-- RLS Policies
-- ============================================
-- 使用 DO 块包裹，即使表不存在也不会报错

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
-- 测试数据 (可选)
-- ============================================

-- 如果需要插入测试数据，请在这里添加
-- INSERT INTO ...
