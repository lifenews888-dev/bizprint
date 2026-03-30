# BizPrint Digital Ecosystem OS — System Architecture

## 1. System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Customer  │ │  Admin   │ │  Vendor  │ │ Creator  │ │ Public   │  │
│  │Dashboard  │ │Dashboard │ │Dashboard │ │Dashboard │ │ Pages    │  │
│  └─────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│        └────────────┴────────────┴────────────┴────────────┘        │
│                            │ REST API │                              │
└────────────────────────────┼──────────┼──────────────────────────────┘
                             │          │
┌────────────────────────────┼──────────┼──────────────────────────────┐
│                      BACKEND (NestJS 11)                             │
│                                                                      │
│  ┌─── AUTH & RBAC ────────────────────────────────────────────────┐  │
│  │  JWT + Passport │ RolesGuard │ @Roles() │ OptionalJwtAuth      │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─── QR PLATFORM ────────────┐  ┌─── MARKETPLACE ──────────────┐  │
│  │ DigitalCardModule          │  │ CreatorModule (11 entities)   │  │
│  │ InvitationModule           │  │ DesignRequestsModule          │  │
│  │ ProductQrModule            │  │ TemplatesModule               │  │
│  │ AnalyticsModule            │  │ Zoom + Google Calendar        │  │
│  └────────────────────────────┘  └──────────────────────────────┘  │
│                                                                      │
│  ┌─── COMMERCE ───────────────┐  ┌─── BILLING ─────────────────┐  │
│  │ OrdersModule               │  │ SubscriptionModule           │  │
│  │ CartModule                 │  │ WalletModule                 │  │
│  │ QuoteModule + Engines      │  │ PaymentModule                │  │
│  │ ProductsModule             │  │ PricingRulesModule           │  │
│  └────────────────────────────┘  └──────────────────────────────┘  │
│                                                                      │
│  ┌─── OPERATIONS ─────────────┐  ┌─── AI ENGINE ───────────────┐  │
│  │ ProductionModule           │  │ PdfInspectorModule           │  │
│  │ CapacityModule             │  │ SmartQuoteModule             │  │
│  │ DeliveryModule             │  │ MachineSelectorModule        │  │
│  │ ShippingModule             │  │ PrintCost / PrintSize        │  │
│  └────────────────────────────┘  └──────────────────────────────┘  │
│                                                                      │
│  ┌─── SYSTEM ─────────────────┐  ┌─── COMMS ──────────────────┐  │
│  │ SystemModule (SuperAdmin)  │  │ ChatModule (Socket.IO)      │  │
│  │ AdminModule                │  │ MailModule                   │  │
│  │ ErrorLogModule             │  │ NotificationModule           │  │
│  │ ReportsModule              │  │ SyncModule (WebSocket)       │  │
│  └────────────────────────────┘  └──────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │         PostgreSQL           │
                    │   bizprint @ localhost:5432   │
                    │   TypeORM (synchronize: true) │
                    └─────────────────────────────┘
```

---

## 2. Database Schema (New Entities)

### Invitation System
```sql
-- invitations
id UUID PK, user_id FK→users, slug UNIQUE, title, description TEXT,
type (wedding|birthday|corporate|baby_shower|graduation|anniversary|other),
status (draft|active|expired|cancelled),
event_date, event_time, event_end_date,
venue_name, venue_address, venue_lat DECIMAL, venue_lng DECIMAL,
template_id, cover_image_url, gallery_urls JSONB, music_url,
accent_color, bg_color, font_family,
hero_section JSONB, story_timeline JSONB, custom_sections JSONB,
rsvp_enabled, max_guests, plus_one_allowed,
show_countdown, show_map,
qr_code_url, view_count, rsvp_count, share_count,
created_at, updated_at

-- invitation_guests
id UUID PK, invitation_id FK→invitations, name, phone, email,
rsvp_status (pending|attending|declined|maybe),
guest_count, plus_one_name, dietary_notes, message TEXT,
invite_token UNIQUE, has_viewed, viewed_at, responded_at, created_at

-- invitation_templates
id UUID PK, name, description, category, thumbnail_url, preview_url,
design_config JSONB, custom_css TEXT, is_premium, price,
usage_count, is_active, sort_order, created_at, updated_at
```

### Product QR System
```sql
-- product_qrs
id UUID PK, user_id FK→users, slug UNIQUE,
product_name, description TEXT, sku, barcode,
price DECIMAL, currency,
main_image_url, gallery_urls JSONB, video_url,
category, brand, specifications JSONB, features JSONB,
cta_text, cta_url, reorder_url,
show_reorder_button, show_reviews,
company_name, company_logo_url, company_website, company_phone,
accent_color, bg_color,
qr_code_url, scan_count, view_count, reorder_count,
is_active, created_at, updated_at

-- product_qr_reviews
id UUID PK, product_qr_id FK→product_qrs,
reviewer_name, reviewer_email, rating DECIMAL,
comment TEXT, image_urls JSONB,
is_approved, is_verified_purchase, created_at
```

### Subscription System
```sql
-- subscription_plans
id UUID PK, slug UNIQUE, name, description,
tier (free|pro|business|enterprise),
price_monthly DECIMAL, price_yearly DECIMAL,
max_digital_cards, max_invitations, max_product_qrs, max_qr_codes, max_storage_mb,
custom_domain, remove_branding, advanced_analytics, priority_support,
ai_content_generation, team_members, max_team_members,
features_list JSONB, is_active, sort_order, is_popular,
created_at, updated_at

-- user_subscriptions
id UUID PK, user_id FK→users, plan_id FK→subscription_plans,
status (active|expired|cancelled|past_due|trial),
billing_cycle (monthly|yearly),
amount_paid DECIMAL, starts_at, expires_at,
cancelled_at, cancel_reason, auto_renew,
payment_id, is_trial, renewal_count,
created_at, updated_at
```

### Analytics
```sql
-- analytics_events
id UUID PK, entity_type, entity_id,
event_type (view|scan|save|share|rsvp|reorder|click),
user_id, visitor_ip, visitor_ua, referrer,
country, city, device_type, browser, os,
metadata JSONB, created_at
INDEX(entity_type, entity_id), INDEX(user_id), INDEX(created_at)
```

---

## 3. API Endpoints

### Invitation System
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/invite/:slug` | Public | View invitation by slug |
| GET | `/invite/t/:token` | Public | Personalized invite view |
| POST | `/invite/t/:token/rsvp` | Public | Submit RSVP |
| GET | `/invitation-templates` | Public | List templates |
| GET | `/invitations/my` | JWT | User's invitations |
| POST | `/invitations` | JWT | Create invitation |
| PATCH | `/invitations/:id` | JWT | Update invitation |
| POST | `/invitations/:id/publish` | JWT | Publish invitation |
| DELETE | `/invitations/:id` | JWT | Delete invitation |
| POST | `/invitations/:id/guests` | JWT | Add guest |
| POST | `/invitations/:id/guests/bulk` | JWT | Bulk add guests |
| GET | `/invitations/:id/guests` | JWT | List guests |
| GET | `/invitations/:id/rsvp-stats` | JWT | RSVP statistics |
| GET | `/admin/invitations` | Admin | List all invitations |
| GET | `/admin/invitations/stats` | Admin | Platform stats |

### Product QR System
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/p/:slug` | Public | View product QR page |
| POST | `/p/:id/scan` | Public | Track QR scan |
| POST | `/p/:id/reorder` | Public | Track reorder click |
| GET | `/p/:id/reviews` | Public | List reviews |
| POST | `/p/:id/reviews` | Public | Submit review |
| GET | `/product-qr/my` | JWT | User's product QRs |
| POST | `/product-qr` | JWT | Create product QR |
| PATCH | `/product-qr/:id` | JWT | Update product QR |
| DELETE | `/product-qr/:id` | JWT | Delete product QR |
| GET | `/admin/product-qr` | Admin | List all product QRs |

### Subscription System
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/subscription/plans` | Public | List available plans |
| GET | `/subscription/my` | JWT | Current subscription |
| GET | `/subscription/limits` | JWT | Feature limits |
| POST | `/subscription/subscribe` | JWT | Subscribe to plan |
| POST | `/subscription/cancel` | JWT | Cancel subscription |
| POST | `/subscription/renew` | JWT | Renew subscription |
| GET | `/admin/subscriptions` | Admin | List all subscriptions |
| GET | `/admin/subscriptions/stats` | Admin | Revenue stats |
| POST | `/admin/subscription-plans` | Admin | Create plan |
| PATCH | `/admin/subscription-plans/:id` | Admin | Update plan |

### Analytics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/analytics/track` | Public | Track event |
| GET | `/analytics/my` | JWT | User analytics |
| GET | `/analytics/entity/:type/:id` | JWT | Entity analytics |
| GET | `/analytics/platform` | Admin | Platform-wide analytics |

### System (Super Admin)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/system/health` | SuperAdmin | System health check |
| GET | `/system/kpis` | SuperAdmin | Platform KPIs |
| GET | `/system/modules` | SuperAdmin | Module registry |
| GET | `/system/database` | SuperAdmin | Database info |

---

## 4. Frontend Structure

```
frontend/app/
├── invite/[slug]/page.tsx          ← Public invitation viewer
├── p/[slug]/page.tsx               ← Public product QR page
├── u/[slug]/page.tsx               ← Public digital card (existing)
├── dashboard/customer/
│   ├── invitations/page.tsx        ← Invitation list & create
│   ├── invitations/[id]/page.tsx   ← Invitation detail & guest mgmt
│   ├── product-qr/page.tsx         ← Product QR management
│   ├── subscription/page.tsx       ← Subscription plans & billing
│   ├── analytics/page.tsx          ← Personal analytics
│   ├── digital-card/page.tsx       ← Digital card (existing)
│   └── wallet/page.tsx             ← Wallet (existing)
├── admin/
│   ├── system/page.tsx             ← System control center
│   ├── invitations/page.tsx        ← Admin invitation management
│   ├── subscriptions/page.tsx      ← Admin subscription management
│   └── ... (30+ existing pages)
└── ... (all existing routes preserved)
```

---

## 5. Roles & Permissions

| Role | Dashboard | Modules | Key Actions |
|------|-----------|---------|-------------|
| **superadmin** | `/admin` + System | ALL | System control, module toggle, DB inspect |
| **admin** | `/admin` | Users, Products, Orders, Invitations, Subscriptions | Manage everything except system |
| **customer** | `/dashboard` | Digital Cards, Invitations, Product QR, Subscriptions, Orders, Wallet, Analytics | Create/manage own content |
| **vendor** | `/dashboard/vendor` | Orders, Products, Capacity, Earnings | Fulfill orders, manage products |
| **designer** | `/designer` | Design Requests, Templates, Earnings | Create designs, upload templates |
| **creator** | `/creator` | Portfolio, Jobs, Projects, Earnings, Live | Content creation, Zoom sessions |
| **courier** | `/courier` | Deliveries, Active jobs, Earnings | Delivery management |
| **factory** | `/dashboard/factory` | Orders, Machines | Production management |
| **sales** | `/sales` | Quotes, Customers, Reports | Sales pipeline |

---

## 6. Key User Flows

### QR → Digital → Transaction Flow
```
Customer creates Digital Card / Invitation / Product QR
  → System generates public URL + QR code
    → QR printed on physical product
      → Someone scans QR
        → Public page loads (mobile-optimized)
          → Analytics event tracked
            → CTA: save contact / RSVP / reorder / get quote
              → Conversion tracked
```

### Subscription Flow
```
Customer signs up (Free plan auto-assigned)
  → Uses features up to free limits
    → Hits limit → "Upgrade to Pro" prompt
      → Selects plan + billing cycle
        → Payment processed (wallet or direct)
          → Subscription activated
            → Feature limits expanded
              → Auto-renew or expire check
```

### Invitation Flow
```
Customer creates invitation (draft)
  → Selects template, fills event details
    → Adds guests (individual or bulk)
      → Publishes invitation (draft → active)
        → Shares QR code / personalized links
          → Guest views invitation (tracked)
            → Guest submits RSVP
              → Customer sees real-time RSVP stats
```

---

## 7. Monetization Model

| Revenue Stream | Model | Pricing |
|----------------|-------|---------|
| **Subscriptions** | Free / Pro / Business | ₮0 / ₮19,900/mo / ₮49,900/mo |
| **QR Digital Card** | Per-card annual | ₮29,900/year |
| **Print Orders** | Commission-based | vendor_cost × (1 + margin_rate) |
| **Creator Marketplace** | 20% platform fee | Per-job commission |
| **Premium Templates** | One-time purchase | ₮5,000-₮50,000 |
| **Invitation Templates** | Premium templates | ₮10,000-₮30,000 |

---

## 8. Deployment Architecture

```
┌─────────────────────────────────────────┐
│              Reverse Proxy              │
│              (Nginx / Caddy)            │
│         SSL termination + routing        │
└──────┬──────────────┬───────────────────┘
       │              │
┌──────┴──────┐ ┌─────┴──────┐
│  Frontend   │ │  Backend   │
│  Next.js    │ │  NestJS    │
│  Port 3000  │ │  Port 4000 │
│  (PM2/Docker)│ │ (PM2/Docker)│
└──────┬──────┘ └─────┬──────┘
       │              │
       └──────┬───────┘
              │
       ┌──────┴──────┐
       │ PostgreSQL   │
       │ Port 5432    │
       └──────┬──────┘
              │
       ┌──────┴──────┐
       │ File Storage │
       │ /uploads/    │
       │ (or S3)      │
       └─────────────┘
```

### Docker Compose (existing docker-compose.yml)
- `postgres` — Database
- `backend` — NestJS API
- `frontend` — Next.js app

### Scaling Strategy
- **Phase 1:** Single VPS (4GB RAM, 2 vCPU) — handles up to ~1000 concurrent users
- **Phase 2:** Separate DB server + Redis for caching/sessions
- **Phase 3:** Container orchestration (Docker Swarm / K8s), CDN for static assets

---

## 9. Module Count Summary

| Category | Modules | New in this update |
|----------|---------|-------------------|
| QR Platform | 3 | InvitationModule, ProductQrModule |
| Billing | 3 | SubscriptionModule |
| Analytics | 1 | AnalyticsModule |
| System | 1 | SystemModule |
| Commerce | 8 | — |
| Operations | 5 | — |
| AI | 8 | — |
| Creator | 2 | — |
| Communication | 4 | — |
| Content | 4 | — |
| Auth | 1 | — |
| **Total** | **~40 modules** | **5 new** |
