# Supabase RLS Policies

Row Level Security (RLS) policies for Save4223 Smart Inventory System.

## 文件说明

| 文件 | 说明 |
|------|------|
| `../migrations/0001_rls_policies.sql` | **主要文件** - 通过 `supabase db reset` 自动应用 |
| `01_rls_policies.sql` | 备份/参考文件 |

## ⚠️ 重要: PostgreSQL 不支持 `CREATE POLICY IF NOT EXISTS`

使用以下模式:
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name ...;
```

## 表权限矩阵

| 表 | 查看 | 插入 | 更新 | 删除 | 备注 |
|----|------|------|------|------|------|
| profiles | 所有人 | 自己 | 自己 | - | 用户资料 |
| locations | 认证用户 | 管理员 | 管理员 | 管理员 | 位置管理 |
| access_permissions | 自己/管理员 | 自己 | 管理员 | 管理员 | 权限申请 |
| user_cards | 自己/管理员 | 管理员 | 管理员 | 管理员 | NFC卡片 |
| item_types | 认证用户 | 管理员 | 管理员 | 管理员 | 工具类型 |
| items | 认证用户 | 管理员 | 管理员 | 管理员 | 工具实例 |
| cabinet_sessions | 自己/管理员 | Edge | - | - | 会话记录 |
| inventory_transactions | 自己/管理员 | Edge | - | - | 交易记录 |

## 部署方式

### 方式 1: Supabase CLI (推荐)

```bash
# 会自动执行 migrations 目录下的所有文件
supabase db reset
```

### 方式 2: Supabase Studio

1. 打开 http://127.0.0.1:54323 (本地) 或 https://supabase.com/dashboard
2. 进入 SQL Editor
3. 新建 Query
4. 复制 `supabase/migrations/0001_rls_policies.sql` 全部内容
5. 点击 **Run**

### 方式 3: psql

```bash
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/migrations/0001_rls_policies.sql
```

## 角色说明

- **anon** - 未认证用户 (权限最小)
- **authenticated** - 已登录用户
- **service_role** - 服务端角色 (Edge device, 绕过 RLS)

## 手动启用 RLS (如果不生效)

```sql
-- 为单个表启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabinet_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- 强制对所有角色启用 RLS (包括 table owner)
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
```

## 验证 RLS 是否生效

```sql
-- 检查 RLS 是否启用
SELECT 
  schemaname, 
  tablename, 
  rowsecurity,
  forcerowsecurity
FROM pg_tables 
WHERE schemaname = 'public';

-- 查看所有 policies
SELECT 
  schemaname, 
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 测试 RLS

```sql
-- 模拟不同用户查询 (需要 superuser)
SET ROLE authenticated;
SELECT * FROM items;  -- 应该能看到
SET ROLE anon;
SELECT * FROM items;  -- 应该被阻止 (如果没有对 anon 的策略)
RESET ROLE;
```

## 常见问题

### Q: Edge device 无法写入数据？
A: Edge device 应该使用 `service_role` key，它会绕过 RLS。确保你的 Edge API 使用正确的 key。

### Q: 用户能看到别人的数据？
A: 检查 policy 中的 `USING` 条件是否正确。例如 `user_id = auth.uid()` 确保只能看自己的。

### Q: 如何临时禁用 RLS？
A: 
```sql
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
-- 或者
ALTER TABLE items FORCE ROW LEVEL SECURITY;  -- 重新启用
```

## 安全建议

1. **生产环境务必启用 RLS**
2. **service_role key 不要泄露到前端**
3. **定期审计 policies**
4. **测试时使用 anon/authenticated 角色模拟真实用户**
