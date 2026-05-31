-- Backfill item_types.image_url for tool types that were missing images.
-- Images are bundled in /public/tool-images/ and served by Vercel's edge CDN
-- (no external host = no rate limits, no broken hotlinks).
-- Safe to re-run: WHERE clause only updates rows that are NULL or empty.

UPDATE item_types SET image_url = CASE id
  -- Wrenches (open-end) — same generic image, all sizes
  WHEN 456 THEN '/tool-images/wrench-open.jpg'
  WHEN 457 THEN '/tool-images/wrench-open.jpg'
  WHEN 458 THEN '/tool-images/wrench-open.jpg'
  WHEN 459 THEN '/tool-images/wrench-open.jpg'
  WHEN 460 THEN '/tool-images/wrench-open.jpg'
  WHEN 461 THEN '/tool-images/wrench-open.jpg'
  WHEN 462 THEN '/tool-images/wrench-open.jpg'
  WHEN 463 THEN '/tool-images/wrench-open.jpg'
  WHEN 464 THEN '/tool-images/wrench-open.jpg'
  WHEN 103 THEN '/tool-images/wrench-adjustable.jpg'

  -- Cutting / pliers / clamps
  WHEN 14  THEN '/tool-images/c-clamp.jpg'
  WHEN 9   THEN '/tool-images/box-cutter.jpg'
  WHEN 10  THEN '/tool-images/scissors.jpg'
  WHEN 11  THEN '/tool-images/wire-strippers.jpg'
  WHEN 12  THEN '/tool-images/diagonal-cutters.jpg'
  WHEN 465 THEN '/tool-images/diagonal-cutters.jpg'
  WHEN 13  THEN '/tool-images/needle-nose-pliers.jpg'
  WHEN 31  THEN '/tool-images/tweezers.jpg'

  -- Measuring
  WHEN 5   THEN '/tool-images/tape-measure.jpg'
  WHEN 6   THEN '/tool-images/vernier-caliper.jpg'
  WHEN 7   THEN '/tool-images/vernier-caliper.jpg'
  WHEN 8   THEN '/tool-images/precision-scale.jpg'
  WHEN 4   THEN '/tool-images/steel-ruler.jpg'

  -- Drivers / hex / hammers / files / bits
  WHEN 15  THEN '/tool-images/flathead-screwdriver-set.jpg'
  WHEN 16  THEN '/tool-images/hex-key-l.jpg'
  WHEN 17  THEN '/tool-images/hex-key-t.jpg'
  WHEN 18  THEN '/tool-images/claw-hammer.jpg'
  WHEN 19  THEN '/tool-images/rubber-mallet.jpg'
  WHEN 20  THEN '/tool-images/file-set.jpg'
  WHEN 29  THEN '/tool-images/drill-bit-set.jpg'
  WHEN 30  THEN '/tool-images/driver-bit-set.jpg'
  WHEN 104 THEN '/tool-images/putty-knife.jpg'
  WHEN 105 THEN '/tool-images/screw-box.jpg'

  -- Tap & die
  WHEN 21  THEN '/tool-images/tap-die-set.jpg'
  WHEN 22  THEN '/tool-images/tap-die-set.jpg'

  -- Adhesives / tape / lubricant
  WHEN 23  THEN '/tool-images/electrical-tape-black.jpg'
  WHEN 24  THEN '/tool-images/electrical-tape-color.jpg'
  WHEN 25  THEN '/tool-images/hot-glue-gun.jpg'
  WHEN 26  THEN '/tool-images/super-glue.jpg'
  WHEN 27  THEN '/tool-images/uv-glue.jpg'
  WHEN 28  THEN '/tool-images/threadlocker.jpg'
  WHEN 32  THEN '/tool-images/wd40.jpg'

  ELSE image_url
END
WHERE id IN (
  4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
  24, 25, 26, 27, 28, 29, 30, 31, 32, 103, 104, 105, 456, 457, 458, 459, 460,
  461, 462, 463, 464, 465
)
AND (image_url IS NULL OR image_url = '' OR image_url LIKE 'https://upload.wikimedia.org/%' OR image_url LIKE 'https://www.statpack.com.au/%');

-- Verify
SELECT id, name, image_url FROM item_types ORDER BY id;
