---
name: BizPrint Project Overview
description: Mongolian print-on-demand platform — tech stack, DB schema, API endpoints, business cards module details
type: project
---

BizPrint — Mongolian print/business card ordering platform (multi-vendor marketplace).

## Tech Stack
- Backend: NestJS + TypeORM + PostgreSQL (port 4000)
- Frontend Web: Next.js 14 App Router (port 3000)
- Mobile: Expo React Native (separate repo: bizprint-customer)
- Admin: Next.js at /admin/*

## Credentials
- Admin: admin@bizprint.mn / Admin@2026
- DB: postgres/postgres on localhost:5432, database: bizprint

## Business Cards Module (core feature)
- DB tables: bc_products, bc_layouts, bc_layout_backgrounds, bc_pricing_tiers
- canvas_data JSON: { accent, bg, textDark, textLight }
- Main product ID: 57229fb9-12d5-4104-863f-d95e619f30d8
- 20 layouts (sort_order 40-59) with canvas_data
- Pricing: 100=₮30, 200=₮27.5, 500=₮24, 1000=₮20/unit

## Key API Endpoints
- Admin CRUD: /admin/business-cards (JWT required)
- Layout management: /admin/business-cards/:id/layouts
- Background upload: /admin/business-cards/:id/layouts/:layoutId/backgrounds (multipart)
- Public: /business-cards, /business-cards/:id, /business-cards/:id/price?quantity=N

## Pending Tasks
1. Background upload UI in admin (drag & drop / file picker)
2. Background display in web editor + mobile app (dropdown)
3. ServeStaticModule for /uploads
4. Mobile flip preview for front/back

**Why:** Core business card ordering flow needs background image support and static file serving.
**How to apply:** When working on business-cards features, reference these endpoints and DB schema.
