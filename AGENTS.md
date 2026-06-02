# BizPrint

Mongolian print-on-demand e-commerce platform (multi-vendor marketplace).
A Print Factory Operating System with AI-powered production optimization.

## Monorepo Structure

```
bizprint/
├── backend/              # NestJS 11 API server (port 4000)
├── frontend/             # Next.js 16 App Router (port 3000)
├── mobile/
│   ├── admin/            # Admin mobile app (Expo)
│   ├── customer/         # Customer mobile app (Expo)
│   ├── driver/           # Driver mobile app (Expo)
│   ├── courier/          # Courier mobile app (Expo)
│   └── staff/            # Staff mobile app (Expo)
├── bizprint-courier/     # Dedicated courier app (Expo)
├── bizprint-workflow/    # Workflow system package
├── packages/             # Shared packages
├── scripts/              # PowerShell & JS utility/fix scripts
├── docker-compose.yml    # Full stack orchestration
├── start-all.bat         # Start all services
├── start-backend.bat     # Quick backend launcher
└── vercel.json           # Vercel deployment config
```

See `backend/AGENTS.md` and `frontend/AGENTS.md` for detailed module docs.

## Quick Start

```bash
# Backend
cd backend && npm run start:dev    # localhost:4000

# Frontend
cd frontend && npm run dev         # localhost:3000
```

## Tech Stack

| Layer     | Tech                                               |
|-----------|----------------------------------------------------|
| Frontend  | Next.js 16, React 19, Tailwind CSS 4               |
| Backend   | NestJS 11, TypeORM, PostgreSQL                      |
| Mobile    | Expo + React Native (5 apps)                        |
| Auth      | JWT + Passport, RBAC, 2FA/TOTP, KYC verification   |
| Realtime  | Socket.IO (6 gateways: chat, orders, delivery, notifications, cms, sync) |
| AI        | Anthropic Codex API (agent with tool_use, smart quote, prepress engine) |
| Cloud     | Cloudinary (images), Vercel (frontend), Railway (backend) |
| Cache     | Redis (DB0=Sessions, DB1=Cache, DB2=BullMQ)        |
| Language  | TypeScript 5 (both sides)                           |
| OS        | Windows 11, bash/PowerShell                         |

## Database

- PostgreSQL on `localhost:5432`, database: `bizprint`
- Credentials: `postgres`/`postgres`
- TypeORM with `synchronize: true` (dev mode)
- 141 entities across 75 modules

## Key Rules

1. **Read before writing** — always check existing files before modifying
2. **Don't duplicate** — edit existing code, don't rewrite
3. **Don't guess** — verify by reading the file if unsure
4. **Encoding** — UTF-8 for Mongolian text support

## User Roles & Routing

| Role           | Dashboard Route       | Verification Required |
|----------------|-----------------------|-----------------------|
| admin/superadmin | `/admin`            | No (system)           |
| customer       | `/dashboard/customer` | No                    |
| vendor         | `/dashboard/vendor`   | KYC required          |
| factory        | `/dashboard/factory`  | KYC required          |
| designer/creator | `/creator`          | Portfolio + approval  |
| sales          | `/dashboard/sales`    | Verification          |
| courier        | `/dashboard`          | Driver license        |

### KYC Verification Flow
`pending → under_review → verified / rejected`
Documents: ID card (front/back), business license, certification

## Design System

- Brand color: `#FF6B00` (orange)
- Secondary: `#8B5CF6` (purple)
- Font: DM Sans, Segoe UI, system-ui
- Dark/Light theme via CSS variables (`data-theme`)
- Mongolian UI language (hardcoded, no i18n)
- UI components: shadcn/ui + Radix UI

## API Pattern

- Backend REST endpoints at `http://localhost:4000`
- Frontend fetches with JWT `Authorization: Bearer` header
- CORS enabled for `localhost:3000` and `localhost:3001`
- Rate limit: 100 req/60s

## Order Pipeline

```
Cart → Quote → Order (DRAFT)
POST /cart/items → POST /cart/quote → POST /cart/quote/confirm
```

### Order State Machine (FROZEN)
```
DRAFT → QUOTATION_SENT → CONFIRMED → PENDING_FILE → FILE_REVIEW
→ FILE_REJECTED → ON_HOLD → IN_PRODUCTION → FINISHING
→ PARTIALLY_DISPATCHED → DISPATCHED → DELIVERED → COMPLETED → CANCELLED
```

### Escrow Payment
Customer pays → BizPrint holds → DELIVERED → 48-72h → Vendor payout

## AI Modules (14)

- **Agent** — Codex chat assistant with 8 tools (role-aware)
- **Smart Quote** — AI-powered quotation
- **Gang Run** — Multi-order consolidation
- **Imposition** — Print layout optimization
- **Sheet Optimizer** — Paper usage optimization
- **Machine Selector** — Equipment matching
- **Print Cost** — Cost estimation
- **Print Size** — Size calculation
- **Production Scheduler** — Production planning
- **PDF Inspector** — File validation

## Deployment

| Service  | Platform   |
|----------|------------|
| Frontend | Vercel     |
| Backend  | Railway    |
| Database | Railway PG |
| Cache    | Railway Redis |
| Images   | Cloudinary |

## Scale

- 75 backend modules, 87 controllers, 141 entities
- 128 frontend pages, 94 components
- 6 WebSocket gateways
- 5 mobile apps (Expo)
- 225+ commits in 21 days
