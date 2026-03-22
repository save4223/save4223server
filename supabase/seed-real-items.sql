-- ============================================
-- Insert Real Physical Tools with RFID Tags
-- Run AFTER seed-item-types.sql has been applied
-- Apply via Supabase Dashboard SQL Editor
-- ============================================

INSERT INTO items (id, item_type_id, rfid_tag, status, updated_at)
VALUES
  (gen_random_uuid(), (SELECT id FROM item_types WHERE name_cn_simplified = '万用表'      LIMIT 1), 'E28068940000403164C95D96', 'AVAILABLE', NOW()),
  (gen_random_uuid(), (SELECT id FROM item_types WHERE name_cn_simplified = '扳手'        LIMIT 1), 'E28068940000403353933C40', 'AVAILABLE', NOW()),
  (gen_random_uuid(), (SELECT id FROM item_types WHERE name_cn_simplified = '热熔胶枪（含胶棒）' LIMIT 1), 'E28068940000503353930840', 'AVAILABLE', NOW()),
  (gen_random_uuid(), (SELECT id FROM item_types WHERE name_cn_simplified = '螺丝盒'      LIMIT 1), 'E28068940000403353933040', 'AVAILABLE', NOW()),
  (gen_random_uuid(), (SELECT id FROM item_types WHERE name_cn_simplified = '铲刀'        LIMIT 1), 'E28068940000403353932440', 'AVAILABLE', NOW()),
  (gen_random_uuid(), (SELECT id FROM item_types WHERE name_cn_simplified = '斜口钳'      LIMIT 1), 'E2806894000050335392FC40', 'AVAILABLE', NOW()),
  (gen_random_uuid(), (SELECT id FROM item_types WHERE name_cn_simplified = '活动扳手'    LIMIT 1), 'E28068940000503353933840', 'AVAILABLE', NOW()),
  (gen_random_uuid(), (SELECT id FROM item_types WHERE name_cn_simplified = '尖嘴钳'      LIMIT 1), 'E28068940000403353931840', 'AVAILABLE', NOW())
ON CONFLICT (rfid_tag) DO NOTHING;


-- Verify inserted items
SELECT
  i.rfid_tag,
  it.name,
  it.name_cn_simplified,
  it.category,
  i.status
FROM items i
JOIN item_types it ON i.item_type_id = it.id
WHERE i.rfid_tag IN (
  'E28068940000403164C95D96',
  'E28068940000403353933C40',
  'E28068940000503353930840',
  'E28068940000403353933040',
  'E28068940000403353932440',
  'E2806894000050335392FC40',
  'E28068940000503353933840',
  'E28068940000403353931840'
)
ORDER BY it.name_cn_simplified;
