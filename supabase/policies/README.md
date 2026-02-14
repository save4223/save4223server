# Supabase RLS Policies

Row Level Security (RLS) policies for Save4223 Smart Inventory System.

## 文件说明

| 文件 | 说明 |
|------|------|
| `01_rls_policies.sql` | 完整的 RLS 策略定义 |

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

### 方式 1: Supabase Studio (推荐)

1. 打开 http://127.0.0.1:54323 (本地) 或 https://supabase.com/dashboard
2. 进入 SQL Editor
3. 新建 Query
4. 复制 `01_rls_policies.sql` 全部内容
5. 点击 **Run**

### 方式 2: Supabase CLI

```bash
# 执行 SQL 文件
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/policies/01_rls_policies.sql

# 或者用 supabase 命令 (如果支持)
supabase db reset  # 会重置数据库并重新运行 migrations
```

### 方式 3: 编程方式

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, service_role_key)

// 读取并执行 SQL
const sql = fs.readFileSync('supabase/policies/01_rls_policies.sql', 'utf8')
const { error } = await supabase.rpc('exec_sql', { sql })
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
