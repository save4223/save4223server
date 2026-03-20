-- ============================================
-- Seed Item Types from Maker Space Tool List
-- Run after: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/seed-item-types.sql
-- ============================================

-- Clear existing item types (optional - comment out if you want to keep existing)
-- DELETE FROM item_types;

-- Insert tool types with descriptions optimized for semantic search
-- Includes Chinese names for multilingual support (Simplified 简体 + Traditional 繁體)
-- Note: total_quantity is computed dynamically from items table (COUNT per item_type_id)
INSERT INTO item_types (name, name_cn_simplified, name_cn_traditional, category, description, description_cn, max_borrow_duration, created_at) VALUES

-- Wrenches & Spanners 扳手
('Wrench Set 5.5-7mm', '扳手 5.5-7mm', '扳手 5.5-7mm', 'TOOL',
 'Adjustable wrench set for nuts and bolts sized 5.5mm to 7mm. Essential for mechanical assembly, bicycle repair, and general maintenance. Compact size ideal for precision work.',
 '用于5.5mm至7mm螺母和螺栓的扳手套装。机械组装、自行车维修和一般维护的必备工具。紧凑尺寸，适合精密作业。',
 '7 days', NOW()),
('Wrench Set 8-10mm', '扳手 8-10mm', '扳手 8-10mm', 'TOOL',
 'Adjustable wrench set for nuts and bolts sized 8mm to 10mm. Good quality construction for mechanical work, automotive repair, and furniture assembly.',
 '用于8mm至10mm螺母和螺栓的扳手套装。优质结构，适合机械作业、汽车维修和家具组装。',
 '7 days', NOW()),
('Wrench Set (Complete)', '扳手套装（完整）', '扳手套裝（完整）', 'TOOL',
 'Complete wrench/spanner set with multiple sizes. Professional grade tools for mechanical work, automotive repair, plumbing, and general maintenance.',
 '多尺寸完整扳手套装。专业级工具，适用于机械作业、汽车维修、管道工程和一般维护。',
 '14 days', NOW()),

-- Measuring Tools 测量工具
('Steel Ruler 30cm', '钢尺 30cm', '鋼尺 30cm', 'TOOL',
 'Precision steel ruler for accurate measurements up to 30cm. Essential for woodworking, metalworking, drafting, and craft projects. Features both metric and imperial markings.',
 '精密钢尺，可精确测量至30厘米。木工、金工、制图和工艺项目的必备工具。具有公制和英制刻度。',
 '7 days', NOW()),
('Tape Measure', '卷尺', '捲尺', 'TOOL',
 'Retractable tape measure for measuring distances and dimensions. Useful for construction, woodworking, interior design, and DIY projects. Compact and portable.',
 '可伸缩卷尺，用于测量距离和尺寸。适用于建筑、木工、室内设计和DIY项目。小巧便携。',
 '7 days', NOW()),
('Vernier Caliper 150mm', '游标卡尺 150mm', '游標卡尺 150mm', 'DEVICE',
 'Digital vernier caliper for precision measurements up to 150mm. Measures internal and external dimensions with high accuracy. Essential for engineering, machining, and quality control.',
 '数字游标卡尺，可精确测量至150毫米。高精度测量内外尺寸。工程、机加工和质量控制的必备工具。',
 '14 days', NOW()),
('Vernier Caliper 200mm', '游标卡尺 200mm', '游標卡尺 200mm', 'DEVICE',
 'Digital vernier caliper for precision measurements up to 200mm. Professional measuring instrument for engineering, machining, and precision manufacturing.',
 '数字游标卡尺，可精确测量至200毫米。专业测量仪器，适用于工程、机加工和精密制造。',
 '14 days', NOW()),
('Digital Precision Scale', '电子秤', '電子秤', 'DEVICE',
 'Electronic digital scale for precise weight measurements. Useful for chemistry experiments, cooking, jewelry making, and small parts weighing. High accuracy display.',
 '电子数字秤，用于精确称重。适用于化学实验、烹饪、珠宝制作和小零件称重。高精度显示。',
 '7 days', NOW()),

-- Cutting Tools 切割工具
('Utility Knife (Box Cutter)', '美工刀', '美工刀', 'TOOL',
 'Retractable utility knife with replaceable blades. Essential for opening packages, cutting cardboard, trimming materials, and general cutting tasks. Includes spare blades.',
 '可伸缩美工刀，配有可更换刀片。开箱、切割纸板、修剪材料和一般切割任务的必备工具。包含备用刀片。',
 '7 days', NOW()),
('Scissors', '剪刀', '剪刀', 'TOOL',
 'General purpose scissors for cutting paper, fabric, thin plastic, and light materials. Suitable for crafts, office work, and light DIY projects.',
 '通用剪刀，用于剪纸、布料、薄塑料和轻质材料。适用于手工、办公和轻量DIY项目。',
 '7 days', NOW()),
('Wire Strippers/Cutters', '剥线钳', '剝線鉗', 'TOOL',
 'Professional wire strippers and cutters for electrical work. Strips insulation from wires and cuts copper wire cleanly. Essential for electronics repair and electrical installations.',
 '专业剥线钳和剪线钳，用于电气工作。剥离电线绝缘层并干净地切割铜线。电子维修和电气安装的必备工具。',
 '14 days', NOW()),
('Diagonal Cutters', '斜口钳', '斜口鉗', 'TOOL',
 'Flush cutters for cutting wire, component leads, and small materials. Essential for electronics assembly, jewelry making, and precision cutting work.',
 '斜口钳，用于切割导线、元件引脚和小材料。电子组装、珠宝制作和精密切割工作的必备工具。',
 '7 days', NOW()),

-- Pliers 钳子
('Needle Nose Pliers', '尖嘴钳', '尖嘴鉗', 'TOOL',
 'Long-nose pliers for gripping, bending, and positioning small objects. Essential for electronics work, jewelry making, and precision assembly. Features serrated jaws for secure grip.',
 '长嘴钳，用于夹持、弯曲和定位小物体。电子工作、珠宝制作和精密组装的必备工具。锯齿状钳口确保牢固夹持。',
 '14 days', NOW()),
('C-Clamps (Small 80mm)', 'C型夹 80mm', 'C型夾 80mm', 'TOOL',
 'Small C-clamps for holding and securing workpieces. Ideal for woodworking, gluing projects, welding setup, and temporary fixturing. 80mm jaw opening.',
 '小型C型夹，用于固定工件。非常适合木工、胶合项目、焊接设置和临时夹具。80mm开口。',
 '7 days', NOW()),

-- Screwdrivers 螺丝刀
('Flathead Screwdriver Set', '一字螺丝刀套装', '一字螺絲刀套裝', 'TOOL',
 'Complete set of flathead screwdrivers in various sizes. 9-piece set with plastic storage case. Essential for general repairs, furniture assembly, and mechanical work.',
 '完整的一字螺丝刀套装，多种尺寸。9件套，配有塑料收纳盒。一般维修、家具组装和机械工作的必备工具。',
 '14 days', NOW()),
('Hex Key Set (L-shape)', '六角扳手套装（L型）', '六角扳手套裝（L型）', 'TOOL',
 'Allen wrench/hex key set for hexagonal socket screws. Commonly used for furniture assembly (IKEA), bicycle maintenance, and mechanical repairs. Multiple sizes included.',
 '六角扳手/内六角扳手套装，用于内六角螺钉。常用于家具组装（宜家）、自行车维护和机械维修。包含多种尺寸。',
 '14 days', NOW()),
('Hex Key Set (T-shape)', '六角扳手套装（T型）', '六角扳手套裝（T型）', 'TOOL',
 'T-handle hex key set for increased torque and comfort. Professional grade for automotive work, machinery maintenance, and heavy-duty applications.',
 'T型手柄六角扳手套装，提供更大的扭矩和舒适度。专业级，适用于汽车工作、机械维护和重型应用。',
 '14 days', NOW()),

-- Hammers 锤子
('Claw Hammer', '羊角锤', '羊角錘', 'TOOL',
 'Standard claw hammer for driving nails and prying. Essential for carpentry, construction, furniture assembly, and general repairs. Features nail-pulling claw.',
 '标准羊角锤，用于敲钉和撬开。木工、建筑、家具组装和一般维修的必备工具。配有拔钉爪。',
 '7 days', NOW()),
('Rubber Mallet', '橡胶锤', '橡膠錘', 'TOOL',
 'Soft-faced rubber mallet for gentle striking without damage. Ideal for woodworking, assembling furniture, shaping metal, and working with delicate materials.',
 '软面橡胶锤，用于轻敲而不损坏。非常适合木工、家具组装、金属塑形和处理精细材料。',
 '7 days', NOW()),

-- Filing & Threading 锉刀和螺纹
('Metal File Set', '锉刀套装', '銼刀套裝', 'TOOL',
 'Assorted metal files for shaping, smoothing, and finishing metal surfaces. Various shapes and grades for different applications. Essential for metalworking and tool sharpening.',
 '各种金属锉刀，用于金属表面的整形、平滑和抛光。不同形状和等级适用于不同应用。金工和工具磨锐的必备工具。',
 '14 days', NOW()),
('Tap and Die Set (M3-M10)', '丝锥套装 (M3-M10)', '絲錐套裝 (M3-M10)', 'TOOL',
 'Thread cutting tap and die set for creating internal and external threads. Essential for mechanical repairs, custom fabrication, and creating threaded holes and bolts.',
 '螺纹切削丝锥和板牙套装，用于制作内外螺纹。机械维修、定制加工和制作螺纹孔和螺栓的必备工具。',
 '14 days', NOW()),
('Tap and Die Set (M3-M4.5)', '丝锥套装 (M3-M4.5)', '絲錐套裝 (M3-M4.5)', 'TOOL',
 'Small thread cutting set for precision threading work. Used for creating screws and threaded holes in small mechanical projects and model making.',
 '小型螺纹切削套装，用于精密螺纹加工。用于小型机械项目和模型制作中的螺钉和螺纹孔。',
 '14 days', NOW()),

-- Adhesives & Sealants 胶水和密封剂
('Electrical Tape (Black)', '电工胶带（黑色）', '電工膠帶（黑色）', 'CONSUMABLE',
 'Black electrical tape for insulating electrical wires and connections. Heat-resistant and flexible. 10 rolls of 9m each per pack. Essential for electrical repairs and wire management.',
 '黑色电工胶带，用于绝缘电线和连接。耐热且柔软。每包10卷，每卷9米。电气维修和线缆管理的必备工具。',
 '7 days', NOW()),
('Electrical Tape (Color)', '电工胶带（彩色）', '電工膠帶（彩色）', 'CONSUMABLE',
 'Colored electrical tape for wire coding and identification. 5 rolls of 18m each in assorted colors. Useful for organizing cables and color-coding electrical connections.',
 '彩色电工胶带，用于电线编码和识别。5卷装，每卷18米，多种颜色。适用于线缆整理和电气连接的颜色编码。',
 '7 days', NOW()),
('Hot Glue Gun with Glue Sticks', '热熔胶枪（含胶棒）', '熱熔膠槍（含膠棒）', 'TOOL',
 'Electric hot glue gun for fast bonding of materials. Includes glue sticks. Ideal for crafts, model making, quick repairs, and prototyping. Melts glue at high temperature.',
 '电动热熔胶枪，用于材料快速粘接。包含胶棒。非常适合手工、模型制作、快速维修和原型制作。高温熔化胶水。',
 '14 days', NOW()),
('Super Glue (Cyanoacrylate)', '502强力胶', '502強力膠', 'CONSUMABLE',
 'Fast-setting super glue for bonding plastic, metal, rubber, and other materials. Strong instant adhesive for quick repairs and small assembly work.',
 '快干强力胶，用于粘接塑料、金属、橡胶和其他材料。强力瞬间粘合剂，适用于快速维修和小型组装工作。',
 '7 days', NOW()),
('UV Glue/Resin', 'UV胶', 'UV膠', 'CONSUMABLE',
 'UV-curing adhesive resin for transparent bonds. Cures quickly under UV light. Ideal for jewelry making, electronics encapsulation, and glass bonding.',
 'UV固化胶水树脂，用于透明粘接。在UV光下快速固化。非常适合珠宝制作、电子封装和玻璃粘接。',
 '7 days', NOW()),
('Threadlocker (Screw Glue)', '螺丝胶', '螺絲膠', 'CONSUMABLE',
 'Anaerobic threadlocker adhesive to prevent screws from loosening due to vibration. Essential for machinery, automotive, and applications requiring secure fasteners.',
 '厌氧螺纹锁固胶，防止螺丝因振动而松动。机械、汽车和需要安全紧固件的应用的必备工具。',
 '7 days', NOW()),

-- Drilling 钻孔
('Power Drill Bit Set (13pc)', '钻头套装（13件）', '鑽頭套裝（13件）', 'TOOL',
 'Professional drill bit set with 13 pieces. Includes twist drills for metal, wood, and plastic. Comes in organized plastic case. For use with power drills.',
 '专业钻头套装，13件。包含用于金属、木材和塑料的麻花钻。配有整理塑料盒。适用于电钻。',
 '14 days', NOW()),
('Power Drill Driver Bit Set (7pc)', '批头套装（7件）', '批頭套裝（7件）', 'TOOL',
 'Driver bit set for power drills, sizes 2-8mm, 75mm length. 7-piece set for screwdriving applications. Compatible with cordless and corded drills.',
 '电钻批头套装，尺寸2-8mm，长度75mm。7件套，用于螺丝刀应用。兼容有绳和无绳电钻。',
 '14 days', NOW()),

-- Precision Tools 精密工具
('Tweezers (Anti-static)', '镊子（防静电）', '鑷子（防靜電）', 'TOOL',
 'Anti-static precision tweezers for handling small electronic components. Essential for SMD soldering, electronics assembly, watch repair, and delicate work.',
 '防静电精密镊子，用于处理小型电子元件。SMD焊接、电子组装、手表维修和精细工作的必备工具。',
 '7 days', NOW()),

-- Lubricants 润滑剂
('WD-40 Multi-Use (100ml)', 'WD-40 多用途防锈润滑剂 (100ml)', 'WD-40 多用途防鏽潤滑劑 (100ml)', 'CONSUMABLE',
 'WD-40 multi-purpose lubricant and rust preventive. Displaces moisture, penetrates rusted parts, and protects metal surfaces. Essential for maintenance and repair.',
 'WD-40多用途润滑剂和防锈剂。排除水分、渗透生锈部件并保护金属表面。维护和维修的必备工具。',
 '14 days', NOW())

ON CONFLICT DO NOTHING;

-- Success message (using DO block for RAISE NOTICE)
DO $$
BEGIN
  RAISE NOTICE 'Item types seeded successfully! Run embedding generation next.';
END
$$;
