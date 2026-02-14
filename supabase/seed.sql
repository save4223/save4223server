-- ============================================
-- Save4223 Database Seed File
-- ============================================
-- 
-- 这个文件会在 `supabase db reset` 后自动执行
-- 用于插入初始数据和配置 RLS policies
--
-- 部署: supabase db reset

-- ============================================
-- 1. 插入测试数据 (可选)
-- ============================================

-- 测试用户资料 (UUID 需要与 auth.users 匹配)
-- INSERT INTO profiles (id, email, full_name, role) VALUES 
--   ('550e8400-e29b-41d4-a716-446655440000', 'admin@example.com', 'Admin User', 'ADMIN'),
--   ('550e8400-e29b-41d4-a716-446655440001', 'user@example.com', 'Test User', 'USER')
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. RLS Policies
-- ============================================

-- 注意: 以下 SQL 来自 policies/01_rls_policies.sql
-- 如果你更新了那个文件，请同步更新这里

-- Profiles 表
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Profiles are viewable by everyone" 
ON profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users can update own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Locations 表
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Locations are viewable by authenticated users" 
ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Only admins can modify locations" 
ON locations FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
);

-- Access Permissions 表
ALTER TABLE access_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view own permissions" 
ON access_permissions FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
);
CREATE POLICY IF NOT EXISTS "Users can create own permission requests" 
ON access_permissions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Only admins can approve permissions" 
ON access_permissions FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
);

-- User Cards 表
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view own cards" 
ON user_cards FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
);
CREATE POLICY IF NOT EXISTS "Only admins can manage cards" 
ON user_cards FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
);

-- Item Types 表
ALTER TABLE item_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Item types are viewable by authenticated users" 
ON item_types FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Only admins can modify item types" 
ON item_types FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
);

-- Items 表
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Items are viewable by authenticated users" 
ON items FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Only admins can modify items" 
ON items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
);

-- Cabinet Sessions 表
ALTER TABLE cabinet_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view own sessions" 
ON cabinet_sessions FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
);

-- Inventory Transactions 表
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view own transactions" 
ON inventory_transactions FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'MANAGER'))
);

-- ============================================
-- 3. 完成提示
-- ============================================

-- SELECT 'RLS policies applied successfully!' as status;
