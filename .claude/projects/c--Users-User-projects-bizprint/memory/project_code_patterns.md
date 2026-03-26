---
name: BizPrint Code Patterns
description: Frontend apiFetch, mobile apiGet/apiPost, canvas_data usage, background upload patterns
type: project
---

## canvas_data Usage
- Layout colors come ONLY from canvas_data (accent, bg, textDark, textLight)
- Only show layouts that have canvas_data: `layouts.filter(l => l.canvas_data)`
- Fallbacks: accent=#FF6B00, bg=#FFFFFF, textDark=#111, textLight=#888

## Frontend API
```typescript
import { apiFetch } from '@/lib/api'
const data = await apiFetch('/business-cards')
```

## Mobile API
```typescript
import { apiGet, apiPost } from '../lib/api'
const data = await apiGet('/business-cards')
```

## Background Upload (multipart/form-data)
- Field name: "file" (single), "files" (bulk)
- Stored at: backend/uploads/bc-backgrounds/
- URL: /uploads/bc-backgrounds/filename.jpg
- Served via ServeStaticModule

**Why:** Consistent patterns across web and mobile clients.
**How to apply:** Use these exact patterns when adding new API calls or working with business card layouts.
