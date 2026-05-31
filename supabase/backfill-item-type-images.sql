-- Backfill item_types.image_url for tool types that were missing images.
-- All URLs are direct external image URLs (CDN-cached).
-- Safe to re-run: WHERE clause guards against overwriting existing URLs.

UPDATE item_types SET image_url = CASE id
  -- Wrenches (open-end) — same generic image, all sizes
  WHEN 456 THEN 'https://boxousa.com/cdn/shop/files/BoxoUSA-10-11mm-Metric-12-Point-Flexible-Socket-Wrench-WR1722-1011.webp?v=1728742246'
  WHEN 457 THEN 'https://boxousa.com/cdn/shop/files/BoxoUSA-10-11mm-Metric-12-Point-Flexible-Socket-Wrench-WR1722-1011.webp?v=1728742246'
  WHEN 458 THEN 'https://boxousa.com/cdn/shop/files/BoxoUSA-10-11mm-Metric-12-Point-Flexible-Socket-Wrench-WR1722-1011.webp?v=1728742246'
  WHEN 459 THEN 'https://boxousa.com/cdn/shop/files/BoxoUSA-10-11mm-Metric-12-Point-Flexible-Socket-Wrench-WR1722-1011.webp?v=1728742246'
  WHEN 460 THEN 'https://boxousa.com/cdn/shop/files/BoxoUSA-10-11mm-Metric-12-Point-Flexible-Socket-Wrench-WR1722-1011.webp?v=1728742246'
  WHEN 461 THEN 'https://boxousa.com/cdn/shop/files/BoxoUSA-10-11mm-Metric-12-Point-Flexible-Socket-Wrench-WR1722-1011.webp?v=1728742246'
  WHEN 462 THEN 'https://boxousa.com/cdn/shop/files/BoxoUSA-10-11mm-Metric-12-Point-Flexible-Socket-Wrench-WR1722-1011.webp?v=1728742246'
  WHEN 463 THEN 'https://boxousa.com/cdn/shop/files/BoxoUSA-10-11mm-Metric-12-Point-Flexible-Socket-Wrench-WR1722-1011.webp?v=1728742246'
  WHEN 464 THEN 'https://boxousa.com/cdn/shop/files/BoxoUSA-10-11mm-Metric-12-Point-Flexible-Socket-Wrench-WR1722-1011.webp?v=1728742246'
  WHEN 103 THEN 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKXhu35LIeJU8D-N9lQvG8ATuvUQsxQfAc4Q&s'

  -- Cutting / pliers / clamps
  WHEN 14  THEN 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4X4FCzXhT23-JoZQjV-VTqL4GFzfDmUyVuA&s'
  WHEN 9   THEN 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTI89nmrIXSQUwo2yo2P9uUtO2bvZl73mGPfA&s'
  WHEN 10  THEN 'https://starreda.com/wp-content/uploads/2021/01/HW0106-1.jpg'
  WHEN 11  THEN 'https://lh5.googleusercontent.com/proxy/bn1_ELuk50wyRajzhg0KQRhU6g9IQpyoXMyusazYcB-WK3_67b8nkR4YQgVkp53kTiYTPZtKj0FL78ebF-Q_QC0LZAPyFnAFpim8Vn2ho0grqPGzu-yFnOYKP4ra8w4ECQGU8073ZL2GWZZNXNxsWnQ'
  WHEN 12  THEN 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSv0JL4MRD4yyYv_aFlCYXviPxqIXEZ7mHEnA&s'
  WHEN 465 THEN 'https://img.alicdn.com/imgextra/i4/2767384992/O1CN01FojRXl1mkNzi6yDap_!!2767384992.jpg_q50.jpg_.webp'
  WHEN 13  THEN 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2vF5ItVOEr02vaLl74fiK0ClLSn2noChMJA&s'
  WHEN 31  THEN 'https://cdn.sciket.com/products/201610020156000.jpg'

  -- Measuring
  WHEN 5   THEN 'https://hoffmannshopxpprd.oss-cn-shanghai.aliyuncs.com/data/gallery_album/8/images/8_P_1629872329590.jpg'
  WHEN 6   THEN 'https://www.makersoulhk.com/media/catalog/product/cache/a3945ec6ccd9af5c739c6c1112b4742b/p/r/proskit-pd-151.jpg'
  WHEN 7   THEN 'https://www.makersoulhk.com/media/catalog/product/cache/a3945ec6ccd9af5c739c6c1112b4742b/p/r/proskit-pd-151.jpg'
  WHEN 8   THEN 'https://img.yec.tw/zp/MerchandiseImages/06108A89BF-SP-11222501.jpg'
  WHEN 4   THEN 'https://img.alicdn.com/imgextra/i4/2408239898/O1CN01YyhW2o2MzKu1JOO6Z_!!2-item_pic.png_q50.jpg_.webp'

  -- Drivers / hex / hammers / files / bits
  WHEN 15  THEN 'https://img12.360buyimg.com/n1/jfs/t1/148774/37/44366/96204/66235f6bF667b15b7/d1382636ff0d0bbb.jpg'
  WHEN 16  THEN 'https://www.makersoulhk.com/media/catalog/product/cache/a3945ec6ccd9af5c739c6c1112b4742b/h/w/hw-229b_proskit.jpg'
  WHEN 17  THEN 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXa7cqmw5iI4UYPp0ceU-Uv97AcgZ0xnoYtQ&s'
  WHEN 18  THEN 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxJ3YLm2WfWZVGeLmcNGqRu-1eFCbo2POO7Q&s'
  WHEN 19  THEN 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSO4-d9837jUno-RLTC-HME8wJNAvrSc05uUQ&s'
  WHEN 20  THEN 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTon972PKwoS9_iQSvdy8jMDuHzc8Q8-U-REg&s'
  WHEN 29  THEN 'https://media.karousell.com/media/photos/products/2023/2/22/_13_m35_1565mm____1677029665_416cad39_progressive'
  WHEN 30  THEN 'https://hoffmannshopxpprd.oss-cn-shanghai.aliyuncs.com/images/202106/thumb_img/10258_thumb_P_1623563520746.jpg'
  WHEN 104 THEN 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRVIwKQjBn40z4mMCbVVtfLl96tsM76djdEw&s'

  -- Tap & die
  WHEN 21  THEN 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSziR8j-1yXDTIe-9saHlRxb_UI7higjxr7Lg&s'
  WHEN 22  THEN 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSziR8j-1yXDTIe-9saHlRxb_UI7higjxr7Lg&s'

  -- Adhesives / tape / lubricant
  WHEN 23  THEN 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBJong3HJLPPXxJ06rYhhVBTz_db-OUBGFvw&s'
  WHEN 24  THEN 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqF2Lfq41rUZTRpynjZdTXOWiKIfijGeMlHA&s'
  WHEN 25  THEN 'https://ref.prokits.com.tw/ProductPic/GK-360G/1/201801171813216181.jpg'
  WHEN 26  THEN 'https://img.alicdn.com/imgextra/i3/725677994/O1CN01PCxRqD28vJEadyp6d_!!4611686018427385770-2-item_pic.png_q50.jpg_.webp'
  WHEN 27  THEN 'https://img.alicdn.com/imgextra/https://g-search1.alicdn.com/img/bao/uploaded/i4/i1/2392086627/O1CN013DilTW1ypDWi7Wyug_!!2392086627.jpg'
  WHEN 28  THEN 'https://mall.builderhood.com/pub/media/catalog/product/cache/5418d69e2445a51fbfb9d74e0115c279/l/o/loctite_glue_242.jpg'
  WHEN 32  THEN 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWOIsggQTOJZPeM8apmV08eIs9XQ8rskz3Xw&s'

  ELSE image_url
END
WHERE id IN (
  4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
  24, 25, 26, 27, 28, 29, 30, 31, 32, 103, 104, 456, 457, 458, 459, 460,
  461, 462, 463, 464, 465
)
AND (image_url IS NULL OR image_url = '' OR image_url LIKE '/tool-images/%' OR image_url LIKE 'https://upload.wikimedia.org/%' OR image_url LIKE 'https://www.statpack.com.au/%');

-- Verify
SELECT id, name, image_url FROM item_types ORDER BY id;
