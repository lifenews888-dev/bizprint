# BizPrint Frontend

Print-on-demand e-commerce platform frontend built with Next.js.

## Tech Stack

- **Framework:** Next.js v16 (App Router)
- **Language:** TypeScript 5, React 19
- **Styling:** Tailwind CSS 4 (PostCSS plugin), CSS variables for theming
- **Real-time:** Socket.IO client for WebSocket chat
- **Charts:** Chart.js 4.5
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
├── layout.tsx              # Root layout (MegaNav, Footer, ChatWidget)
├── page.tsx                # Home page
├── globals.css             # Theme variables, responsive utilities
├── login/ & register/      # Auth pages
├── shop/                   # Product catalog
├── product/                # Product detail
├── cart/ & checkout/        # Purchase flow
├── quote/                  # AI quote calculator
├── order/                  # Order tracking
├── partner/                # Partner program
├── factory/                # Factory directory
├── services/               # Services pages
├── designer/               # Designer dashboard
├── courier/                # Courier dashboard
├── sales/                  # Sales dashboard
├── vendor/store/           # Vendor store
├── dashboard/
│   ├── page.tsx            # Customer dashboard
│   ├── orders/             # Order history
│   ├── delivery/           # Delivery tracking
│   ├── factory/            # Factory dashboard
│   ├── chat/               # Chat interface
│   └── customer/
│       ├── wallet/         # Wallet system
│       └── quotes/         # Quote history
└── admin/                  # Admin panel (23 pages)
    ├── layout.tsx          # Admin sidebar layout
    ├── banners/            # Banner CRUD
    ├── categories/         # Categories
    ├── chat/               # Admin chat
    ├── commission/         # Commission system
    ├── design-requests/    # Design requests
    ├── machines/           # Equipment
    ├── marketing/          # Marketing
    ├── menus/              # Navigation menus
    ├── orders/             # Order management
    ├── pages/              # CMS pages
    ├── pricing-rules/      # Pricing rules
    ├── products/           # Product catalog
    ├── quote-engine/       # Quote system
    ├── reports/            # Analytics
    ├── settings/           # Settings
    ├── templates/          # Design templates
    ├── users/              # User management
    ├── vendors/            # Vendor management
    ├── wallet-requests/    # Wallet ops
    ├── webhooks/           # Webhooks
    └── workflow/           # Production workflow

components/
├── nav/MegaNav.tsx         # Main navigation
├── layouts/DashboardLayout.tsx  # Dashboard sidebar layout
├── ChatBox.tsx             # Chat interface
├── ChatWidget.tsx          # Floating chat widget
├── Footer.tsx              # Footer
├── NotificationBell.tsx    # Notifications
├── ThemeToggle.tsx         # Dark/Light theme
├── AnnouncementBar.tsx     # Top banner
└── DeliveryTab.tsx         # Delivery tracking

hooks/
└── useChat.ts              # WebSocket chat hook

lib/
└── auth.ts                 # Token/auth utilities
```

## Key Patterns

- All pages use `'use client'` (client components)
- State: React hooks (`useState`, `useEffect`), no global state library
- API calls via `fetch` with JWT headers
- Path alias: `@/*` maps to project root
- Brand color: `#FF6B00` (orange)
- Dark/Light theme via `data-theme` attribute and CSS variables
- Responsive: custom CSS classes (`.grid-2`, `.hide-mobile`, `.stack-mobile`, etc.)
- Role-based dashboards: admin, customer, vendor, factory, designer, courier, sales
