# Save4223 Server

Next.js + Supabase fullstack application with local Supabase deployment.

## 🚀 Features

- ⚡ **Next.js 15** - React framework with App Router
- 🔐 **Supabase Auth** - Authentication with email/password
- 🗄️ **PostgreSQL** - Powerful relational database
- 📡 **Realtime** - Live data synchronization
- 🔧 **Edge Functions** - Serverless functions
- 🐳 **Docker** - Full containerization

## 📋 Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm or yarn

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

# Generate Supabase keys
cd /path/to/supabase/cli
./supabase start
```

Or manually generate JWT tokens at https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys

### 3. Start Supabase Locally

```bash
# Pull and start all services
docker-compose up -d

# Check status
docker-compose ps
```

Services will be available at:
- 🌐 **App**: http://localhost:3000
- 🔧 **Supabase Studio**: http://localhost:54323
- 🔌 **Supabase API**: http://localhost:8000
- 🗄️ **PostgreSQL**: localhost:5432

### 4. Run Next.js Development

```bash
npm run dev
```

## 📁 Project Structure

```
my-app/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── login/          # Login page
│   │   ├── auth/callback/  # Auth callback handler
│   │   └── page.tsx        # Home page
│   ├── utils/
│   │   └── supabase/       # Supabase clients
│   │       ├── client.ts   # Browser client
│   │       └── server.ts   # Server client
│   └── middleware.ts       # Auth middleware
├── supabase/               # Supabase config
├── Dockerfile             # Next.js container
├── docker-compose.yml     # Full stack services
└── .env.example           # Environment template
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

## 🗄️ Database

Access PostgreSQL directly:

```bash
# Connect to database
docker-compose exec db psql -U supabase_admin -d postgres

# Or use Supabase Studio
open http://localhost:54323
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Docker
npm run docker:up    # Start all services
npm run docker:down  # Stop all services
npm run docker:logs  # View logs
```

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL | http://localhost:8000 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous API key | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | - |
| `POSTGRES_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing secret | - |

## 🐳 Docker Services

| Service | Description | Port |
|---------|-------------|------|
| app | Next.js application | 3000 |
| db | PostgreSQL database | 5432 |
| kong | API Gateway | 8000, 8443 |
| auth | GoTrue authentication | - |
| realtime | WebSocket server | - |
| storage | File storage | - |
| rest | PostgREST API | - |
| studio | Supabase Dashboard | 54323 |
| edge-functions | Deno edge runtime | - |

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting/docker)

## 📝 License

MIT
