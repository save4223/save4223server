// Run database migrations using drizzle-orm
// This properly checks __drizzle_migrations table to skip already executed migrations
// Run: npx tsx scripts/run-migrations.ts

import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

async function runMigrations() {
  const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '54322'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'postgres',
    ssl: false,
  })

  const db = drizzle(pool)

  console.log('🔄 Running migrations...')

  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' })
    console.log('✅ Migrations completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }

  process.exit(0)
}

runMigrations()
