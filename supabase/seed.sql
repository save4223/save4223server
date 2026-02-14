-- ============================================
-- Save4223 Database Seed File
-- ============================================
-- 
-- 这个文件会在 `supabase db reset` 后自动执行
-- 仅用于插入测试数据，不要在这里放 RLS policies
--
-- RLS policies 放在: supabase/migrations/0001_rls_policies.sql
--
-- 部署: supabase db reset

-- ============================================
-- 测试数据 (可选)
-- ============================================

-- 测试用户资料 (UUID 需要与 auth.users 匹配)
-- INSERT INTO profiles (id, email, full_name, role) VALUES 
--   ('550e8400-e29b-41d4-a716-446655440000', 'admin@example.com', 'Admin User', 'ADMIN'),
--   ('550e8400-e29b-41d4-a716-446655440001', 'user@example.com', 'Test User', 'USER')
-- ON CONFLICT (id) DO NOTHING;

-- 如果需要更多测试数据，请在这里添加
