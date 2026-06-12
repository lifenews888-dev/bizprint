# BizPrint — Next-Generation Upgrade Roadmap

Status as of 2026-06-12. This document tracks the full-project audit (security, performance, AI, UX) and what was done vs. what remains. The **DONE** items shipped in the "next-gen hardening" commit; the **TODO** items are larger refactors deferred because each is multi-day and carries deployment risk.

---

## ✅ DONE — shipped this pass

### Security (critical, money/data)
- **Payment confirmation hardened** — `POST /payment/confirm/:invoiceCode` now requires `JwtAuthGuard + AdminGuard`; the unsigned TDB callback (`POST /payment/callback`) re-queries the gateway (`checkTdbStatus`) before marking an order paid, instead of trusting the request body. Closes a free-order hole.
- **Order IDOR closed** — new `OrdersService.getOrderForUser()` scopes order/file/timeline/status-log reads to the owning customer, assigned vendor, or admin. `/orders/customer/:id` is now admin-only (customers use `/orders/my`).
- **Invoice IDOR closed** — `/payment/invoices/:id` and `/invoices/number/:number` now require auth + ownership.
- **Admin guards** — bulk status/assign/priority/cancel and reassign-vendor now require `AdminGuard`.
- **Dev-only smoke test locked** — `bonum/test-e2e` disabled in production and no longer ships a hardcoded fallback secret.
- **Frontend XSS** — all CMS/vendor-authored HTML (`map_embed`, product `features_html`, admin page preview) routed through a shared `lib/sanitize.ts` (DOMPurify allowlist; `sanitizeEmbed` permits locked-down iframes for maps).
- **Dependency vulnerabilities** — `npm audit fix` on both apps. Frontend 13→4 (now 0 critical/high; `next`→16.2.9, `dompurify`→3.4, `minimist` override). Backend 67→38 (0 critical). Remaining items need semver-major bumps across the Nest stack — see TODO.

### AI
- **Model IDs upgraded** — agent + ai-quote moved off the deprecated `claude-sonnet-4-20250514` (retires 2026-06-15) to `claude-sonnet-4-6`; smart-quote normalized to the `claude-haiku-4-5` alias.
- **Prompt caching** — the agent's system prompt is split into a cached stable block + a volatile per-user block; `cache_control: ephemeral` caches tools + system so multi-turn tool loops stop re-paying for the identical prefix.
- **Agent loop hardened** — bounded to 8 iterations, per-tool try/catch with `is_error: true` tool results so Claude can recover from a failed tool instead of treating the error as data, plus per-call token/cache usage logging.

### Performance
- **DB indexes** — added on `orders(customer_id, factory_id, status, invoice_no, created_at)` and `products(category+is_active composite, vendor_id)`. (Dev auto-creates via `synchronize`; prod needs a migration — see TODO.)

---

## 🔜 TODO — larger refactors (prioritized)

### 1. Caching layer (Redis) — **highest leverage**
Redis is a dependency but unused as a cache. `settings.getAll()` and product lists hit Postgres on every request.
- Add `@nestjs/cache-manager` + ioredis store.
- Cache `settings.getAll`, `products.findAll`, pricing config; invalidate on the existing `EventBusService` events (`PRODUCT_UPDATED`, etc.).
- Effort: ~1–2 days. Impact: removes the bulk of per-request DB load.

### 2. Replace full-table scans with SQL aggregates
`order-ops.service.ts` `getKpiSummary()` / `getAlerts()` / `checkSla()` load the **entire** orders table into memory and reduce in JS. `order.service.ts` `getOrders()` has no pagination.
- Rewrite as `GROUP BY status` aggregate queries; add `skip/take` + `.select()` to list endpoints.
- Effort: ~1 day. Impact: large at scale.

### 3. Production DB migration for the new indexes
`synchronize` is off in prod. Generate/run a migration that creates the index set added this pass (and going forward, stop relying on `synchronize`).

### 4. Background jobs (BullMQ)
CLAUDE.md claims BullMQ but it is **not installed**. PDF generation, CSV export, and the AI agent loop run synchronously in the request thread.
- Stand up BullMQ; move PDF/export/AI off the request path; return a job id + poll/socket.
- Effort: ~2–3 days.

### 5. Frontend: server components + `next/image`
173/181 pages are `'use client'`; 62 files use raw `<img>`; only 1 `next/dynamic`.
- Convert public/read pages (home, catalog, product detail) to server components.
- Switch catalog/gallery images to `next/image` (Cloudinary loader).
- Dynamic-import heavy client libs (jspdf, visactor charts, fabric); drop unused `fabric`/`exceljs` if truly unused.
- Effort: incremental, ~3–5 days.

### 6. Remaining dependency vulnerabilities (semver-major)
Backend still has 33 high (lodash via @nestjs/config & @nestjs/swagger; html-minifier via @nestjs-modules/mailer; @anthropic-ai/sdk path-traversal fix is at 0.104.x). These require major bumps and individual testing — do them one at a time, not via `audit fix --force`.

### 7. UX polish pass
- Replace 85 `alert()` calls with `sonner` toasts.
- Wire the ProductCard wishlist button to the store (currently local-state only).
- Add app-wide `:focus-visible` ring; add `aria-label`s to icon-only buttons; fix `<img alt="">` on product/search results.
- Migrate MegaNav/Footer off hardcoded hex to theme tokens so dark mode works in the chrome.
- Skeleton loaders matching real card dimensions (reduce CLS).

### 8. AI next-gen features
- Vision-native PDF/artwork inspection (rasterize page 1 → send as image/document to Claude) to replace the DPI/has-images heuristics in smart-quote.
- Structured outputs (`output_config.format`) for smart-quote/ai-quote instead of regex-extracting JSON from model text.
- Confidence-gated escalation Haiku→Opus 4.8 for low-confidence prepress checks.
