# BizPrint — Complete Project Documentation

> Generated: 2026-04-04
> All 3 CLAUDE.md files combined into a single downloadable document.

---

# Part 1: Root — Project Overview

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
| AI        | Anthropic Claude API (agent with tool_use, smart quote, prepress engine) |
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

- **Agent** — Claude chat assistant with 8 tools (role-aware)
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

---

# Part 2: Backend — Development Guide

## Project Overview
BizPrint is a Print Factory Operating System.
NestJS 11 + TypeScript 5 + PostgreSQL + Redis + BullMQ + Socket.IO + Claude AI.

## CRITICAL RULES (NEVER VIOLATE)

### 1. Order State Machine (FROZEN — do NOT add/remove/rename states)
```
enum OrderStatus: DRAFT, QUOTATION_SENT, CONFIRMED, PENDING_FILE, FILE_REVIEW,
FILE_REJECTED, ON_HOLD, IN_PRODUCTION, FINISHING, PARTIALLY_DISPATCHED,
DISPATCHED, DELIVERED, COMPLETED, CANCELLED
```

### 2. CART is NOT ORDER
- Cart = separate session-level entity with own table
- Cart statuses: ACTIVE, MERGED, CONVERTED, EXPIRED, ABANDONED
- Order starts at DRAFT after cart converts

### 3. Canonical API Pipeline (NO SHORTCUTS)
```
POST /cart/items        → Add to cart
POST /cart/quote        → Generate quote from cart
POST /cart/quote/confirm → Convert quote to order (DRAFT)
```
No direct order or quote creation. No guest quotes.

### 4. Pricing Formula (FINAL)
```
customer_price = vendor_cost * (1 + margin_rate)
platform_revenue = customer_price - vendor_cost
```
NEVER use subtotal * 1.15

### 5. vendor_capabilities = Normalized Tables
```
capabilities(id, name, category) + vendor_capabilities(vendor_id, capability_id, specs JSONB)
```
NOT TEXT[] array

## Module Map (75 modules)

### Core Infrastructure
- `app.module.ts` — Root module
- `config/` — ConfigModule setup
- `common/` — Interceptors, filters, decorators
- `sync/` — Global WebSocket sync gateway

### Auth & Users
- `auth/` — JWT + Passport, 2FA/TOTP, password reset, KYC verification
  - Guards: JwtAuthGuard, OptionalJwtAuthGuard, RolesGuard, AdminGuard
  - Strategies: JWT, Local
  - JWT: 15min access, 30day refresh
- `users/` — User CRUD, role management (7+ roles)

### Products & Catalog
- `products/` — Product listing, search, catalog
- `products-master/` — Master products, addons, finishings, materials, sizes
- `product-variants/` — Variant management
- `product-attributes/` — Custom attributes
- `product-qr/` — QR codes, product reviews
- `categories/` — Category tree with parameters
- `paper-types/` — Paper specifications
- `variants/` — Global variant definitions
- `templates/` — Design templates, purchases

### Orders & Commerce
- `cart/` — Shopping cart (ACTIVE/MERGED/CONVERTED/EXPIRED/ABANDONED)
- `orders/` — Order management (14 statuses), bulk ops, file upload, timeline
- `quote/` — Quotation system
- `payment/` — Invoices, payment processing, escrow
- `pricing-config/` — Per-product margin settings
- `pricing-engine/` — Rules, tiers, competitor pricing
- `pricing-catalog/` — Public pricing catalog
- `shipping/` — Shipments, tracking
- `delivery/` — Delivery management, webhooks, realtime tracking
- `wallet/` — Digital wallet system

### Vendors & Production
- `vendors/` — Vendor management, capabilities, metrics
- `factories/` — Factory profiles
- `machines/` — Equipment management
- `capacity/` — Capacity planning
- `production/` — Production jobs, stages
- `production-jobs/` — Job tracking

### AI & Automation (14 modules in `ai/`)
- `ai/agent/` — Claude chat assistant (tool_use, 8 tools, role-aware)
- `ai/smart-quote/` — AI-powered quotation (Claude API)
- `ai/gang-run/` — Multi-order consolidation optimizer
- `ai/imposition/` — Print layout calculation
- `ai/sheet-optimizer/` — Paper usage optimization
- `ai/machine-selector/` — Equipment matching
- `ai/print-cost/` — Cost estimation engine
- `ai/print-size/` — Size calculation
- `ai/production-scheduler/` — Production planning
- `ai/pdf-inspector/` — PDF file validation (pdf-parse)
- `quote-engine/` — Quote calculation engine

### Content & CMS
- `cms/` — Hero slides, site settings, mega menu (WebSocket gateway)
- `pages/` — Dynamic CMS pages
- `posts/` — Blog posts
- `banners/` — Banner management
- `menus/` — Navigation menus
- `mega-menu/` — Mega menu builder (columns, categories, promo blocks)
- `gallery/` — Cloudinary image gallery

### Communication
- `chat/` — Realtime chat (WebSocket gateway, rooms, messages)
- `notifications/` — Push notifications (WebSocket gateway, push tokens)
- `mail/` — Email templates (Nodemailer)
- `customer-care/` — Support tickets, customer profiles, interactions

### Engagement & Growth
- `loyalty/` — Loyalty programs, stamp cards, QR scan, sessions
- `referral/` — Referral tracking
- `marketing/` — Campaign management
- `invitation/` — Invitation system with guests, templates
- `subscription/` — Plans, addons, usage tracking, events

### Creator Economy
- `creator/` — Creator applications, contracts, portfolios, ratings, UGC packages
- `design-requests/` — Design orders with Zoom integration, versions, comments
- `business-cards/` — Business card products, layouts, pricing tiers
- `digital-card/` — Digital business cards, QR subscriptions

### Analytics & Monitoring
- `analytics/` — Event tracking
- `audit-trail/` — Activity audit log
- `reports/` — Reporting
- `error-log/` — Error logging
- `system/` — System health, maintenance mode

### Other
- `files/` — File management
- `upload/` — Cloudinary uploads (multer)
- `events/` — Event system
- `zoom/` — Zoom meeting integration
- `vendor-dashboard/` — Vendor analytics
- `customer-dashboard/` — Customer analytics

## WebSocket Gateways (6)

| Gateway              | Namespace     | Purpose                    |
|----------------------|---------------|----------------------------|
| ChatGateway          | /chat         | Realtime messaging         |
| OrdersGateway        | /orders       | Order status updates       |
| NotificationsGateway | /notifications| Push notifications         |
| DeliveryGateway      | /delivery     | Delivery tracking          |
| CmsGateway           | /cms          | CMS event broadcast        |
| SyncGateway          | /sync         | Global synchronization     |

## Guards & Security

| Guard               | Purpose                              |
|---------------------|--------------------------------------|
| JwtAuthGuard        | JWT token validation                 |
| OptionalJwtAuthGuard| Allow unauthenticated access         |
| RolesGuard          | @Roles() decorator enforcement       |
| AdminGuard          | Admin/superadmin only                |
| SubscriptionGuard   | @Subscription() plan check           |

## Key Middleware
- **Request Logger** — logs method, URL, IP (dev only)
- **Maintenance Mode** — blocks requests except /auth, /system, /cms
- **ResponseInterceptor** — wraps in standard format when X-Api-Version: 2

## Key Dependencies
- `@nestjs/*` v11 — Framework
- `typeorm` + `pg` — PostgreSQL ORM
- `passport` + `@nestjs/jwt` — Authentication
- `socket.io` — WebSockets
- `@anthropic-ai/sdk` — Claude AI integration
- `ioredis` — Redis client
- `@nestjs/schedule` — Cron tasks
- `@nestjs-modules/mailer` + `nodemailer` — Email
- `pdf-lib` + `pdf-parse` — PDF processing
- `qrcode` — QR generation
- `bcrypt` — Password hashing (12 rounds)
- `speakeasy` — 2FA/TOTP
- `winston` — Logging
- `class-validator` — DTO validation

## Escrow & Payment
- Customer pays → BizPrint holds → DELIVERED → 48-72h → Vendor payout
- Refund: Before production=100%, In production=partial, After dispatch=0%

## Dev Rules
1. New feature → check state machine FIRST
2. Price calc → pricing.service.ts ONLY
3. DB migration → check events table
4. No SQL in controllers
5. State transitions → validated against matrix
6. Cart ops → check status='active'
7. Multi-vendor → create order_vendor_groups

---

# Part 3: Frontend — Development Guide

Print-on-demand e-commerce platform frontend built with Next.js.

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript 5.9, React 19
- **Styling:** Tailwind CSS 4 + CSS variables + shadcn/ui + Radix UI
- **State:** Zustand (cart, chat), Jotai (atoms), React Context (realtime, settings)
- **Real-time:** Socket.IO client (chat, orders, delivery, notifications, sync)
- **Charts:** VisActor VChart
- **Canvas:** Fabric.js (design editor)
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **PDF:** jspdf
- **QR:** qrcode.react
- **Images:** Cloudinary + next-cloudinary
- **DnD:** @dnd-kit
- **API:** `http://localhost:4000` (NestJS backend)
- **Auth:** JWT in localStorage, role-based routing
- **Localization:** Mongolian (hardcoded, no i18n library)

## Commands

- `npm run dev` — dev server (port 3000)
- `npm run build` — production build
- `npm start` — start production server
- `npm run lint` — ESLint

## Project Structure

```
app/
├── layout.tsx               # Root layout (RealtimeProvider, SiteSettings, LayoutShell, Toaster)
├── page.tsx                 # Home page
├── globals.css              # Theme variables, responsive utilities
├── login/ & register/       # Auth pages (multi-role 3-step registration)
├── forgot-password/         # Password recovery
├── reset-password/          # Password reset
├── landing/                 # Standalone landing page
├── shop/                    # Product catalog + [id] detail
├── product/[_slug]/         # Product detail (slug)
├── compare/                 # Product comparison
├── cart/                    # Shopping cart
├── checkout/                # Checkout flow
├── quote/                   # AI quote calculator
├── smart-quote/             # Smart quote
├── order/                   # Order tracking
├── partner/                 # Partner program
├── pricing/                 # Pricing page
├── factory/                 # Factory directory
├── services/                # Services pages
├── business-cards/          # Business card product + editor
├── gallery/                 # Image gallery
├── posts/                   # Blog
├── marketplace/             # Marketplace
├── templates/               # Design templates
├── invite/[slug]/           # Invitation page
├── u/[slug]/                # User public profile
├── p/[...slug]/             # CMS dynamic pages
├── page/[slug]/             # CMS pages
│
├── creator/                 # Creator dashboard (8 pages)
│   ├── portfolio/
│   ├── projects/
│   ├── jobs/
│   ├── earnings/
│   ├── live/
│   └── submit/
├── creators/[id]/           # Creator public profile
│
├── designer/                # Designer dashboard (5 pages)
│   ├── templates/
│   ├── requests/
│   ├── approval/
│   └── earnings/
├── courier/                 # Courier dashboard
├── sales/                   # Sales dashboard
│
├── loyalty/                 # Loyalty program (4 pages)
│   ├── [programId]/
│   ├── scan/
│   ├── stamp/[id]/
│   └── staff/[programId]/
│
├── mobile/                  # Mobile-optimized pages (7 pages)
│   ├── dashboard/
│   ├── admin/
│   ├── shop/
│   ├── orders/
│   ├── profile/
│   ├── loyalty/
│   └── loyalty-scan/[id]/
│
├── dashboard/               # Role-based dashboards
│   ├── page.tsx             # Dashboard home
│   ├── orders/
│   ├── delivery/
│   ├── chat/
│   ├── notifications/
│   ├── designer/
│   ├── factory/
│   ├── vendor/              # (page, loyalty)
│   └── customer/            # (25+ pages)
│       ├── home/
│       ├── orders/
│       ├── designs/ & design/[id]/
│       ├── quotes/ & quote-calc/ & smart-quote/
│       ├── wallet/
│       ├── wishlist/
│       ├── business-cards/
│       ├── shop/
│       ├── loyalty/
│       ├── meetings/
│       ├── analytics/
│       ├── invitations/ & invitations/[id]/
│       ├── digital-card/
│       ├── product-qr/
│       ├── campaigns/
│       ├── become-creator/
│       ├── subscription/
│       ├── invoices/
│       └── ugc/
│
└── admin/                   # Admin panel (37 pages)
    ├── layout.tsx           # Admin sidebar + topbar + CommandPalette
    ├── analytics/
    ├── banners/
    ├── business-cards/
    ├── capacity/
    ├── categories/
    ├── chat/
    ├── cms/
    ├── commission/
    ├── creators/
    ├── customers/
    ├── design-requests/
    ├── gallery/
    ├── hero-slides/
    ├── invitations/
    ├── machines/
    ├── marketing/
    ├── mega-menu/
    ├── menus/
    ├── orders/
    ├── pages/
    ├── paper-types/
    ├── print-calculator/
    ├── product-pricing/
    ├── products/
    ├── quote-engine/
    ├── reports/
    ├── settings/
    ├── subscription-plans/
    ├── subscriptions/
    ├── support/
    ├── system/
    ├── templates/
    ├── users/
    ├── vendors/
    ├── wallet-requests/
    ├── webhooks/
    └── workflow/

components/                  # 94 component files
├── AiChatWidget.tsx         # AI chat floating widget
├── AnnouncementBar.tsx      # Top announcement
├── BookPriceCalculator.tsx  # Book price calc
├── ChatBox.tsx              # Chat interface
├── ChatWidget.tsx           # Floating chat widget
├── CommentThread.tsx        # Comment system
├── CreatorDashboardContent.tsx
├── CreatorProfileModal.tsx
├── DeliveryTab.tsx          # Delivery tracking
├── ErrorBoundary.tsx        # Error boundary
├── Footer.tsx               # Footer
├── GalleryPreview.tsx       # Gallery preview
├── HeroSlider.tsx           # Hero carousel
├── LayoutShell.tsx          # Main wrapper (MegaNav, Footer, ChatWidget)
├── LivePricePanel.tsx       # Live pricing
├── MarketplaceSection.tsx   # Marketplace section
├── MobileBottomNav.tsx      # Mobile nav
├── NotificationBell.tsx     # Notification dropdown
├── Paywall.tsx              # Subscription paywall
├── PdfViewer.tsx            # PDF viewer
├── PriceCalculator.tsx      # Price calculator
├── ProductCard.tsx          # Product card
├── ProductMediaUploader.tsx # Media upload
├── QuotePreview.tsx         # Quote preview
├── ThemeToggle.tsx          # Dark/Light toggle
├── UpgradeModal.tsx         # Upgrade prompt
├── VerificationBanner.tsx   # KYC banner
├── admin/                   # Admin components (DataTable, Sidebar, Topbar, CommandPalette...)
├── chart-blocks/            # Chart components (Bar, Donut, Funnel, Gauge, MultiBar)
├── chat/                    # Chat UI (10 components)
├── dashboard/               # Dashboard components (KpiCard, EmptyState, DashboardTabs)
├── design/                  # Design components
├── layouts/                 # DashboardLayout
├── marketplace/             # Marketplace (CreatorCard, FilterPanel, OrderModal, SearchBar)
├── mobile/                  # Mobile components
├── motion/                  # Animation (FadeIn, ScalePress, StaggerList)
├── nav/MegaNav.tsx          # Main navigation
├── order/                   # Order components (OrderCard, OrderStepper)
└── ui/                      # shadcn/ui base (18 components)

contexts/
├── RealtimeContext.tsx       # Socket.IO connection (/sync namespace)
└── SiteSettingsContext.tsx   # Global CMS settings

stores/
└── chat.store.ts            # Zustand chat store (rooms, messages, typing)

hooks/
├── useChat.ts               # Chat functionality
├── useRoleMode.ts           # Role-based UI switching
├── usePriceCalculator.ts    # Price calculation
├── usePricing.ts            # Pricing data
├── useRealtimeOrder.ts      # Realtime order updates
├── useDesignApproval.ts     # Design approval workflow
└── use-mobile.ts            # Mobile viewport detection

lib/
├── api.ts                   # Main fetch wrapper (apiFetch, apiUpload, JWT injection, 401 handling)
├── auth.ts                  # Token/auth utilities
├── store.ts                 # Zustand store (cart, wishlist, compare — persisted to localStorage)
├── use-role-guard.ts        # Role-based access control hook
├── error-reporter.ts        # Error logging service
└── services/
    ├── auth.ts              # Auth API
    ├── cart.ts              # Cart API
    ├── products.ts          # Product API
    ├── quotes.ts            # Quote API
    ├── orders.ts            # Order API
    ├── admin.ts             # Admin API
    └── chat.service.ts      # Socket.IO chat service

styles/
└── tokens.ts                # Design tokens (colors, spacing, radius, transitions)
```

## Key Patterns

- All pages use `'use client'` (client components)
- State: Zustand (global), React Context (realtime/settings), React hooks (local)
- API calls via centralized `apiFetch()` with JWT auto-injection and 401 handling
- Path alias: `@/*` maps to project root
- Brand color: `#FF6B00` (orange), Secondary: `#8B5CF6` (purple)
- Dark/Light theme via `data-theme` attribute and CSS variables
- Responsive: Tailwind CSS 4 + custom CSS classes (`.grid-2`, `.hide-mobile`, `.stack-mobile`)
- Role-based dashboards: admin, customer, vendor, factory, designer, creator, courier, sales
- Admin layout: sidebar + topbar + CommandPalette (Cmd+K)
- Mobile layout: bottom navigation bar
- Root layout: RealtimeProvider → SiteSettingsProvider → LayoutShell → ErrorBoundary → Toaster

## Theme Variables

```css
--primary: #FF6B00
--bg, --surface, --surface2, --surface3
--border
--text, --text2, --text3, --text4
/* Switches between dark (#0A0A0A) and light (#FFFFFF) via data-theme */
```

## Page Counts

| Section            | Pages |
|--------------------|-------|
| Admin Panel        | 37    |
| Customer Dashboard | 25+   |
| Creator Dashboard  | 8     |
| Mobile Pages       | 7     |
| Auth Pages         | 4     |
| Shop & Products    | 6     |
| Designer           | 5     |
| Loyalty            | 4     |
| Public/CMS         | 10+   |
| **Total**          | **128** |
