# Edge API Testing Guide

## Quick Test with curl

### 1. Test Authorization (Card Not Registered)
```bash
curl -X POST http://100.83.123.68:3000/api/edge/authorize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer edge_device_secret_key" \
  -d '{"card_uid":"UNKNOWN","cabinet_id":1}'
```
**Expected Response:**
```json
{ "authorized": false, "reason": "Card not registered" }
```

### 2. Test Authorization (Success - After Test Data)
```bash
curl -X POST http://100.83.123.68:3000/api/edge/authorize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer edge_device_secret_key" \
  -d '{"card_uid":"TEST123","cabinet_id":1}'
```
**Expected Response:**
```json
{
  "authorized": true,
  "session_id": "uuid...",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_name": "Test User",
  "cabinet_name": "Cabinet A - Open Access"
}
```

### 3. Test Sync Session (Borrow Item)
```bash
curl -X POST http://100.83.123.68:3000/api/edge/sync-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer edge_device_secret_key" \
  -d '{
    "session_id": "'$(uuidgen)'",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "cabinet_id": 1,
    "start_rfids": ["RFID-OSC-001", "RFID-TOOL-001"],
    "end_rfids": ["RFID-TOOL-001"]
  }'
```
**Expected Response:**
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

### 4. Test Local Sync
```bash
curl http://100.83.123.68:3000/api/edge/local-sync \
  -H "Authorization: Bearer edge_device_secret_key"
```

---

## Setup Test Data

1. Open Supabase Studio: http://100.83.123.68:54323
2. Go to SQL Editor
3. Run the contents of `test-data.sql`

This creates:
- 1 test user (card UID: `TEST123`)
- 3 locations (Cabinet A, B, Drawer 1)
- 3 items with RFID tags
- Permission for restricted cabinet

---

## Postman Collection

1. Import `postman-collection.json` into Postman
2. Set environment variables:
   - `base_url`: `http://100.83.123.68:3000`
   - `edge_api_secret`: `edge_device_secret_key`
3. Run requests in order

---

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/edge/authorize` | POST | Check card access to cabinet |
| `/api/edge/sync-session` | POST | Finalize session, calculate borrow/return |
| `/api/edge/local-sync` | GET | Get permission cache for Pi |

### Request Headers (All Endpoints)
```
Authorization: Bearer edge_device_secret_key
Content-Type: application/json  # For POST requests
```

---

## Expected Behaviors

### Authorization Logic
1. **Card not found** → `403: Card not registered`
2. **Card deactivated** → `403: Card deactivated`
3. **Open cabinet** → `200: authorized: true`
4. **Restricted cabinet + no permission** → `403: Access denied`
5. **Restricted cabinet + valid permission** → `200: authorized: true`

### Sync Session Logic
1. **Start RFID - End RFID** = BORROW (item taken)
2. **End RFID - Start RFID** = RETURN (item returned)
3. **No difference** → `200: No inventory changes`
4. Updates `items.status`, `current_holder_id`, `due_at`
5. Creates `inventory_transactions` records

### Local Sync Logic
1. Returns all active cards
2. Includes cabinet permissions
3. `*` permission = all non-restricted cabinets
4. Specific IDs = explicitly allowed restricted cabinets

---

## Troubleshooting

### API Returns 401
- Check `Authorization: Bearer edge_device_secret_key` header
- Verify no extra spaces in token

### API Returns 500
- Check Next.js logs: `tail -f /tmp/nextjs.log`
- Verify Supabase is running: `supabase status`
- Check database connection in `src/db/index.ts`

### Database Errors
- Verify migrations applied: `PGSSLMODE=disable npx drizzle-kit migrate`
- Check Supabase Studio for table existence
- Test data inserted correctly
