# Save4223 Server

Next.js + Supabase + Drizzle ORM fullstack application.

## 🚀 Features

- ⚡ **Next.js 15** - React framework with App Router
- 🔐 **Supabase Auth** - Authentication with email/password
- 🗄️ **PostgreSQL** - Powerful relational database
- 📊 **Drizzle ORM** - Type-safe SQL-like ORM
- 📡 **Realtime** - Live data synchronization
- 🔧 **Edge Functions** - Serverless functions
- 🎨 **Prettier** - Code formatting

## 📋 Prerequisites

- Node.js 20+
- npm
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Supabase (Local)

```bash
# Using npx (recommended)
npx supabase start

# Or if you have Supabase CLI installed globally
supabase start
```

This will start all Supabase services:
- 🗄️ **PostgreSQL**: localhost:54322
- 🔌 **REST API**: http://localhost:54321/rest/v1
- 🔐 **Auth**: http://localhost:54321/auth/v1
- 🔧 **Studio**: http://localhost:54323
- 📧 **Mailpit** (email testing): http://localhost:54324

### 3. Environment Variables

The `.env.local` file is already configured for local development. It was auto-generated when starting Supabase.

Key variables:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

### 4. Run Next.js Development

```bash
npm run dev
```

Visit: http://localhost:3000

## 📁 Project Structure

```
save4223server/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── login/             # Login page
│   │   ├── auth/callback/     # Auth callback handler
│   │   └── page.tsx           # Home page
│   ├── db/                     # Drizzle ORM
│   │   ├── schema.ts          # Database schema
│   │   ├── index.ts           # Database client
│   │   └── migrations/        # Migration files
│   ├── utils/
│   │   └── supabase/          # Supabase clients
│   │       ├── client.ts      # Browser client
│   │       └── server.ts      # Server client
│   └── middleware.ts          # Auth middleware
├── supabase/                   # Supabase config
│   ├── config.toml            # CLI configuration
│   └── functions/             # Edge functions
├── drizzle.config.ts          # Drizzle configuration
├── .env.local                 # Local environment (auto-generated)
└── README.md                  # This file
```

## 🔐 Authentication

The app includes a complete auth system:

- **Sign Up**: Email verification required
- **Sign In**: Email + password
- **Sign Out**: Secure session cleanup
- **Middleware**: Auto session refresh

### Auth Flow

1. User visits `/login`
2. Sign up with email/password
3. Check email for confirmation link (in Mailpit at http://localhost:54324)
4. Click link → redirected to home
5. Session managed automatically

## 🗄️ Database with Drizzle ORM

### Schema Definition

Define your tables in `src/db/schema.ts`:

```typescript
import { pgTable, serial, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

### Database Queries

```typescript
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Insert
const newUser = await db.insert(users).values({ email: 'user@example.com' }).returning()

// Select
const allUsers = await db.select().from(users)

// Select with filter
const user = await db.select().from(users).where(eq(users.email, 'user@example.com'))
```

### Migrations

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate

# Open Drizzle Studio
npm run db:studio
```

## 🔧 Available Scripts

### Development

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Code Formatting

```bash
npm run format           # Format all files with Prettier
npm run format:check     # Check formatting without writing
```

### Database (Drizzle)

```bash
npm run db:generate      # Generate migration files
npm run db:migrate       # Apply migrations to database
npm run db:push          # Push schema changes (dev only)
npm run db:studio        # Open Drizzle Studio GUI
npm run db:seed          # Seed database with mock data and RLS policies
```

Or manually with psql:
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/seed.sql
```

### Supabase CLI

```bash
# Start Supabase services
npx supabase start

# Stop Supabase services
npx supabase stop

# View Supabase status
npx supabase status

# View logs
npx supabase logs

# Reset database (⚠️ destructive)
npx supabase db reset
```

## 🌐 Supabase Services (Local)

| Service | URL | Port |
|---------|-----|------|
| Next.js App | http://localhost:3000 | 3000 |
| Supabase Studio | http://localhost:54323 | 54323 |
| Supabase REST API | http://localhost:54321/rest/v1 | 54321 |
| PostgreSQL | postgresql://postgres:postgres@localhost:54322/postgres | 54322 |
| Mailpit (Emails) | http://localhost:54324 | 54324 |

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Local Development](https://supabase.com/docs/guides/local-development/overview)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)

## 📝 License

MIT

## 🔄 Recent Changes

### 2026-03-17 - Security & HTTPS Setup

- **Added authentication to public API routes**: `/api/tools`, `/api/items`, `/api/tool-types`, `/api/locations`
- **Added admin role check**: `/api/admin/embeddings` now requires ADMIN role
- **Added auth check**: `/api/user/recommendations` now requires authentication
- **Created auth-helpers.ts**: Reusable authentication utility

### 2026-02-21 - Image Upload & Storage Fixes

- **Fixed storage bucket creation**: Added `createServiceRoleClient()` in `src/utils/minio/client.ts` to bypass RLS when creating buckets
- **Added RLS policies for storage**: Authenticated users can now upload/view images to the `tool-images` bucket
- **Updated file size limit**: Changed from 5MB to 20MB for image uploads
- **Fixed error handling**: `ensureBucket()` now properly throws errors instead of silently failing
- **Seed database**: Added `supabase/seed.sql` with bucket setup and storage policies

---

## 🌐 Production Setup (Supabase Cloud)

### 1. Create Supabase Cloud Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and keys from **Settings → API**

### 2. Configure Environment

Update `.env.local` with Supabase Cloud credentials:

```env
# Supabase Cloud
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (from Settings → Database → Connection string)
DATABASE_URL="postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres"
DATABASE_SSL=true

# Edge API secret (for Raspberry Pi)
EDGE_API_SECRET=your-secure-secret

# LLM (local Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_CHAT_MODEL=llama3.2
```

### 3. Enable pgvector Extension

In Supabase Dashboard → SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4. Push Schema & Seed

```bash
npm run db:push
npm run db:seed

# Seed item types
psql "sslmode=require $DATABASE_URL" -f supabase/seed-item-types.sql
```

---

## 🔐 HTTPS Setup (Tailscale)

For secure communication between Raspberry Pi and server:

### 1. Generate Tailscale Certificate

```bash
sudo tailscale cert your-machine.tailXXXXXX.ts.net
sudo chown $USER:$USER your-machine.tailXXXXXX.ts.net.*
mv your-machine.tailXXXXXX.ts.net.* ~/.config/tailscale/
```

### 2. Start HTTPS Server

```bash
npm run build
node https-server.js
```

The server will run on `https://your-machine.tailXXXXXX.ts.net:3001`

### 3. Configure Raspberry Pi

Update `config.json`:

```json
{
    "server_url": "https://your-machine.tailXXXXXX.ts.net:3001",
    "edge_secret": "your-EDGE_API_SECRET",
    "ssl": { "verify": true }
}
```

---

## 🤖 AI Embeddings

### Prerequisites

1. Install Ollama: `curl -fsSL https://ollama.com/install.sh | sh`
2. Pull embedding model: `ollama pull nomic-embed-text`
3. Pull chat model: `ollama pull llama3.2`

### Generate Embeddings

```bash
# Check embedding stats
curl "https://your-server:3001/api/admin/embeddings" \
  -H "Cookie: your-session-cookie"
mid
# Generate embeddings for items without them
curl -X POST "https://your-server:3001/api/admin/embeddings" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"action": "generate-missing"}'

# Regenerate ALL embeddings (use with caution)
curl -X POST "https://your-server:3001/api/admin/embeddings" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"action": "regenerate-all"}'
```

### Via Admin UI

1. Log in as admin
2. Navigate to `/admin/tools`
3. Click "Generate Embeddings" button

---

## 🛡️ Security

### Authentication

All API routes require authentication unless explicitly public:

| Route | Protection |
|-------|------------|
| `/api/health` | Public |
| `/api/edge/*` | Bearer token (EDGE_API_SECRET) |
| `/api/admin/*` | ADMIN role required |
| `/api/user/*` | Authentication required |
| `/api/tools`, `/api/items`, etc. | Authentication required |

### Best Practices

1. **Never commit `.env.local`** - Contains secrets
2. **Rotate keys if exposed** - Generate new keys in Supabase Dashboard
3. **Use strong EDGE_API_SECRET** - For Pi-to-server communication
4. **Enable RLS policies** - Run seed files to set up policies
