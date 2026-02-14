# 🧪 Postman 测试步骤详解

## 📦 准备

### 1. 下载 Postman
- 官网: https://www.postman.com/downloads/
- 下载并安装 Desktop App

### 2. 导入测试集合
1. 打开 Postman
2. 点击左上角的 **Import** 按钮
3. 选择 `File` → 选择 `postman-collection.json`
4. 点击 **Import**

你会看到 **Save4223 Edge API** 集合出现在左侧栏

---

## 🚀 运行测试 (一步一步)

### Test 1: Authorize Card (Unknown Card) ⬅️ 先跑这个

**目的**: 测试未知卡片会被拒绝

**步骤**:
1. 在左侧栏找到 **"3. Authorize Card (Unknown Card)"**
2. 点击它
3. 右侧会出现请求详情
4. 点击蓝色的 **Send** 按钮

**Expected Response**:
```json
{
  "authorized": false,
  "reason": "Card not registered"
}
```

✅ **如果看到这个，API 正常工作！**

---

### Test 2: Authorize Card (Open Cabinet)

**目的**: 测试 TEST123 卡片可以打开开放柜子

**步骤**:
1. 点击 **"1. Authorize Card (Open Cabinet)"**
2. 点击 **Send**

**Expected Response**:
```json
{
  "authorized": true,
  "session_id": "uuid...",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_name": "Test User",
  "cabinet_name": "Cabinet A - Open Access"
}
```

📋 **复制 `session_id`**，后面会用到！

---

### Test 3: Authorize Card (Restricted Cabinet)

**目的**: 测试限制柜子需要权限

**步骤**:
1. 点击 **"2. Authorize Card (Restricted - Should Succeed)"**
2. 点击 **Send**

**Expected**: `authorized: true` (因为我们给 TEST123 分配了权限)

---

### Test 4: Sync Session (Borrow Item)

**目的**: 模拟借物品

**Body 内容**:
```json
{
  "session_id": "{{$guid}}",  // ← Postman 会自动生成 UUID
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "cabinet_id": 1,
  "start_rfids": ["RFID-OSC-001", "RFID-TOOL-001"],
  "end_rfids": ["RFID-TOOL-001"]
}
```

**逻辑**:
- 开始时: OSC-001 + TOOL-001 在柜子里
- 结束时: 只有 TOOL-001
- 结果: **OSC-001 被借走了**

**步骤**:
1. 点击 **"4. Sync Session (Borrow Item)"**
2. 点击 **Send**

**Expected Response**:
```json
{
  "success": true,
  "transactions": [
    {
      "item_id": "...",
      "rfid_tag": "RFID-OSC-001",
      "action": "BORROW",
      "due_at": "2024-02-28T..."
    }
  ],
  "summary": { "borrowed": 1, "returned": 0 }
}
```

---

### Test 5: Sync Session (Return Item)

**目的**: 模拟还物品

**Body 内容**:
```json
{
  "session_id": "{{$guid}}",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "cabinet_id": 1,
  "start_rfids": ["RFID-TOOL-001"],
  "end_rfids": ["RFID-TOOL-001", "RFID-OSC-001"]
}
```

**逻辑**:
- 开始时: 只有 TOOL-001
- 结束时: TOOL-001 + OSC-001
- 结果: **OSC-001 被还回来了**

**Expected**: `action: "RETURN"`

---

### Test 6: Local Sync

**目的**: 获取所有用户权限 (给 Pi 缓存用)

**步骤**:
1. 点击 **"7. Local Sync (All Users)"**
2. 点击 **Send**

**Expected**:
```json
{
  "last_updated": "2024-01-15T...",
  "users": [
    {
      "card_uid": "TEST123",
      "user_id": "...",
      "user_name": "Test User",
      "cabinet_permissions": ["*", 2]
    }
  ],
  "restricted_cabinets": [2]
}
```

---

### Test 7-10: 错误测试

**"9. Unauthorized (Missing Token)"**:
- 测试不带 API Key → 应该返回 401

**"10. Unauthorized (Wrong Token)"**:
- 测试错误的 API Key → 应该返回 401

---

## 🔍 检查结果

### 在 Supabase Studio 查看数据

1. 打开 http://100.83.123.68:54323
2. 点击 **Table Editor**
3. 查看以下表:
   - `cabinet_sessions` - 会话记录
   - `inventory_transactions` - 交易记录
   - `items` - 物品状态 (应该看到 OSC-001 变成 BORROWED)

---

## 📝 Postman 技巧

### 1. 环境变量 (Environment)

设置环境变量避免重复输入:

1. 点击右上角 **⚙️ Environments** → **Create Environment**
2. 添加变量:
   - `base_url`: `http://100.83.123.68:3000`
   - `edge_api_secret`: `edge_device_secret_key`
3. 在请求中使用: `{{base_url}}`

### 2. Collection Runner (批量运行)

1. 点击集合名称 **Save4223 Edge API** 旁边的 **▶️ Run**
2. 选择要运行的请求
3. 点击 **Run Save4223 Edge API**
4. 批量执行所有测试！

### 3. 查看响应

- **Pretty**: 格式化 JSON
- **Raw**: 原始响应
- **Preview**: 预览 (HTML 时有用)
- **Visualize**: 可视化

### 4. 保存响应

点击 **Save Response** 保存测试结果

---

## ✅ 测试清单

- [ ] Test 1: 未知卡片返回 403
- [ ] Test 2: 开放柜子返回 200 + session_id
- [ ] Test 3: 限制柜子有权限返回 200
- [ ] Test 4: 借物品返回 BORROW
- [ ] Test 5: 还物品返回 RETURN
- [ ] Test 6: Local sync 返回用户列表
- [ ] Test 9: 无 Token 返回 401
- [ ] Test 10: 错误 Token 返回 401

全部通过 = ✅ **API 工作正常！**

---

## 🐛 常见问题

### 问题: Connection refused
**解决**: 确保 Next.js 在运行 (`npm run dev`)

### 问题: 401 Unauthorized
**解决**: 检查 Headers 里是否有 `Authorization: Bearer edge_device_secret_key`

### 问题: 404 Not Found
**解决**: 检查 URL 是否正确 `http://100.83.123.68:3000/api/edge/...`

### 问题: 500 Server Error
**解决**: 查看 Next.js 日志: `tail -f /tmp/nextjs.log`

---

## 🎬 视频演示步骤

如果你需要，可以录制屏幕:
1. 打开 Postman
2. Import 集合
3. 运行 Test 1 → 展示响应
4. 运行 Test 2 → 展示 session_id
5. 运行 Test 4 → 展示借物品
6. 打开 Supabase Studio → 展示数据库变化

这样就能完整演示 API 功能！
