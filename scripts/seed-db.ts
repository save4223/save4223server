// Insert test data into Supabase database
// Run: npx tsx scripts/seed-db.ts

import { db } from '../src/db'
import { 
  profiles, locations, accessPermissions, userCards,
  itemTypes, items 
} from '../src/db/schema'
import { v4 as uuidv4 } from 'uuid'

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000'

async function seed() {
  console.log('🌱 Seeding database...')

  try {
    // 1. Insert profile
    console.log('Creating test user profile...')
    await db.insert(profiles).values({
      id: TEST_USER_ID,
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'USER',
    }).onConflictDoNothing()

    // 2. Insert locations
    console.log('Creating locations...')
    await db.insert(locations).values([
      { name: 'Cabinet A - Open Access', type: 'CABINET', isRestricted: false },
      { name: 'Cabinet B - Restricted', type: 'CABINET', isRestricted: true },
      { name: 'Drawer 1', type: 'DRAWER', isRestricted: false },
    ]).onConflictDoNothing()

    // 3. Insert user card
    console.log('Creating user card...')
    await db.insert(userCards).values({
      userId: TEST_USER_ID,
      cardUid: 'TEST123',
      isActive: true,
    }).onConflictDoNothing()

    // 4. Insert access permission for restricted cabinet (location_id = 2)
    console.log('Creating access permission...')
    await db.insert(accessPermissions).values({
      userId: TEST_USER_ID,
      locationId: 2,
      status: 'APPROVED',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      requestReason: 'Test access',
    }).onConflictDoNothing()

    // 5. Insert item types
    console.log('Creating item types...')
    const typeIds = await db.insert(itemTypes).values([
      { name: 'Oscilloscope', category: 'DEVICE', description: 'Digital oscilloscope', maxBorrowDuration: '14 days' },
      { name: 'Screwdriver Set', category: 'TOOL', description: 'Precision screwdrivers', maxBorrowDuration: '7 days' },
    ]).returning({ id: itemTypes.id })

    // 6. Insert items with RFID tags
    console.log('Creating items...')
    await db.insert(items).values([
      { itemTypeId: typeIds[0]?.id || 1, rfidTag: 'RFID-OSC-001', status: 'AVAILABLE', homeLocationId: 1 },
      { itemTypeId: typeIds[0]?.id || 1, rfidTag: 'RFID-OSC-002', status: 'AVAILABLE', homeLocationId: 1 },
      { itemTypeId: typeIds[1]?.id || 2, rfidTag: 'RFID-TOOL-001', status: 'AVAILABLE', homeLocationId: 1 },
    ]).onConflictDoNothing()

    console.log('✅ Seed completed successfully!')
    console.log('\nTest Data Summary:')
    console.log('- User: test@example.com (ID: ' + TEST_USER_ID + ')')
    console.log('- Card: TEST123')
    console.log('- Open Cabinet: Cabinet A (ID: 1)')
    console.log('- Restricted Cabinet: Cabinet B (ID: 2) - Access Approved')
    console.log('- Items: RFID-OSC-001, RFID-OSC-002, RFID-TOOL-001')

  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }

  process.exit(0)
}

seed()
