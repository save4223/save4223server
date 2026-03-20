// Seed individual items for each tool type in the database
// Run: npx tsx scripts/seed-items.ts [quantity_per_type]
// Example: npx tsx scripts/seed-items.ts 3  (creates 3 items per tool type)

import { db } from '../src/db'
import { itemTypes, items, locations } from '../src/db/schema'
import { eq, sql } from 'drizzle-orm'

async function seedItems() {
  // Parse command line args: default 1 item per type
  const quantityPerType = parseInt(process.argv[2]) || 1

  if (quantityPerType < 1 || quantityPerType > 100) {
    console.log('❌ Quantity must be between 1 and 100')
    process.exit(1)
  }

  console.log(`🌱 Seeding items (${quantityPerType} per tool type)...\n`)

  try {
    // Get all tool types and available locations
    const types = await db.select().from(itemTypes)
    const locs = await db.select().from(locations)

    if (types.length === 0) {
      console.log('⚠️ No tool types found. Run seed-item-types.sql first.')
      process.exit(1)
    }

    if (locs.length === 0) {
      console.log('⚠️ No locations found. Run seed.sql first.')
      process.exit(1)
    }

    // Use first cabinet as default home location
    const defaultLocation = locs.find(l => l.type === 'CABINET') || locs[0]
    console.log(`📍 Using "${defaultLocation.name}" (ID: ${defaultLocation.id}) as default location\n`)

    let totalCreated = 0
    const createdItems: string[] = []

    for (const toolType of types) {
      const itemTypeId = toolType.id
      const toolName = toolType.name

      // Create RFID prefix from tool name (first 3 letters uppercase)
      const rfidPrefix = toolName
        .replace(/[^a-zA-Z]/g, '')
        .slice(0, 3)
        .toUpperCase()
        .padEnd(3, 'X')

      // Check how many items already exist for this type
      const existingItems = await db
        .select({ count: sql<number>`count(*)` })
        .from(items)
        .where(eq(items.itemTypeId, itemTypeId))

      const existingCount = Number(existingItems[0]?.count || 0)

      // Calculate how many new items to create
      const startIndex = existingCount + 1
      const endIndex = existingCount + quantityPerType

      const itemsToInsert = []

      for (let i = startIndex; i <= endIndex; i++) {
        // Generate unique RFID tag: RFID-{PREFIX}-{TYPE_ID}-{SEQUENCE}
        const rfidTag = `RFID-${rfidPrefix}-${itemTypeId}-${String(i).padStart(3, '0')}`

        itemsToInsert.push({
          itemTypeId: itemTypeId,
          rfidTag: rfidTag,
          status: 'AVAILABLE' as const,
          homeLocationId: defaultLocation.id,
        })
      }

      // Insert items for this tool type
      if (itemsToInsert.length > 0) {
        try {
          await db.insert(items).values(itemsToInsert).onConflictDoNothing()
          totalCreated += itemsToInsert.length
          createdItems.push(`${toolName}: ${itemsToInsert.length} items`)
          console.log(`✅ ${toolName}: ${itemsToInsert.length} items (RFID prefix: ${rfidPrefix}, total: ${endIndex})`)
        } catch (err) {
          console.log(`⚠️ ${toolName}: Some items may already exist (skipping duplicates)`)
        }
      } else {
        console.log(`⏭️ ${toolName}: Skipped (already has ${existingCount} items)`)
      }
    }

    console.log(`\n📊 Summary: ${totalCreated} items created`)

    // Show total count per type
    console.log('\n📦 Items count per tool type:')
    for (const toolType of types) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(items)
        .where(eq(items.itemTypeId, toolType.id))
      const count = Number(countResult[0]?.count || 0)
      console.log(`  - ${toolType.name}: ${count} items`)
    }

    console.log('\nSample RFID tags:')

    // Show a few examples
    const sampleItems = await db
      .select({
        rfidTag: items.rfidTag,
        toolName: itemTypes.name,
      })
      .from(items)
      .innerJoin(itemTypes, eq(items.itemTypeId, itemTypes.id))
      .limit(10)

    sampleItems.forEach(item => {
      console.log(`  - ${item.rfidTag} (${item.toolName})`)
    })

    if (sampleItems.length === 10) {
      console.log('  ... and more')
    }

    console.log('\n✅ Item seeding completed!')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }

  process.exit(0)
}

seedItems()
