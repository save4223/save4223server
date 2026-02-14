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
