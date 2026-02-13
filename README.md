# Save4223 Server

Next.js + Supabase + Drizzle ORM fullstack application with local Supabase deployment.

## 🚀 Features

- ⚡ **Next.js 15** - React framework with App Router
- 🔐 **Supabase Auth** - Authentication with email/password
- 🗄️ **PostgreSQL** - Powerful relational database
- 📊 **Drizzle ORM** - Type-safe SQL-like ORM
- 📡 **Realtime** - Live data synchronization
- 🔧 **Edge Functions** - Serverless functions
- 🐳 **Docker** - Full containerization
- 🎨 **Prettier** - Code formatting

## 📋 Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm

## 🛠️ Setup

### 1. Clone and Install

```bash
git clone https://github.com/save4223/save4223server.git
cd save4223server
npm install
```

### 2. Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values
# Generate keys at: https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys
```

### 3. Start Supabase Locally

```bash
# Pull and start all services
npm run docker:up

# Check status
docker-compose ps
```

Services will be available at:

- 🌐 **App**: http://localhost:3000
- 🔧 **Supabase Studio**: http://localhost:54323
- 🔌 **Supabase API**: http://localhost:8000
- 🗄️ **PostgreSQL**: localhost:5432

### 4. Run Database Migrations

```bash
# Generate migration files
npm run db:generate

# Apply migrations to database
npm run db:migrate
```

### 5. Run Next.js Development

```bash
npm run dev
```

## 📁 Project Structure

```
save4223server/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── login/             # Login page
│   │   ├── auth/callback/     # Auth callback handler
│   │   └── page.tsx           # Home page
│   ├── db/                    # Drizzle ORM
│   │   ├── schema.ts          # Database schema
│   │   ├── index.ts           # Database client
│   │   └── migrations/        # Migration files
│   ├── utils/
│   │   └── supabase/          # Supabase clients
│   │       ├── client.ts      # Browser client
│   │       └── server.ts      # Server client
│   └── middleware.ts          # Auth middleware
├── supabase/                  # Supabase config
├── drizzle.config.ts          # Drizzle configuration
├── Dockerfile                 # Next.js container
├── docker-compose.yml         # Full stack services
└── .env.example               # Environment template
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
3. Check email for confirmation link
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
import { users, todos } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Insert
const newUser = await db.insert(users).values({ email: 'user@example.com' }).returning()

// Select
const allUsers = await db.select().from(users)

// Select with filter
const user = await db.select().from(users).where(eq(users.email, 'user@example.com'))

// Join
const userTodos = await db
  .select({
    user: users,
    todo: todos,
  })
  .from(users)
  .innerJoin(todos, eq(users.id, todos.userId))
```

### Access PostgreSQL Directly

```bash
# Connect to database
docker-compose exec db psql -U supabase_admin -d postgres

# Or use Supabase Studio
open http://localhost:54323

# Or use Drizzle Studio
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

### Docker

```bash
npm run docker:up        # Start all services
npm run docker:down      # Stop all services
npm run docker:logs      # View logs
```

## 🌐 Environment Variables

| Variable                        | Description        | Default               |
| ------------------------------- | ------------------ | --------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase API URL   | http://localhost:8000 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous API key  | -                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service role key   | -                     |
| `POSTGRES_HOST`                 | PostgreSQL host    | localhost             |
| `POSTGRES_PORT`                 | PostgreSQL port    | 5432                  |
| `POSTGRES_DB`                   | Database name      | postgres              |
| `POSTGRES_USER`                 | Database user      | supabase_admin        |
| `POSTGRES_PASSWORD`             | Database password  | -                     |
| `JWT_SECRET`                    | JWT signing secret | -                     |

## 🐳 Docker Services

| Service        | Description           | Port       |
| -------------- | --------------------- | ---------- |
| app            | Next.js application   | 3000       |
| db             | PostgreSQL database   | 5432       |
| kong           | API Gateway           | 8000, 8443 |
| auth           | GoTrue authentication | -          |
| realtime       | WebSocket server      | -          |
| storage        | File storage          | -          |
| rest           | PostgREST API         | -          |
| studio         | Supabase Dashboard    | 54323      |
| edge-functions | Deno edge runtime     | -          |

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting/docker)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Drizzle Kit Documentation](https://orm.drizzle.team/docs/kit-overview)

## 📝 License

MIT
