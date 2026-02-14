# Supabase RLS Policies

Row Level Security (RLS) policies for Save4223 Smart Inventory System.

## 文件说明

| 文件 | 说明 |
|------|------|
| `seed.sql` | **主要文件** - 包含 RLS policies，在 `supabase db reset` 后自动执行 |
| `0001_rls_policies.sql` | 备份/参考文件 |
| `README.md` | 本文件 |

## ⚠️ 重要: 数据库结构由 Drizzle ORM 管理

**执行顺序：**
1. `supabase db reset` - 重置数据库，运行 seed.sql
2. `npx drizzle-kit migrate` - 应用 Drizzle 迁移，创建表结构

**RLS Policies 放在 seed.sql 中**，因为它：
- 在 schema 初始化后运行
- 使用 `DO $$` 块检查表是否存在，不会报错
- 即使表不存在也能安全执行

## 🚀 部署方式

### 方式 1: 自动部署 (推荐)

```bash
# 1. 重置数据库 (会自动执行 seed.sql)
npx supabase db reset

# 2. 应用 Drizzle 迁移创建表
npx drizzle-kit migrate

# 3. 重新运行 seed.sql 应用 RLS (因为表现在存在了)
npx supabase db reset
```

**或者更简单的流程：**

```bash
# 1. 先确保表存在
npx drizzle-kit migrate

# 2. 然后重置并应用 RLS
npx supabase db reset
```

### 方式 2: 手动应用

如果只需要应用 RLS 而不想重置数据库：

```bash
# 使用 psql 执行
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seed.sql
```

或在 Supabase Studio SQL Editor 中执行 `seed.sql` 内容。

### 方式 3: Supabase Studio

1. 打开 http://127.0.0.1:54323
2. SQL Editor → New query
3. 复制 `supabase/seed.sql` 内容
4. Run

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

## 角色说明

- **anon** - 未认证用户 (权限最小)
- **authenticated** - 已登录用户
- **service_role** - 服务端角色 (Edge device, 绕过 RLS)

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

## 常见问题

### Q: `supabase db reset` 报错 "relation does not exist"?
A: 确保先运行 `npx drizzle-kit migrate` 创建表，然后再运行 `supabase db reset`。

### Q: Edge device 无法写入数据？
A: Edge device 应该使用 `service_role` key，它会绕过 RLS。

### Q: 用户能看到别人的数据？
A: 检查 policy 中的 `USING` 条件，确保有 `user_id = auth.uid()`。

## 安全建议

1. **生产环境务必启用 RLS**
2. **service_role key 不要泄露到前端**
3. **定期审计 policies**
