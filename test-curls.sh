-- ============================================
-- Curl Commands for API Testing
-- User ID: b6961f07-e43a-4304-ab75-dc51c0b58ce5
-- ============================================

-- 1. 创建借用交易 (Borrow RFID-OSC-002)
-- 先创建一个 cabinet session，然后创建 transaction

-- Step 1: Create Cabinet Session
curl -X POST http://100.83.123.68:3000/api/edge/sync-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer edge_device_secret_key" \
  -d '{
    "session_id": "'$(uuidgen)'",
    "cabinet_id": 1,
    "user_id": "b6961f07-e43a-4304-ab75-dc51c0b58ce5",
    "rfids_present": ["RFID-OSC-001", "RFID-OSC-003"]
  }'

-- 这个会自动创建 BORROW 交易（RFID-OSC-002 不见了 = 被借走）

-- 2. 创建归还交易 (Return RFID-OSC-002)
-- 再次调用 sync-session，RFID-OSC-002 又出现了 = 归还
curl -X POST http://100.83.123.68:3000/api/edge/sync-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer edge_device_secret_key" \
  -d '{
    "session_id": "'$(uuidgen)'",
    "cabinet_id": 1,
    "user_id": "b6961f07-e43a-4304-ab75-dc51c0b58ce5",
    "rfids_present": ["RFID-OSC-001", "RFID-OSC-002", "RFID-OSC-003"]
  }'

-- 3. 直接插入交易记录到数据库 (用于测试显示)
-- 借用 Digital Oscilloscope
INSERT INTO inventory_transactions (session_id, item_id, user_id, action_type, timestamp)
SELECT 
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
  id,
  'b6961f07-e43a-4304-ab75-dc51c0b58ce5'::UUID,
  'BORROW',
  NOW() - INTERVAL '2 days'
FROM items WHERE rfid_tag = 'RFID-OSC-002';

-- 借用 Multimeter
INSERT INTO inventory_transactions (session_id, item_id, user_id, action_type, timestamp)
SELECT 
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::UUID,
  id,
  'b6961f07-e43a-4304-ab75-dc51c0b58ce5'::UUID,
  'BORROW',
  NOW() - INTERVAL '5 days'
FROM items WHERE rfid_tag = 'RFID-MUL-003';

-- 4. 查询用户的交易记录
curl http://100.83.123.68:3000/api/user/items \
  -H "Cookie: sb-access-token=YOUR_TOKEN_HERE"

-- 5. 更新用户资料 (修改名字)
curl -X PATCH http://100.83.123.68:3000/api/user/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN_HERE" \
  -d '{
    "full_name": "Vicky New Name"
  }'
