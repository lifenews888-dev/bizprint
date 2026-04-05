# BizPrint Frontend

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
│   ├── portfolio/           # Portfolio
│   ├── projects/            # Projects
│   ├── jobs/                # Job board
│   ├── earnings/            # Earnings
│   ├── live/                # Live booking
│   └── submit/              # Submit work
├── creators/[id]/           # Creator public profile
│
├── designer/                # Designer dashboard (5 pages)
│   ├── templates/           # Template management
│   ├── requests/            # Design requests
│   ├── approval/            # Approval queue
│   └── earnings/            # Earnings
├── courier/                 # Courier dashboard
├── sales/                   # Sales dashboard
│
├── loyalty/                 # Loyalty program (4 pages)
│   ├── [programId]/         # Program detail
│   ├── scan/                # QR scan
│   ├── stamp/[id]/          # Stamp detail
│   └── staff/[programId]/   # Staff view
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
│   ├── orders/              # Order history
│   ├── delivery/            # Delivery tracking
│   ├── chat/                # Chat interface
│   ├── notifications/       # Notifications
│   ├── designer/            # Designer dashboard
│   ├── factory/             # Factory dashboard
│   ├── vendor/              # Vendor dashboard (page, loyalty)
│   └── customer/            # Customer dashboard (25+ pages)
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
