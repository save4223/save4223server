-- ============================================
-- Migration: 0001_rls_policies
-- Description: Enable RLS and create policies for all tables
-- ============================================

-- ============================================
-- Profiles 表策略
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- ============================================
-- Locations 表策略
-- ============================================
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Locations are viewable by authenticated users" ON locations;
CREATE POLICY "Locations are viewable by authenticated users" 
ON locations FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Only admins can modify locations" ON locations;
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
-- Access Permissions 表策略
-- ============================================
ALTER TABLE access_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own permissions" ON access_permissions;
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

DROP POLICY IF EXISTS "Users can create own permission requests" ON access_permissions;
CREATE POLICY "Users can create own permission requests" 
ON access_permissions FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Only admins can approve permissions" ON access_permissions;
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
-- User Cards 表策略
-- ============================================
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cards" ON user_cards;
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

DROP POLICY IF EXISTS "Only admins can manage cards" ON user_cards;
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
-- Item Types 表策略
-- ============================================
ALTER TABLE item_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Item types are viewable by authenticated users" ON item_types;
CREATE POLICY "Item types are viewable by authenticated users" 
ON item_types FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Only admins can modify item types" ON item_types;
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
-- Items 表策略
-- ============================================
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Items are viewable by authenticated users" ON items;
CREATE POLICY "Items are viewable by authenticated users" 
ON items FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Only admins can modify items" ON items;
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
-- Cabinet Sessions 表策略
-- ============================================
ALTER TABLE cabinet_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON cabinet_sessions;
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

-- ============================================
-- Inventory Transactions 表策略
-- ============================================
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON inventory_transactions;
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
