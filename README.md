# 🍅 Pomodash

> A production-grade Pomodoro timer with task tracking, focus analytics, and a global leaderboard.

**[Live Demo](https://pomodashpomo.vercel.app)** · Built with Next.js 15, Prisma 7, and NextAuth v5

---

## Overview

Pomodash helps you stay focused using the Pomodoro technique — 25-minute focus sessions alternating with short breaks. Every session is tracked, every task measured, and your productivity visualized across week, month, and year views.

![Dashboard Preview](public/preview.png)

---

## Features

- 🔐 **Google OAuth** — one-click sign in via NextAuth v5
- ⏱ **Pomodoro Timer** — focus, short break, and long break modes with custom durations
- ✅ **Task Management** — create tasks, assign pomodoros, track completion
- 📊 **Statistics** — stacked bar charts with week / month / year views and arrow navigation
- 🔥 **Streaks** — current and longest daily focus streaks
- 🏆 **Leaderboard** — top 20 users by focus time in the last 7 days
- ⚙️ **Settings** — fully customizable timer durations, auto-start, and sound preferences
- 🌙 **Dark Mode** — system-aware theme with no flash on load
- 💀 **Loading Skeletons** — every page streams a skeleton instantly via React Suspense
- 🚀 **Optimized** — 93 Lighthouse performance, 0ms TBT, 0.6s LCP

---

## Tech Stack

| Layer      | Technology                                           |
| ---------- | ---------------------------------------------------- |
| Framework  | Next.js 15 (App Router, Turbopack)                   |
| Language   | TypeScript (strict mode)                             |
| Auth       | NextAuth v5 (Google OAuth, Prisma adapter)           |
| Database   | PostgreSQL via Neon (serverless, connection pooling) |
| ORM        | Prisma 7 (pg adapter)                                |
| Styling    | Tailwind CSS + DaisyUI                               |
| Charts     | Recharts (stacked bar)                               |
| Animation  | Framer Motion                                        |
| Deployment | Vercel                                               |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local Docker or [Neon](https://neon.tech))
- Google OAuth credentials

### 1. Clone and install

```bash
git clone https://github.com/Adarsh-Raut/pomodash.git
cd pomodash
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

AUTH_SECRET="your-random-secret-min-32-chars"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
```

### 3. Database setup

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# (Optional) Seed with sample data
npm run seed
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized origins and redirect URIs:

| Environment | Origin                        | Redirect URI                                           |
| ----------- | ----------------------------- | ------------------------------------------------------ |
| Local       | `http://localhost:3000`       | `http://localhost:3000/api/auth/callback/google`       |
| Production  | `https://your-app.vercel.app` | `https://your-app.vercel.app/api/auth/callback/google` |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login page
│   ├── (dashboard)/      # Protected routes
│   │   ├── dashboard/    # Timer + tasks
│   │   ├── stats/        # Analytics
│   │   ├── leaderboard/  # Rankings
│   │   └── settings/     # User preferences
│   └── layout.tsx        # Root layout with theme script
├── actions/              # Server actions (sessions, tasks, settings)
├── components/
│   ├── dashboard/        # DashboardClient, timer context
│   ├── stats/            # StatsShell, TaskStackedChart
│   ├── tasks/            # TaskList, TaskItem
│   ├── timer/            # TimerCard, SessionTypeSelector
│   ├── layout/           # Navbar
│   └── settings/         # SettingsForm
├── lib/
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # Prisma client with connection pool
│   └── utils.ts          # formatDuration, getDateRange, etc.
└── types/                # Shared TypeScript types
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

---

## Deployment

### Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables (same as `.env.local` above, plus `NEXTAUTH_URL` set to your production URL)
4. Deploy

### Neon Database

1. Create a project at [neon.tech](https://neon.tech)
2. Enable **Connection Pooling** in the connection settings
3. Use the **pooler URL** (contains `-pooler` in the hostname) as `DATABASE_URL`
4. Run migrations against the production database:

```bash
DATABASE_URL="your-neon-pooler-url" npx prisma migrate deploy
```

---

## Architecture Notes

### Timer Persistence

The timer runs inside a `TimerProvider` context at the root layout level, so it continues running while navigating between pages.

### Streaming with Suspense

Every dashboard page uses React Suspense to stream a skeleton immediately while async data loads server-side. This gives instant visual feedback on navigation.

### Data Caching

Expensive queries (`getLeaderboard`, `getSessionStats`) are wrapped in `unstable_cache` with per-user cache keys and `revalidatePath` invalidation on new sessions.

### Connection Pooling

Prisma uses Neon's pooler endpoint with `pg.Pool` to share connections across serverless function invocations, significantly reducing cold start latency.

---

## Scripts

```bash
npm run dev          # Start development server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run seed         # Seed database with sample users and sessions
npx prisma studio    # Open Prisma database GUI
npx prisma migrate dev      # Create and apply a new migration
npx prisma migrate deploy   # Apply migrations to production
```

---

## Author

**Adarsh Raut** — Full Stack Developer

---

## License

MIT

---

Built by [Adarsh Raut](https://adarshraut.vercel.app)
