-- ============================================
-- Remove Duplicate Item Types
-- Keeps the oldest (lowest ID) for each unique name
-- Updates foreign key references before delete
-- ============================================

-- Step 1: Find duplicates and identify which to keep
WITH duplicates AS (
  SELECT
    id,
    name,
    FIRST_VALUE(id) OVER (PARTITION BY name ORDER BY id) AS keeper_id
  FROM item_types
),
to_remove AS (
  SELECT id, name, keeper_id
  FROM duplicates
  WHERE id != keeper_id
)

-- Step 2: Show what will be removed
SELECT '=== Duplicate Item Types to Remove ===' AS info;
SELECT * FROM to_remove ORDER BY name, id;

-- Step 3: Update items to point to keeper IDs (run separately after review)
-- UPDATE items
-- SET item_type_id = d.keeper_id
-- FROM to_remove d
-- WHERE items.item_type_id = d.id;

-- Step 4: Delete duplicate item types
-- (item_type_fastener_specs will cascade delete)
-- DELETE FROM item_types
-- WHERE id IN (SELECT id FROM to_remove);

-- Step 5: Verify counts
SELECT '=== Current Item Type Counts ===' AS info;
SELECT category, COUNT(*) FROM item_types GROUP BY category ORDER BY category;

-- Show potential duplicates
SELECT '=== Potential Duplicates (by name) ===' AS info;
SELECT name, COUNT(*) as count, MIN(id) as keep_id, array_agg(id ORDER BY id) as all_ids
FROM item_types
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY name;
