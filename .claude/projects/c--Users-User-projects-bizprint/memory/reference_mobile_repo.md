---
name: Mobile App Location
description: Expo React Native mobile app is in separate folder bizprint-customer, not in monorepo
type: reference
---

Mobile app (Expo React Native) is at `C:\Users\User\projects\bizprint-customer` — separate from the main monorepo.

Key files:
- `app/business-card.tsx` — 3-step order flow (info → layout → quantity)
- `lib/api.ts` — apiGet, apiPost helpers
- `lib/auth-context.tsx` — useAuth hook

**How to apply:** When user asks about mobile features, look in bizprint-customer folder, not the main repo.
