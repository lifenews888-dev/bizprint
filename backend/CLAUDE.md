# BizPrint — Backend Development Guide

## Project Overview
BizPrint is a Print Factory Operating System. NestJS + TypeScript + PostgreSQL + Redis + BullMQ.

## CRITICAL RULES (NEVER VIOLATE)

### 1. Order State Machine (FROZEN — do NOT add/remove/rename states)
enum OrderStatus: DRAFT, QUOTATION_SENT, CONFIRMED, PENDING_FILE, FILE_REVIEW, FILE_REJECTED, ON_HOLD, IN_PRODUCTION, FINISHING, PARTIALLY_DISPATCHED, DISPATCHED, DELIVERED, COMPLETED, CANCELLED

### 2. CART is NOT ORDER
- Cart = separate session-level entity with own table
- Cart statuses: ACTIVE, MERGED, CONVERTED, EXPIRED, ABANDONED
- Order starts at DRAFT after cart converts

### 3. Canonical API Pipeline (NO SHORTCUTS)
POST /cart/items -> Add to cart
POST /cart/quote -> Generate quote from cart
POST /cart/quote/confirm -> Convert quote to order (DRAFT)
No direct order or quote creation. No guest quotes.

### 4. Pricing Formula (FINAL)
customer_price = vendor_cost * (1 + margin_rate)
platform_revenue = customer_price - vendor_cost
NEVER use subtotal * 1.15

### 5. Single QuoteModule (NO DUPLICATES)
Only: src/quote/quote.module.ts, quote.controller.ts, quote.service.ts, pricing.service.ts
REMOVE if found: QuoteEngine, SmartQuote, FullQuote, AutoQuote, QuotesV2, QuoteFromFile

### 6. vendor_capabilities = Normalized Tables
capabilities(id, name, category) + vendor_capabilities(vendor_id, capability_id, specs JSONB)
NOT TEXT[] array

## 22 DB Tables
users, roles, products, product_rules, carts, cart_items, quotations, quotation_items, orders, order_items, order_vendor_groups, vendors, machines, capabilities, vendor_capabilities, production_jobs, production_stages, invoices, payments, shipments, shipment_items, events

## Key Rules
- carts: partial unique index WHERE status='active'
- orders: vendor_group_id for multi-vendor, NOT single vendor_id
- events: audit log (entity_type + entity_id)
- Escrow: Customer pays -> BizPrint holds -> DELIVERED -> 48-72h -> Vendor payout
- Refund: Before production=100%, In production=partial, After dispatch=0%
- Redis: DB0=Sessions, DB1=Cache, DB2=BullMQ

## 7 Dev Rules
1. New feature -> check state machine FIRST
2. Price calc -> pricing.service.ts ONLY
3. DB migration -> check events table
4. No SQL in controllers
5. State transitions -> validated against matrix
6. Cart ops -> check status='active'
7. Multi-vendor -> create order_vendor_groups
