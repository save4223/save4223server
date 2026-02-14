-- ============================================
-- Save4223 Smart Inventory System - RLS Policies
-- ============================================
-- 
-- 部署方式:
-- 1. 手动: 复制到 Supabase Studio SQL Editor 执行
-- 2. CLI: supabase db reset (会执行 migrations 和 seed)
-- 3. 远程: 登录 supabase.com → SQL Editor → New query → 粘贴执行
--
-- 注意: RLS 默认是关闭的，需要在 Table Editor 中开启

-- ============================================
-- 1. Profiles 表策略
-- ============================================

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 策略: 用户可以查看所有用户资料
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- 策略: 用户只能更新自己的资料
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 策略: 用户只能插入自己的资料
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. Locations 表策略
-- ============================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- 策略: 所有认证用户可以查看位置
CREATE POLICY "Locations are viewable by authenticated users" 
ON locations FOR SELECT 
TO authenticated 
USING (true);

-- 策略: 只有管理员可以修改位置
CREATE POLICY "Only admins can modify locations" 
ON locations FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('ADMIN', 'MANAGER')
  )
);

-- ============================================
-- 3. Access Permissions 表策略
-- ============================================

ALTER TABLE access_permissions ENABLE ROW LEVEL SECURITY;

-- 策略: 用户可以查看自己的权限申请
CREATE POLICY "Users can view own permissions" 
ON access_permissions FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('ADMIN', 'MANAGER')
  )
);

-- 策略: 用户可以创建自己的权限申请
CREATE POLICY "Users can create own permission requests" 
ON access_permissions FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- 策略: 只有管理员可以审批/修改权限
CREATE POLICY "Only admins can approve permissions" 
ON access_permissions FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('ADMIN', 'MANAGER')
  )
);

-- ============================================
-- 4. User Cards 表策略
-- ============================================

ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;

-- 策略: 用户可以查看自己的卡片
CREATE POLICY "Users can view own cards" 
ON user_cards FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('ADMIN', 'MANAGER')
  )
);

-- 策略: 只有管理员可以添加/修改卡片
CREATE POLICY "Only admins can manage cards" 
ON user_cards FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('ADMIN', 'MANAGER')
  )
);

-- ============================================
-- 5. Item Types 表策略
-- ============================================

ALTER TABLE item_types ENABLE ROW LEVEL SECURITY;

-- 策略: 所有认证用户可以查看工具类型
CREATE POLICY "Item types are viewable by authenticated users" 
ON item_types FOR SELECT 
TO authenticated 
USING (true);

-- 策略: 只有管理员可以修改工具类型
CREATE POLICY "Only admins can modify item types" 
ON item_types FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('ADMIN', 'MANAGER')
  )
);

-- ============================================
-- 6. Items 表策略
-- ============================================

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 策略: 所有认证用户可以查看工具
CREATE POLICY "Items are viewable by authenticated users" 
ON items FOR SELECT 
TO authenticated 
USING (true);

-- 策略: 只有管理员可以修改工具信息
CREATE POLICY "Only admins can modify items" 
ON items FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('ADMIN', 'MANAGER')
  )
);

-- ============================================
-- 7. Cabinet Sessions 表策略
-- ============================================

ALTER TABLE cabinet_sessions ENABLE ROW LEVEL SECURITY;

-- 策略: 用户可以查看自己的会话
CREATE POLICY "Users can view own sessions" 
ON cabinet_sessions FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('ADMIN', 'MANAGER')
  )
);

-- 策略: Edge device (service_role) 可以创建会话
-- 注意: service_role 绕过 RLS，不需要 policy

-- ============================================
-- 8. Inventory Transactions 表策略
-- ============================================

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- 策略: 用户可以查看自己的交易记录
CREATE POLICY "Users can view own transactions" 
ON inventory_transactions FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('ADMIN', 'MANAGER')
  )
);

-- 策略: Edge device 可以创建交易记录

-- ============================================
-- 9. Edge Device API 专用策略 (使用 service_role)
-- ============================================

-- 为 Edge API 创建特殊策略，允许 service_role 访问所有表
-- Supabase 的 service_role key 默认绕过 RLS，但建议显式定义

-- 如果需要限制 Edge device 只能访问特定操作，可以创建更细粒度的策略

-- ============================================
-- 10. 特殊策略: 用户只能借用 AVAILABLE 的物品
-- ============================================

-- 这个策略需要在应用层实现，因为涉及业务逻辑
-- 或者在 Edge API 中验证

-- ============================================
-- 验证命令
-- ============================================

-- 查看所有表的 RLS 状态:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- 查看所有 policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies WHERE schemaname = 'public';
