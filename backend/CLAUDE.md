# BizPrint — Backend Development Guide

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
