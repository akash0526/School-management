# School Management System for Nepal (SMS)

Web-based school management system + public website for Nepali schools.
Manages attendance, homework, exams/results, and communication between teachers, students, and parents.
**No financial/accounting/payment features.**

## Architecture (Separate Deployments)

| Layer | Folder | Deploy Target | Tech |
|-------|--------|---------------|------|
| Frontend | `frontend/` | **Vercel** | Next.js 14, Tailwind, PWA-ready |
| Backend | `backend/` | **Render** | Express.js, TypeScript, Prisma |
| Database | `infra/supabase/` | **Supabase** | PostgreSQL 15+ |

Each folder is an independent deployable unit with its own `package.json`, env config, and build script.

```
school-management-system/
├── frontend/                 → Vercel (Next.js)
│   ├── src/app/              → App Router pages & layouts
│   ├── src/components/       → UI + layout components
│   ├── src/lib/              → API client, i18n
│   ├── src/contexts/         → Auth provider
│   ├── src/types/            → Shared TS types (self-contained)
│   ├── src/locales/          → ne.json, en.json (Nepali default)
│   ├── vercel.json
│   └── .env.example
│
├── backend/                  → Render (Express.js API)
│   ├── src/config/           → Env validation, Prisma client
│   ├── src/middleware/       → Auth, role guard, error handler, rate limit, validation
│   ├── src/routes/           → Route definitions
│   ├── src/controllers/      → HTTP request/response layer
│   ├── src/services/         → Business logic (auth, SMS, notifications)
│   ├── src/repositories/     → Prisma data access layer
│   ├── src/types/            → Shared TS types (self-contained)
│   ├── src/validations/      → Zod schemas
│   ├── src/utils/            → Logger
│   ├── prisma/schema.prisma  → Database schema
│   ├── Dockerfile
│   ├── render.yaml
│   └── .env.example
│
├── shared/                   → Canonical shared types (reference)
├── infra/supabase/           → Supabase SQL schema
├── docker-compose.yml        → Local dev only
├── .env.example
└── README.md
```

## Layer Responsibilities (Backend)

- **`src/config/`** — Environment validation + Prisma client singleton. No business logic.
- **`src/middleware/`** — Cross-cutting concerns: JWT auth, role-based access control, error handling, rate limiting, Zod validation.
- **`src/routes/`** — Route wiring only. Delegates to controllers.
- **`src/controllers/`** — Parses request/response, calls services, returns JSON. No business logic.
- **`src/services/`** — Business logic: auth flow, SMS (Sparrow), notifications, user/school management.
- **`src/repositories/`** — Direct Prisma queries only. Keeps services testable.
- **`src/validations/`** — Zod input schemas.

## Quick Start

### 1. Clone / Open the folder

### 2. Set up Supabase (Database)
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Settings → Database** and copy the **Connection String** (use Transaction mode or Pooler).
3. Run `infra/supabase/schema.sql` in the Supabase SQL Editor, or let Prisma migrations create the tables.
4. Paste the connection string into `backend/.env` as `DATABASE_URL`.

### 3. Backend (Render)
```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT secrets, SMS keys
npm install
npx prisma generate
npm run dev        # http://localhost:5000
```
Deploy to Render: connect your GitHub repo, set root directory to `backend/`, add environment variables from `backend/.env.example`, and use the build/start commands in `backend/render.yaml`.

### 4. Frontend (Vercel)
```bash
cd ../frontend
cp .env.example .env.local
# Edit .env.local with NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
npm install
npm run dev        # http://localhost:3000
```
Deploy to Vercel: connect your GitHub repo, set root directory to `frontend/`, add `NEXT_PUBLIC_API_URL` as an environment variable.

### 5. Local Dev (Docker)
```bash
docker compose up -d
```

## Phase 0 Status (Authentication)

- `POST /api/auth/request-otp` — sends 6-digit OTP (mock mode logs to console)
- `POST /api/auth/verify-otp` — returns JWT access (15 min) + refresh (7 days) tokens
- `POST /api/auth/refresh` — new access token
- OTP rate limit: 3 per phone per 10 minutes
- Role-based access control (ADMIN/TEACHER/STUDENT/PARENT)
- Nepali default + English language toggle
- Mobile-first responsive (44px+ tap targets)
- Consistent API error shape: `{ success, data?, error?: { message, code } }`

## No Financial Features

This system intentionally excludes payments, billing, accounting, or fee collection.
