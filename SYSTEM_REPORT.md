# BizPrint — Системийн Бүрэн Тайлан

**Огноо:** 2026-04-04

---

## 1. Системийн Танилцуулга

**BizPrint** бол Монголын зах зээлд зориулсан **Print-on-Demand** (хэвлэх захиалгат) олон талт e-commerce платформ юм. Энэ нь олон борлуулагч (multi-vendor marketplace) загвартай, AI-тай нэгтгэгдсэн, бүрэн автоматжуулсан хэвлэлийн үйлдвэрлэлийн удирдлагын систем.

| Үзүүлэлт | Утга |
|-----------|------|
| Төслийн нэр | BizPrint |
| Төрөл | Print-on-Demand Marketplace SaaS |
| Хэл | Монгол (UI hardcoded) |
| Хөгжүүлэлт эхэлсэн | 2026-03-13 |
| Сүүлийн commit | 2026-04-03 |
| Хөгжүүлэлтийн хугацаа | **21 хоног** |
| Нийт commit | **225** |
| Хөгжүүлэгч | bizprintpro-alt (221 commit) |

---

## 2. Технологийн Stack

| Давхарга | Технологи |
|----------|-----------|
| **Frontend** | Next.js 16.1.6, React 19, Tailwind CSS 4 |
| **Backend** | NestJS 11, TypeORM, PostgreSQL |
| **Mobile** | Expo + React Native (4 апп) |
| **Auth** | JWT + Passport, RBAC, 2FA/TOTP |
| **Realtime** | Socket.IO (6 gateway) |
| **AI** | Anthropic Claude API (tool_use agent) |
| **Cloud** | Cloudinary (зураг), Vercel (frontend), Railway (backend) |
| **Cache** | Redis (3 DB: sessions, cache, BullMQ) |
| **Хэл** | TypeScript 5 (бүх тал) |
| **Chart** | VisActor VChart |
| **Canvas** | Fabric.js |
| **PDF** | pdf-lib, jspdf, pdf-parse |
| **Docker** | Docker Compose (full stack) |

---

## 3. Monorepo Бүтэц

```
bizprint/
├── backend/              # NestJS API сервер (port 4000)
├── frontend/             # Next.js 16 App Router (port 3000)
├── mobile/
│   ├── admin/            # Админ мобайл апп (Expo)
│   ├── customer/         # Хэрэглэгч мобайл апп
│   ├── driver/           # Жолооч мобайл апп
│   └── staff/            # Ажилтан мобайл апп
├── bizprint-courier/     # Хүргэлтийн мобайл апп (Expo)
├── bizprint-workflow/    # Workflow систем
├── packages/             # Shared packages
├── scripts/              # Utility, fix, migration scripts
└── docker-compose.yml    # Full stack orchestration
```

---

## 4. Backend Статистик (NestJS)

| Үзүүлэлт | Тоо |
|-----------|-----|
| NestJS Модулиуд | **75** |
| Controllers | **87** |
| Entities (DB Table) | **141** |
| WebSocket Gateways | **6** |
| Guards | **6** |
| Interceptors | **1** |
| Filters | **1** |
| Scheduled Tasks | **1** |
| TypeScript файлууд | **~1,425** |

### 4.1 Гол Модулиуд (75)

**Бизнесийн модулиуд:**
- `OrdersModule` — Захиалга удирдлага (14 статус state machine)
- `ProductsModule` / `ProductsMasterModule` — Бүтээгдэхүүн каталог
- `CartModule` — Сагс, checkout
- `QuoteModule` / `SmartQuoteModule` — Үнийн санал
- `PaymentModule` — Төлбөр (escrow систем)
- `VendorsModule` — Борлуулагч удирдлага
- `FactoriesModule` — Үйлдвэр удирдлага
- `DeliveryModule` — Хүргэлт
- `ShippingModule` — Тээвэрлэлт
- `PricingConfigModule` — Үнийн тохиргоо

**Хэрэглэгч & Auth:**
- `AuthModule` — JWT, 2FA/TOTP, Password Reset
- `UsersModule` — Хэрэглэгч удирдлага (7+ role)
- `SubscriptionModule` — Захиалгат багц

**Контент & CMS:**
- `CmsModule` — Hero slides, settings, mega menu
- `PagesModule` — Динамик хуудсууд
- `PostsModule` — Блог
- `BannersModule` — Баннер
- `GalleryModule` — Cloudinary зургийн галерей
- `TemplatesModule` — Загвар

**Харилцаа:**
- `ChatModule` — Realtime чат (WebSocket)
- `NotificationModule` — Push мэдэгдэл
- `CustomerCareModule` — Тусламжийн тикет

**AI/ML модулиуд (14):**
- `AgentModule` — Claude AI ассистент (8 tool)
- `SmartQuoteModule` — AI-тай үнийн санал
- `GangRunModule` — Gang run оптимизаци
- `ImpositionModule` — Imposition layout
- `SheetOptimizerModule` — Цаасны оптимизаци
- `MachineSelectorModule` — Машин сонголт
- `PrintCostModule` — Хэвлэлийн зардал тооцоо
- `PrintSizeModule` — Хэмжээ тооцоо
- `ProductionSchedulerModule` — Үйлдвэрлэлийн хуваарь
- `PdfInspectorModule` — PDF шалгалт

**Бусад:**
- `AnalyticsModule` — Аналитик
- `AuditTrailModule` — Аудит лог
- `LoyaltyModule` — Урамшуулал/Loyalty
- `ReferralModule` — Referral систем
- `WalletModule` — Цахим хэтэвч
- `InvitationModule` — Урилга
- `MarketingModule` — Маркетинг кампейн
- `DesignRequestsModule` — Дизайн захиалга (Zoom нэгтгэлтэй)
- `BusinessCardsModule` — Нэрийн хуудас
- `DigitalCardModule` — Цахим нэрийн хуудас
- `CreatorModule` — Creator/UGC систем
- `ReportsModule` — Тайлан

### 4.2 WebSocket Gateways (6)

| Gateway | Зориулалт |
|---------|-----------|
| ChatGateway | Realtime мессеж |
| OrdersGateway | Захиалгын шинэчлэл |
| NotificationsGateway | Push мэдэгдэл |
| DeliveryGateway | Хүргэлт tracking |
| CmsGateway | CMS event broadcast |
| SyncGateway | Глобал синхрончлол |

### 4.3 Захиалгын State Machine (FROZEN)

```
DRAFT → QUOTATION_SENT → CONFIRMED → PENDING_FILE → FILE_REVIEW
  → FILE_REJECTED → ON_HOLD → IN_PRODUCTION → FINISHING
  → PARTIALLY_DISPATCHED → DISPATCHED → DELIVERED → COMPLETED
  → CANCELLED
```

### 4.4 Escrow & Төлбөрийн Систем

- Хэрэглэгч төлбөр хийнэ → BizPrint хадгална → DELIVERED болсон → 48-72 цаг → Vendor-д шилжүүлнэ
- Буцаалт: Үйлдвэрлэлийн өмнө = 100%, Үйлдвэрлэлд = хэсэгчилсэн, Илгээсний дараа = 0%

---

## 5. Frontend Статистик (Next.js)

| Үзүүлэлт | Тоо |
|-----------|-----|
| Нийт хуудас/route | **128** |
| Компонентууд | **94** |
| UI (shadcn) компонент | **18** |
| Custom Hooks | **7+** |
| Zustand Stores | **2** |
| Context Providers | **2** |
| Service/API файлууд | **8** |
| TSX файлууд | **~324** |
| Runtime dependencies | **25** |

### 5.1 Хуудсуудын Бүтэц (128 route)

| Бүлэг | Хуудас тоо | Жишээ |
|--------|------------|-------|
| Root & Auth | 6 | `/login`, `/register`, `/forgot-password` |
| Shop & Products | 6 | `/shop`, `/shop/[id]`, `/compare`, `/cart` |
| Checkout & Quote | 3 | `/checkout`, `/quote`, `/smart-quote` |
| Customer Dashboard | 25+ | `/dashboard/customer/*` |
| Admin Panel | **37** | `/admin/*` (бүрэн CRUD) |
| Creator Dashboard | 8 | `/creator/*` |
| Mobile Pages | 7 | `/mobile/*` |
| Designer Pages | 5 | `/designer/*` |
| Loyalty | 4 | `/loyalty/*` |
| Marketplace | 1 | `/marketplace` |
| CMS Pages | 6 | `/p/[slug]`, `/gallery`, `/posts` |

### 5.2 Admin Panel (37 хуудас)

Бүрэн CRUD удирдлагатай:
`analytics`, `banners`, `business-cards`, `capacity`, `categories`, `chat`, `cms`, `commission`, `creators`, `customers`, `design-requests`, `gallery`, `hero-slides`, `invitations`, `machines`, `marketing`, `mega-menu`, `menus`, `orders`, `pages`, `print-calculator`, `product-pricing`, `products`, `quote-engine`, `reports`, `settings`, `subscription-plans`, `subscriptions`, `support`, `system`, `templates`, `users`, `vendors`, `wallet-requests`, `webhooks`, `workflow`

### 5.3 State Management

| Систем | Зориулалт |
|--------|-----------|
| **Zustand** | Cart, wishlist, compare (localStorage persist) |
| **Zustand** | Chat store (rooms, messages, typing) |
| **React Context** | RealtimeContext (Socket.IO sync) |
| **React Context** | SiteSettingsContext (CMS тохиргоо) |
| **Jotai** | Fine-grained atoms |

---

## 6. Хэрэглэгчийн Дүр (7 Role)

| Role | Dashboard | Шаардлага |
|------|-----------|-----------|
| **admin/superadmin** | `/admin` | Систем удирдлага |
| **customer** | `/dashboard/customer` | Бүртгэл л хангалттай |
| **vendor** | `/dashboard/vendor` | KYC баталгаажуулалт |
| **factory** | `/dashboard/factory` | KYC баталгаажуулалт |
| **designer/creator** | `/dashboard`, `/creator` | Portfolio + баталгаажуулалт |
| **courier** | `/dashboard` | Жолооны үнэмлэх |
| **sales** | `/dashboard/sales` | Баталгаажуулалт |

### KYC Баталгаажуулалт:
- Иргэний үнэмлэх (урд/хойд тал)
- Бизнесийн лиценз
- Гэрчилгээ
- Статус: `pending → under_review → verified / rejected`

---

## 7. AI Интеграци

| Систем | Технологи | Зориулалт |
|--------|-----------|-----------|
| AI Chat Agent | Claude Sonnet (tool_use) | Хэрэглэгчийн ассистент, захиалга удирдлага |
| Smart Quote | Claude API | AI-тай үнийн санал |
| Prepress Engine | Custom AI | Хэвлэлийн бэлтгэл |
| Sheet Optimizer | Algorithm | Цаасны зүсэлт оптимизаци |
| Gang Run | Algorithm | Олон захиалга нэгтгэх |
| Imposition | Algorithm | Layout байршуулалт |
| Machine Selector | AI | Тохиромжтой машин сонголт |
| Production Scheduler | AI | Үйлдвэрлэлийн хуваарь |
| Print Cost Calculator | Algorithm | Зардал тооцоолол |
| PDF Inspector | pdf-parse | Файл шалгалт |

---

## 8. Deployment & Infrastructure

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Vercel         │     │   Railway         │     │   Cloudinary  │
│   (Frontend)     │◄───►│   (Backend+DB)    │     │   (Images)    │
│   Next.js 16     │     │   NestJS + PG     │     │               │
└─────────────────┘     │   + Redis          │     └──────────────┘
                        └──────────────────┘
```

| Сервис | Platform | Зориулалт |
|--------|----------|-----------|
| Frontend | Vercel | Next.js hosting, CDN |
| Backend | Railway | NestJS API, PostgreSQL, Redis |
| Images | Cloudinary | Зураг upload, transform |
| Docker | Local/Self-hosted | docker-compose бүрэн stack |

---

## 9. Хийгдсэн Ажлууд (21 хоногт)

### Гол Feature-үүд (225 commit):

1. **Бүрэн Auth систем** — Бүртгэл, нэвтрэлт, password reset, 2FA/TOTP, KYC
2. **Multi-role бүртгэл** — 7 дүрийн 3-шатлалт бүртгэлийн форм
3. **Бүтээгдэхүүний каталог** — Master products, variants, attributes, addons
4. **Сагс & Checkout** — Cart → Quote → Order pipeline, QR код
5. **Захиалгын систем** — 14 статус state machine, timeline, файл удирдлага
6. **Vendor & Factory удирдлага** — Capability matrix, commission систем
7. **Үнийн систем** — Dynamic pricing, color mode, per-product margin
8. **AI Chat Agent** — Claude tool_use, 8 tool, role-aware
9. **Smart Quote** — AI-тай автомат үнийн санал
10. **Хэвлэлийн AI** — Prepress, imposition, gang-run, sheet optimizer
11. **Realtime Chat** — Socket.IO, файл upload, typing indicator
12. **Notification систем** — Push, WebSocket, in-app
13. **CMS систем** — Hero slides, mega menu, dynamic pages, site settings
14. **Cloudinary Gallery** — Masonry view, CRUD, lightbox
15. **Хүргэлтийн систем** — Realtime tracking, webhook
16. **Loyalty систем** — Stamp card, QR scan, programs
17. **Creator/UGC систем** — Portfolio, projects, earnings, live booking
18. **Digital Business Card** — QR subscription
19. **Design Request** — Zoom integration, version control, comments
20. **Wallet & Payment** — Escrow, invoices, wallet requests
21. **Subscription Plans** — Багцууд, addons, usage tracking
22. **Admin Panel** — 37 хуудас, бүрэн CRUD, command palette
23. **Mobile Apps** — 4 Expo апп (customer, driver, admin, staff)
24. **Marketing** — Campaign management
25. **Reports & Analytics** — Charts, KPI, dashboards
26. **Landing Page** — Branding, standalone
27. **Email Templates** — Professional template system
28. **Referral систем** — Referral tracking
29. **Invitation систем** — Урилга, guest management

---

## 10. Тоон Үзүүлэлтүүд (Summary)

| Үзүүлэлт | Тоо |
|-----------|-----|
| Нийт commit | **225** |
| Хөгжүүлэлтийн хоног | **21** |
| Backend модулиуд | **75** |
| API Controllers | **87** |
| Database entities | **141** |
| Frontend хуудас | **128** |
| Frontend компонент | **94** |
| WebSocket gateways | **6** |
| AI модулиуд | **14** |
| Mobile apps | **4** |
| Нийт TS/TSX файл | **~1,749** |
| Admin хуудас | **37** |
| User roles | **7+** |
| Order статус | **14** |
| Runtime dependencies (BE) | **30+** |
| Runtime dependencies (FE) | **25** |

---

## 11. Цаашдын Ирээдүй & Боломж

| Чиглэл | Тодорхойлолт |
|---------|-------------|
| **Mobile App Release** | 4 Expo апп App Store/Play Store-д гаргах |
| **Payment Gateway** | QPay, SocialPay, банкны интеграци |
| **i18n** | Олон хэлний дэмжлэг (одоо hardcoded Монгол) |
| **Kubernetes** | Docker-оос K8s рүү шилжих (scaling) |
| **CI/CD Pipeline** | GitHub Actions автоматжуулалт |
| **Testing** | Unit/E2E тест нэмэх (Jest, Playwright) |
| **CDN & Edge** | Vercel Edge Functions, ISR оптимизаци |
| **Advanced AI** | Claude-тай бүрэн автоматжуулсан prepress workflow |
| **Analytics** | Google Analytics, Mixpanel нэгтгэл |
| **SEO** | Server-side rendering, structured data |
| **Monitoring** | Sentry, Grafana, health checks |
| **API Versioning** | v2 API бүрэн шилжилт |

---

## 12. Дүгнэлт

BizPrint нь **21 хоногийн** хугацаанд **225 commit**-ээр бүтээгдсэн, **enterprise-grade** print-on-demand платформ. **75 backend модуль**, **128 frontend хуудас**, **141 database entity**, **14 AI модуль**, **6 realtime gateway**, **4 mobile app**-тай бүрэн функционал систем. AI-тай нэгтгэгдсэн хэвлэлийн үйлдвэрлэлийн оптимизаци, escrow төлбөрийн систем, multi-vendor marketplace зэрэг нарийн бизнес логик хэрэгжүүлсэн.
