# BizPrint

Mongolian print-on-demand e-commerce platform (multi-vendor marketplace).

## Monorepo Structure

```
bizprint/
├── backend/          # NestJS API server (port 4000)
├── frontend/         # Next.js 16 App Router (port 3000)
├── scripts/          # Migration/fix scripts
└── start-backend.bat # Quick backend launcher
```

See `backend/CLAUDE.md` and `frontend/CLAUDE.md` for detailed module docs.

## Quick Start

```bash
# Backend
cd backend && npm run start:dev    # localhost:4000

# Frontend
cd frontend && npm run dev         # localhost:3000
```

## Tech Stack

| Layer    | Tech                                        |
|----------|---------------------------------------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4        |
| Backend  | NestJS 11, TypeORM, PostgreSQL               |
| Auth     | JWT + Passport, role-based, 2FA/TOTP         |
| Realtime | Socket.IO (chat, notifications)              |
| Language | TypeScript 5 (both sides)                    |
| OS       | Windows 11, bash/PowerShell                  |

## Database

- PostgreSQL on `localhost:5432`, database: `bizprint`
- Credentials: `postgres`/`postgres`
- TypeORM with `synchronize: true` (dev mode)

## Key Rules

1. **Read before writing** — always check existing files before modifying
2. **Don't duplicate** — edit existing code, don't rewrite
3. **Don't guess** — verify by reading the file if unsure
4. **Encoding** — UTF-8 for Mongolian text support

## User Roles & Routing

| Role     | Dashboard Route       |
|----------|-----------------------|
| admin    | `/admin`              |
| vendor   | `/dashboard/vendor`   |
| customer | `/dashboard/customer` |
| designer | `/dashboard`          |
| sales    | `/dashboard/sales`    |
| courier  | `/dashboard`          |
| factory  | `/dashboard/factory`  |

## Design System

- Brand color: `#FF6B00` (orange)
- Font: DM Sans, Segoe UI, system-ui
- Dark/Light theme via CSS variables (`data-theme`)
- Mongolian UI language (hardcoded, no i18n)

## API Pattern

- Backend REST endpoints at `http://localhost:4000`
- Frontend fetches with JWT `Authorization: Bearer` header
- CORS enabled for `localhost:3000` and `localhost:3001`
- Rate limit: 100 req/60s
