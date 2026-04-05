# Life Audit App — Setup & Deployment Guide

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.local.example` to `.env.local` and fill in your keys:

```bash
cp .env.local.example .env.local
```

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `GOOGLE_REDIRECT_URI` | `http://localhost:3000/api/calendar/callback` (local) |
| `PLAID_CLIENT_ID` | https://dashboard.plaid.com → Team Settings → Keys |
| `PLAID_SECRET` | Same as above |
| `PLAID_ENV` | `sandbox` (testing) · `development` · `production` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (local) |

### 3. Set up Supabase database
1. Go to your Supabase project → SQL Editor
2. Paste the contents of `supabase/schema.sql` and run it
3. This creates all tables, RLS policies, indexes, and triggers

### 4. Start the dev server
```bash
npm run dev
```
Open http://localhost:3000

---

## Deploying to Vercel

### Option A — Vercel CLI (recommended)
```bash
npm install -g vercel
vercel
```
Follow the prompts. Vercel will detect Next.js automatically.

### Option B — GitHub integration
1. Push your code to a GitHub repo
2. Go to https://vercel.com/new
3. Import your repo
4. Vercel auto-detects Next.js settings from `vercel.json`

### Setting environment variables on Vercel
In your Vercel project dashboard → Settings → Environment Variables, add all variables from `.env.local.example`:

**Critical:** Update these two for production:
- `NEXT_PUBLIC_APP_URL` → `https://your-app.vercel.app`
- `GOOGLE_REDIRECT_URI` → `https://your-app.vercel.app/api/calendar/callback`

Also update your Google Cloud Console → OAuth 2.0 Client → Authorised redirect URIs to include your production URL.

### Plaid in production
- To go live with real UK banks, apply for **Plaid Development** or **Production** access at https://dashboard.plaid.com
- For testing without a real bank account, keep `PLAID_ENV=sandbox` (Plaid provides test credentials)

---

## Google Calendar Setup (detailed)

1. Go to https://console.cloud.google.com
2. Create a new project (or use existing)
3. Enable **Google Calendar API**
4. Create OAuth 2.0 credentials (Web application type)
5. Add authorised redirect URIs:
   - `http://localhost:3000/api/calendar/callback`
   - `https://your-app.vercel.app/api/calendar/callback`
6. Copy Client ID and Client Secret to your `.env.local`

---

## Architecture Overview

```
life-audit/
├── src/
│   ├── app/
│   │   ├── (app)/          # Authenticated pages (dashboard, entry, report, settings)
│   │   ├── (auth)/         # Login & signup pages
│   │   └── api/            # API routes
│   │       ├── entries/    # Time entries CRUD
│   │       ├── expenses/   # Expense entries CRUD
│   │       ├── profile/    # User profile
│   │       ├── calendar/   # Google Calendar sync
│   │       ├── plaid/      # Bank sync (link-token, exchange, sync)
│   │       └── report/     # AI report generation
│   ├── components/ui/      # Reusable UI components
│   ├── context/            # AuthContext (user + profile state)
│   └── lib/                # Supabase clients, Plaid client, data utilities
├── supabase/
│   └── schema.sql          # Database schema (run once in Supabase SQL editor)
├── vercel.json             # Vercel deployment config
└── .env.local.example      # Environment variable template
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Auth & DB | Supabase (PostgreSQL + Row Level Security) |
| AI Reports | Anthropic Claude (claude-opus-4-6) |
| Calendar | Google Calendar API (OAuth 2.0) |
| Bank Sync | Plaid API (react-plaid-link) |
| Deployment | Vercel |
