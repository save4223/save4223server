-- Backfill item_types.image_url for tool types that were missing images.
-- All URLs are direct Wikimedia Commons file URLs (stable, CDN-cached).
-- Safe to re-run: WHERE clause guards against overwriting existing URLs.

UPDATE item_types SET image_url = CASE id
  -- Wrenches (open-end) — same generic image, all sizes
  WHEN 456 THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Cl%C3%A9_plate.jpg/500px-Cl%C3%A9_plate.jpg'
  WHEN 457 THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Cl%C3%A9_plate.jpg/500px-Cl%C3%A9_plate.jpg'
  WHEN 458 THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Cl%C3%A9_plate.jpg/500px-Cl%C3%A9_plate.jpg'
  WHEN 459 THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Cl%C3%A9_plate.jpg/500px-Cl%C3%A9_plate.jpg'
  WHEN 460 THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Cl%C3%A9_plate.jpg/500px-Cl%C3%A9_plate.jpg'
  WHEN 461 THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Cl%C3%A9_plate.jpg/500px-Cl%C3%A9_plate.jpg'
  WHEN 462 THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Cl%C3%A9_plate.jpg/500px-Cl%C3%A9_plate.jpg'
  WHEN 463 THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Cl%C3%A9_plate.jpg/500px-Cl%C3%A9_plate.jpg'
  WHEN 464 THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Cl%C3%A9_plate.jpg/500px-Cl%C3%A9_plate.jpg'
  WHEN 103 THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/AdjustableWrenchWhiteBackground.jpg/500px-AdjustableWrenchWhiteBackground.jpg'

  -- Cutting / pliers / clamps
  WHEN 14  THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/G-clamp.jpg/500px-G-clamp.jpg'
  WHEN 9   THEN 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Box-cutter.jpg'
  WHEN 10  THEN 'https://upload.wikimedia.org/wikipedia/commons/3/30/Scissors_collection.jpg'
  WHEN 11  THEN 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Abisolierzange_detail.jpg'
  WHEN 12  THEN 'https://upload.wikimedia.org/wikipedia/commons/1/10/Seitenschneider.JPG'
  WHEN 465 THEN 'https://upload.wikimedia.org/wikipedia/commons/1/10/Seitenschneider.JPG'
  WHEN 13  THEN 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Needle_nose_pliers.jpg'
  WHEN 31  THEN 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Non-magnetic_tweezers.jpg'

  -- Measuring
  WHEN 5   THEN 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Tape_measure_colored.jpeg'
  WHEN 6   THEN 'https://upload.wikimedia.org/wikipedia/commons/f/f2/DigitalCaliperEuro.jpg'
  WHEN 7   THEN 'https://upload.wikimedia.org/wikipedia/commons/f/f2/DigitalCaliperEuro.jpg'
  WHEN 8   THEN 'https://upload.wikimedia.org/wikipedia/commons/9/90/TBBSC_Jewelry_scales.jpg'

  -- Drivers / hex / hammers / files / bits
  WHEN 15  THEN 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Old_slotted_screwdrivers.jpg'
  WHEN 16  THEN 'https://upload.wikimedia.org/wikipedia/commons/c/cb/1st_choice_metric_hex_key_set_%282%29.jpg'
  WHEN 17  THEN 'https://upload.wikimedia.org/wikipedia/commons/7/7d/1980s_Wiha_T_handle_hex_key_334_6_mm_hex_100_mm_shaft_Made_in_West_Germany.jpg'
  WHEN 18  THEN 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Claw_hammer.JPG'
  WHEN 19  THEN 'https://upload.wikimedia.org/wikipedia/commons/9/96/2011-05-07_1-Lb_rubber_mallet.jpg'
  WHEN 20  THEN 'https://upload.wikimedia.org/wikipedia/commons/d/d2/Glardon_Vallorbe_LA2442-0_140_mm_Swiss_cut_0_6-piece_needle_file_set.jpg'
  WHEN 29  THEN 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Drill_set_1.jpg'
  WHEN 30  THEN 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Screwdriver_set_with_great_variety_of_bits_and_ratchet_screwdriver.jpg'
  WHEN 104 THEN 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Putty_knife_%282653226995%29.jpg'
  WHEN 105 THEN 'https://upload.wikimedia.org/wikipedia/commons/c/c0/Screws%28small%29Box.jpg'

  -- Tap & die
  WHEN 21  THEN 'https://upload.wikimedia.org/wikipedia/commons/d/df/ThreadingTaps.jpg'
  WHEN 22  THEN 'https://upload.wikimedia.org/wikipedia/commons/d/df/ThreadingTaps.jpg'

  -- Adhesives / tape / lubricant (consumables + glue tools)
  WHEN 23  THEN 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Electrical-tape_black.jpg'
  WHEN 24  THEN 'https://upload.wikimedia.org/wikipedia/commons/b/b6/Rolls_of_adhesive_tape.jpg'
  WHEN 25  THEN 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Stanley-Hot-Glue-Gun-GR35K.jpg'
  WHEN 26  THEN 'https://upload.wikimedia.org/wikipedia/commons/7/79/Super_glue.jpg'
  WHEN 27  THEN 'https://upload.wikimedia.org/wikipedia/commons/e/ef/UV_curing_glue_kit_for_Huawei-Screen.jpg'
  WHEN 28  THEN 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Thread_locking_fluid_Loctite_243_with_packaging.jpg'
  WHEN 32  THEN 'https://upload.wikimedia.org/wikipedia/commons/1/15/WD-40.jpg'

  ELSE image_url
END
WHERE id IN (
  5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
  24, 25, 26, 27, 28, 29, 30, 31, 32, 103, 104, 105, 456, 457, 458, 459, 460,
  461, 462, 463, 464, 465
)
AND (image_url IS NULL OR image_url = '');

-- Verify
SELECT id, name, image_url FROM item_types ORDER BY id;
