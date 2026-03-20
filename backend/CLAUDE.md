# BizPrint Backend

Print-on-demand e-commerce platform backend built with NestJS.

## Tech Stack

- **Framework:** NestJS v11 (Express)
- **Language:** TypeScript 5.7
- **Database:** PostgreSQL via TypeORM (auto-sync enabled)
- **Auth:** JWT + Passport (local & JWT strategies), 2FA/TOTP
- **Real-time:** Socket.IO via @nestjs/websockets
- **Port:** 4000 (frontend on 3000)

## Commands

- `npm run start:dev` — dev server with watch
- `npm run build` — compile TypeScript
- `npm run start:prod` — production mode
- `npm run lint` — ESLint with auto-fix
- `npm test` — Jest unit tests
- `npm run test:e2e` — end-to-end tests

## Project Structure

```
src/
├── ai/                  # AI modules (quote, imposition, gang-run, PDF inspect, etc.)
├── auth/                # JWT authentication
├── users/               # User management
├── products/            # Product catalog
├── product-attributes/  # Product attributes
├── product-variants/    # Product variants
├── categories/          # Categories
├── cart/                # Shopping cart
├── orders/              # Order management
├── vendors/             # Multi-vendor support
├── price/ & pricing/    # Pricing modules
├── pricing-rules/       # Dynamic pricing rules
├── quote-engine/        # Quote generation
├── quotes-v2/           # Enhanced quotes
├── payment/             # TDB payment gateway
├── delivery/            # Delivery & webhooks
├── production/          # Production workflow
├── production-jobs/     # Job tracking
├── factories/           # Factory management
├── chat/                # WebSocket chat
├── mail/                # Email service
├── notifications/       # In-app notifications
├── wallet/              # Digital wallet
├── files/ & upload/     # File management
├── admin/               # Admin controls
├── settings/            # System settings
├── audit-trail/         # Audit logging
├── banners/             # Marketing banners
├── pages/ & menus/      # CMS
├── templates/           # Design templates
├── design-requests/     # Design workflow
├── referral/            # Referral system
└── machines/ & paper-types/  # Print resources
```

## Key Patterns

- Modules follow NestJS convention: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.entity.ts`
- TypeORM entities use decorators (`@Entity`, `@Column`, etc.)
- Guards for auth: `JwtAuthGuard`, role-based guards
- CORS: localhost:3000 and localhost:3001
- Rate limiting: 100 req/60s (Throttler)
- Static files served from `/uploads/`

## Database

- PostgreSQL on localhost:5432, database: `bizprint`
- `synchronize: true` — schema auto-syncs (dev mode)
- `autoLoadEntities: true`
