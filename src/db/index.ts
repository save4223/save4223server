import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Database configuration: supports both local Supabase and Supabase Cloud
// For Supabase Cloud, use the connection string from the Supabase dashboard
// Format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

const getPoolConfig = () => {
  // If DATABASE_URL is provided (Supabase Cloud or external PostgreSQL), use it
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }
  }

  // Otherwise use local Supabase configuration
  return {
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    port: Number(process.env.POSTGRES_PORT) || 54322,
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'postgres',
    ssl: false,
  }
}

const pool = new Pool(getPoolConfig())

export const db = drizzle(pool, { schema })
