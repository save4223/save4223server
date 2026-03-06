-- ============================================
-- Seed Item Types from Maker Space Tool List
-- Run after: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/seed-item-types.sql
-- ============================================

-- Clear existing item types (optional - comment out if you want to keep existing)
-- DELETE FROM item_types;

-- Insert tool types with descriptions optimized for semantic search
INSERT INTO item_types (name, category, description, max_borrow_duration, total_quantity, created_at) VALUES

-- Wrenches & Spanners
('Wrench Set 5.5-7mm', 'TOOL', 'Adjustable wrench set for nuts and bolts sized 5.5mm to 7mm. Essential for mechanical assembly, bicycle repair, and general maintenance. Compact size ideal for precision work.', '7 days', 5, NOW()),
('Wrench Set 8-10mm', 'TOOL', 'Adjustable wrench set for nuts and bolts sized 8mm to 10mm. Good quality construction for mechanical work, automotive repair, and furniture assembly.', '7 days', 5, NOW()),
('Wrench Set (Complete)', 'TOOL', 'Complete wrench/spanner set with multiple sizes. Professional grade tools for mechanical work, automotive repair, plumbing, and general maintenance.', '14 days', 2, NOW()),

-- Measuring Tools
('Steel Ruler 30cm', 'TOOL', 'Precision steel ruler for accurate measurements up to 30cm. Essential for woodworking, metalworking, drafting, and craft projects. Features both metric and imperial markings.', '7 days', 10, NOW()),
('Tape Measure', 'TOOL', 'Retractable tape measure for measuring distances and dimensions. Useful for construction, woodworking, interior design, and DIY projects. Compact and portable.', '7 days', 5, NOW()),
('Vernier Caliper 150mm', 'DEVICE', 'Digital vernier caliper for precision measurements up to 150mm. Measures internal and external dimensions with high accuracy. Essential for engineering, machining, and quality control.', '14 days', 5, NOW()),
('Vernier Caliper 200mm', 'DEVICE', 'Digital vernier caliper for precision measurements up to 200mm. Professional measuring instrument for engineering, machining, and precision manufacturing.', '14 days', 2, NOW()),
('Digital Precision Scale', 'DEVICE', 'Electronic digital scale for precise weight measurements. Useful for chemistry experiments, cooking, jewelry making, and small parts weighing. High accuracy display.', '7 days', 4, NOW()),

-- Cutting Tools
('Utility Knife (Box Cutter)', 'TOOL', 'Retractable utility knife with replaceable blades. Essential for opening packages, cutting cardboard, trimming materials, and general cutting tasks. Includes 5 spare blades.', '7 days', 2, NOW()),
('Scissors', 'TOOL', 'General purpose scissors for cutting paper, fabric, thin plastic, and light materials. Suitable for crafts, office work, and light DIY projects.', '7 days', 6, NOW()),
('Wire Strippers/Cutters', 'TOOL', 'Professional wire strippers and cutters for electrical work. Strips insulation from wires and cuts copper wire cleanly. Essential for electronics repair and electrical installations.', '14 days', 2, NOW()),
('Diagonal Cutters', 'TOOL', 'Flush cutters for cutting wire, component leads, and small materials. Essential for electronics assembly, jewelry making, and precision cutting work.', '7 days', 40, NOW()),

-- Pliers
('Needle Nose Pliers', 'TOOL', 'Long-nose pliers for gripping, bending, and positioning small objects. Essential for electronics work, jewelry making, and precision assembly. Features serrated jaws for secure grip.', '14 days', 5, NOW()),
('C-Clamps (Small 80mm)', 'TOOL', 'Small C-clamps for holding and securing workpieces. Ideal for woodworking, gluing projects, welding setup, and temporary fixturing. 80mm jaw opening.', '7 days', 4, NOW()),

-- Screwdrivers
('Flathead Screwdriver Set', 'TOOL', 'Complete set of flathead screwdrivers in various sizes. 9-piece set with plastic storage case. Essential for general repairs, furniture assembly, and mechanical work.', '14 days', 2, NOW()),
('Hex Key Set (L-shape)', 'TOOL', 'Allen wrench/hex key set for hexagonal socket screws. Commonly used for furniture assembly (IKEA), bicycle maintenance, and mechanical repairs. Multiple sizes included.', '14 days', 6, NOW()),
('Hex Key Set (T-shape)', 'TOOL', 'T-handle hex key set for increased torque and comfort. Professional grade for automotive work, machinery maintenance, and heavy-duty applications.', '14 days', 3, NOW()),

-- Hammers
('Claw Hammer', 'TOOL', 'Standard claw hammer for driving nails and prying. Essential for carpentry, construction, furniture assembly, and general repairs. Features nail-pulling claw.', '7 days', 5, NOW()),
('Rubber Mallet', 'TOOL', 'Soft-faced rubber mallet for gentle striking without damage. Ideal for woodworking, assembling furniture, shaping metal, and working with delicate materials.', '7 days', 5, NOW()),

-- Filing & Threading
('Metal File Set', 'TOOL', 'Assorted metal files for shaping, smoothing, and finishing metal surfaces. Various shapes and grades for different applications. Essential for metalworking and tool sharpening.', '14 days', 2, NOW()),
('Tap and Die Set (M3-M10)', 'TOOL', 'Thread cutting tap and die set for creating internal and external threads. Essential for mechanical repairs, custom fabrication, and creating threaded holes and bolts.', '14 days', 2, NOW()),
('Tap and Die Set (M3-M4.5)', 'TOOL', 'Small thread cutting set for precision threading work. Used for creating screws and threaded holes in small mechanical projects and model making.', '14 days', 4, NOW()),

-- Adhesives & Sealants
('Electrical Tape (Black)', 'CONSUMABLE', 'Black electrical tape for insulating electrical wires and connections. Heat-resistant and flexible. 10 rolls of 9m each per pack. Essential for electrical repairs and wire management.', '7 days', 1, NOW()),
('Electrical Tape (Color)', 'CONSUMABLE', 'Colored electrical tape for wire coding and identification. 5 rolls of 18m each in assorted colors. Useful for organizing cables and color-coding electrical connections.', '7 days', 1, NOW()),
('Hot Glue Gun with Glue Sticks', 'TOOL', 'Electric hot glue gun for fast bonding of materials. Includes glue sticks. Ideal for crafts, model making, quick repairs, and prototyping. Melts glue at high temperature.', '14 days', 2, NOW()),
('Super Glue (Cyanoacrylate)', 'CONSUMABLE', 'Fast-setting super glue for bonding plastic, metal, rubber, and other materials. Strong instant adhesive for quick repairs and small assembly work.', '7 days', 5, NOW()),
('UV Glue/Resin', 'CONSUMABLE', 'UV-curing adhesive resin for transparent bonds. Cures quickly under UV light. Ideal for jewelry making, electronics encapsulation, and glass bonding.', '7 days', 5, NOW()),
('Threadlocker (Screw Glue)', 'CONSUMABLE', 'Anaerobic threadlocker adhesive to prevent screws from loosening due to vibration. Essential for machinery, automotive, and applications requiring secure fasteners.', '7 days', 5, NOW()),

-- Drilling
('Power Drill Bit Set (13pc)', 'TOOL', 'Professional drill bit set with 13 pieces. Includes twist drills for metal, wood, and plastic. Comes in organized plastic case. For use with power drills.', '14 days', 4, NOW()),
('Power Drill Driver Bit Set (7pc)', 'TOOL', 'Driver bit set for power drills, sizes 2-8mm, 75mm length. 7-piece set for screwdriving applications. Compatible with cordless and corded drills.', '14 days', 4, NOW()),

-- Precision Tools
('Tweezers (Anti-static)', 'TOOL', 'Anti-static precision tweezers for handling small electronic components. Essential for SMD soldering, electronics assembly, watch repair, and delicate work.', '7 days', 10, NOW()),

-- Lubricants
('WD-40 Multi-Use (100ml)', 'CONSUMABLE', 'WD-40 multi-purpose lubricant and rust preventive. Displaces moisture, penetrates rusted parts, and protects metal surfaces. Essential for maintenance and repair.', '14 days', 2, NOW())

ON CONFLICT DO NOTHING;

-- Update total_quantity to reflect actual inventory
-- This can be adjusted based on actual stock levels

RAISE NOTICE 'Item types seeded successfully! Run embedding generation next.';
