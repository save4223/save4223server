-- ============================================
-- Seed Screws / Fasteners from screws.csv
-- Inserts into item_types + item_type_fastener_specs
-- Apply via Supabase Dashboard SQL Editor
-- ============================================
-- Quantity mapping: High=100 (threshold 20), Medium=50 (threshold 10), Low=20 (threshold 5)
-- Grid location: row (A-G), col (0-9)
-- ============================================

-- Add grid location columns if not exists
ALTER TABLE item_type_fastener_specs
  ADD COLUMN IF NOT EXISTS row_letter varchar(1),
  ADD COLUMN IF NOT EXISTS col_num integer;

-- Create temp table with screw data (accessible to all statements)
DROP TABLE IF EXISTS temp_screw_data;
CREATE TEMP TABLE temp_screw_data (
  size varchar(10),
  length_mm real,
  head_shape varchar(50),
  drive_type varchar(50),
  location_code varchar(10),
  row_letter varchar(1),
  col_num integer,
  current_stock integer,
  min_threshold integer
);

INSERT INTO temp_screw_data VALUES
  -- M2
  ('M2',  2, 'Flat Head',   'Phillips', 'A0', 'A', 0, 100, 20),
  ('M2',  4, 'Socket Head', 'Phillips', 'A1', 'A', 1,  50, 10),
  ('M2',  6, 'Button Head', 'Phillips', 'A2', 'A', 2,  20,  5),
  ('M2',  8, 'Pan Head',    'Phillips', 'A3', 'A', 3, 100, 20),
  ('M2', 10, 'Socket Head', 'Hex',      'A4', 'A', 4,  20,  5),
  ('M2', 12, 'Flat Head',   'Phillips', 'A5', 'A', 5,  20,  5),
  ('M2', 14, 'Socket Head', 'Phillips', 'A6', 'A', 6, 100, 20),
  ('M2', 16, 'Button Head', 'Phillips', 'A7', 'A', 7,  50, 10),
  ('M2', 18, 'Pan Head',    'Phillips', 'A8', 'A', 8,  20,  5),
  ('M2', 20, 'Socket Head', 'Hex',      'A9', 'A', 9, 100, 20),
  -- M3
  ('M3',  2, 'Flat Head',   'Phillips', 'B0', 'B', 0,  50, 10),
  ('M3',  4, 'Socket Head', 'Phillips', 'B1', 'B', 1,  20,  5),
  ('M3',  6, 'Button Head', 'Phillips', 'B2', 'B', 2, 100, 20),
  ('M3',  8, 'Pan Head',    'Phillips', 'B3', 'B', 3,  50, 10),
  ('M3', 10, 'Socket Head', 'Hex',      'B4', 'B', 4,  20,  5),
  ('M3', 12, 'Flat Head',   'Phillips', 'B5', 'B', 5, 100, 20),
  ('M3', 14, 'Socket Head', 'Phillips', 'B6', 'B', 6,  50, 10),
  ('M3', 16, 'Button Head', 'Phillips', 'B7', 'B', 7,  20,  5),
  ('M3', 18, 'Pan Head',    'Phillips', 'B8', 'B', 8, 100, 20),
  ('M3', 20, 'Socket Head', 'Hex',      'B9', 'B', 9,  50, 10),
  -- M4
  ('M4',  2, 'Flat Head',   'Phillips', 'C0', 'C', 0,  20,  5),
  ('M4',  4, 'Socket Head', 'Phillips', 'C1', 'C', 1, 100, 20),
  ('M4',  6, 'Button Head', 'Phillips', 'C2', 'C', 2,  50, 10),
  ('M4',  8, 'Pan Head',    'Phillips', 'C3', 'C', 3,  20,  5),
  ('M4', 10, 'Socket Head', 'Hex',      'C4', 'C', 4, 100, 20),
  ('M4', 12, 'Flat Head',   'Phillips', 'C5', 'C', 5,  50, 10),
  ('M4', 14, 'Socket Head', 'Phillips', 'C6', 'C', 6,  20,  5),
  ('M4', 16, 'Button Head', 'Phillips', 'C7', 'C', 7, 100, 20),
  ('M4', 18, 'Pan Head',    'Phillips', 'C8', 'C', 8,  50, 10),
  ('M4', 20, 'Socket Head', 'Hex',      'C9', 'C', 9,  20,  5),
  -- M5
  ('M5',  2, 'Flat Head',   'Phillips', 'D0', 'D', 0, 100, 20),
  ('M5',  4, 'Socket Head', 'Phillips', 'D1', 'D', 1,  50, 10),
  ('M5',  6, 'Button Head', 'Phillips', 'D2', 'D', 2,  20,  5),
  ('M5',  8, 'Pan Head',    'Phillips', 'D3', 'D', 3, 100, 20),
  ('M5', 10, 'Socket Head', 'Hex',      'D4', 'D', 4,  50, 10),
  ('M5', 12, 'Flat Head',   'Phillips', 'D5', 'D', 5,  20,  5),
  ('M5', 14, 'Socket Head', 'Phillips', 'D6', 'D', 6, 100, 20),
  ('M5', 16, 'Button Head', 'Phillips', 'D7', 'D', 7,  50, 10),
  ('M5', 18, 'Pan Head',    'Phillips', 'D8', 'D', 8,  20,  5),
  ('M5', 20, 'Socket Head', 'Hex',      'D9', 'D', 9, 100, 20),
  -- M6
  ('M6',  2, 'Flat Head',   'Phillips', 'E0', 'E', 0,  50, 10),
  ('M6',  4, 'Socket Head', 'Phillips', 'E1', 'E', 1,  20,  5),
  ('M6',  6, 'Button Head', 'Phillips', 'E2', 'E', 2, 100, 20),
  ('M6',  8, 'Pan Head',    'Phillips', 'E3', 'E', 3,  50, 10),
  ('M6', 10, 'Socket Head', 'Hex',      'E4', 'E', 4,  20,  5),
  ('M6', 12, 'Flat Head',   'Phillips', 'E5', 'E', 5, 100, 20),
  ('M6', 14, 'Socket Head', 'Phillips', 'E6', 'E', 6,  50, 10),
  ('M6', 16, 'Button Head', 'Phillips', 'E7', 'E', 7,  20,  5),
  ('M6', 18, 'Pan Head',    'Phillips', 'E8', 'E', 8, 100, 20),
  ('M6', 20, 'Socket Head', 'Hex',      'E9', 'E', 9,  50, 10),
  -- M7
  ('M7',  2, 'Flat Head',   'Phillips', 'F0', 'F', 0,  20,  5),
  ('M7',  4, 'Socket Head', 'Phillips', 'F1', 'F', 1, 100, 20),
  ('M7',  6, 'Button Head', 'Phillips', 'F2', 'F', 2,  50, 10),
  ('M7',  8, 'Pan Head',    'Phillips', 'F3', 'F', 3,  20,  5),
  ('M7', 10, 'Socket Head', 'Hex',      'F4', 'F', 4, 100, 20),
  ('M7', 12, 'Flat Head',   'Phillips', 'F5', 'F', 5,  50, 10),
  ('M7', 14, 'Socket Head', 'Phillips', 'F6', 'F', 6,  20,  5),
  ('M7', 16, 'Button Head', 'Phillips', 'F7', 'F', 7, 100, 20),
  ('M7', 18, 'Pan Head',    'Phillips', 'F8', 'F', 8,  50, 10),
  ('M7', 20, 'Socket Head', 'Hex',      'F9', 'F', 9,  20,  5),
  -- M8
  ('M8',  2, 'Flat Head',   'Phillips', 'G0', 'G', 0, 100, 20),
  ('M8',  4, 'Socket Head', 'Phillips', 'G1', 'G', 1,  50, 10),
  ('M8',  6, 'Button Head', 'Phillips', 'G2', 'G', 2,  20,  5),
  ('M8',  8, 'Pan Head',    'Phillips', 'G3', 'G', 3, 100, 20),
  ('M8', 10, 'Socket Head', 'Hex',      'G4', 'G', 4,  50, 10),
  ('M8', 12, 'Flat Head',   'Phillips', 'G5', 'G', 5,  20,  5),
  ('M8', 14, 'Socket Head', 'Phillips', 'G6', 'G', 6, 100, 20),
  ('M8', 16, 'Button Head', 'Phillips', 'G7', 'G', 7,  50, 10),
  ('M8', 18, 'Pan Head',    'Phillips', 'G8', 'G', 8,  20,  5),
  ('M8', 20, 'Socket Head', 'Hex',      'G9', 'G', 9, 100, 20);

-- Insert new item types (or skip if exists)
WITH inserted_types AS (
  INSERT INTO item_types (
    name, name_cn_simplified, name_cn_traditional,
    category, description, description_cn,
    current_stock, min_threshold, created_at
  )
  SELECT
    'Screw ' || size || '×' || length_mm::integer || ' ' || head_shape || ' ' || drive_type,

    size || '×' || length_mm::integer || 'mm ' ||
      CASE head_shape
        WHEN 'Flat Head'   THEN '沉头'
        WHEN 'Socket Head' THEN '杯头'
        WHEN 'Button Head' THEN '圆头'
        WHEN 'Pan Head'    THEN '盘头'
      END ||
      CASE drive_type
        WHEN 'Phillips' THEN '十字'
        WHEN 'Hex'      THEN '内六角'
      END || '螺丝',

    size || '×' || length_mm::integer || 'mm ' ||
      CASE head_shape
        WHEN 'Flat Head'   THEN '沉頭'
        WHEN 'Socket Head' THEN '杯頭'
        WHEN 'Button Head' THEN '圓頭'
        WHEN 'Pan Head'    THEN '盤頭'
      END ||
      CASE drive_type
        WHEN 'Phillips' THEN '十字'
        WHEN 'Hex'      THEN '內六角'
      END || '螺絲',

    'CONSUMABLE',

    size || '×' || length_mm::integer || 'mm machine screw, ' ||
      lower(head_shape) || ', ' || drive_type || ' drive. Grid: ' || row_letter || col_num::text || '.',

    size || '×' || length_mm::integer || 'mm 机器螺丝，' ||
      CASE head_shape
        WHEN 'Flat Head'   THEN '沉头'
        WHEN 'Socket Head' THEN '杯头'
        WHEN 'Button Head' THEN '圆头'
        WHEN 'Pan Head'    THEN '盘头'
      END || '，' ||
      CASE drive_type
        WHEN 'Phillips' THEN '十字驱动'
        WHEN 'Hex'      THEN '内六角驱动'
      END || '。网格位置：' || row_letter || col_num::text || '。',

    current_stock,
    min_threshold,
    NOW()
  FROM temp_screw_data
  ON CONFLICT DO NOTHING
  RETURNING id, name
)
-- Insert specs for newly created item types
INSERT INTO item_type_fastener_specs (item_type_id, diameter, length, head_shape, drive_type, row_letter, col_num)
SELECT
  it.id,
  sd.size,
  sd.length_mm,
  sd.head_shape,
  sd.drive_type,
  sd.row_letter,
  sd.col_num
FROM inserted_types it
JOIN temp_screw_data sd
  ON it.name = 'Screw ' || sd.size || '×' || sd.length_mm::integer || ' ' || sd.head_shape || ' ' || sd.drive_type
ON CONFLICT DO NOTHING;

-- Also update/insert row/col for any existing item types
INSERT INTO item_type_fastener_specs (item_type_id, diameter, length, head_shape, drive_type, row_letter, col_num)
SELECT
  it.id,
  sd.size,
  sd.length_mm,
  sd.head_shape,
  sd.drive_type,
  sd.row_letter,
  sd.col_num
FROM item_types it
JOIN temp_screw_data sd
  ON it.name = 'Screw ' || sd.size || '×' || sd.length_mm::integer || ' ' || sd.head_shape || ' ' || sd.drive_type
ON CONFLICT (item_type_id) DO UPDATE SET
  row_letter = EXCLUDED.row_letter,
  col_num = EXCLUDED.col_num;

-- Cleanup
DROP TABLE IF EXISTS temp_screw_data;

-- Verify
SELECT
  it.name,
  it.name_cn_simplified,
  it.current_stock,
  it.min_threshold,
  fs.diameter,
  fs.length,
  fs.head_shape,
  fs.drive_type,
  fs.row_letter,
  fs.col_num
FROM item_types it
JOIN item_type_fastener_specs fs ON fs.item_type_id = it.id
WHERE it.category = 'CONSUMABLE' AND fs.diameter LIKE 'M%'
ORDER BY fs.row_letter, fs.col_num;
