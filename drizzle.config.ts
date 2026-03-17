import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local for database credentials
config({ path: resolve(process.cwd(), '.env.local') })

// Use DATABASE_URL if available (remote), otherwise fall back to local
const databaseUrl = process.env.DATABASE_URL

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  ...(databaseUrl
    ? {
        dbCredentials: {
          url: databaseUrl,
        },
      }
    : {
        dbCredentials: {
          host: '127.0.0.1',
          port: 54322,
          user: 'postgres',
          password: 'postgres',
          database: 'postgres',
          ssl: false,
        },
      }),
})
