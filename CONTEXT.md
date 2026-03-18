# BIZPRINT SYSTEM CONTEXT
# Шинэ чатад заавал уншуулах файл

## ЧУХАЛ ДҮРЭМ — ЭХЛЭХИЙН ӨМНӨ ЗААВАЛ УН

1. КОД БИЧИХИЙН ӨМНӨ заавал файлыг шалга:
   type C:\Users\User\projects\bizprint\backend\src\[folder]\[file].ts

2. БАЙГАА ЗҮЙЛИЙГ ДАХИН БИЧИХГҮЙ — зөвхөн засна

3. ТААМАГЛАХГҮЙ — мэдэхгүй бол шалга

4. POWERSHELL ДҮРЭМ:
   - Файл бичих: [System.IO.File]::WriteAllText("path", , [System.Text.Encoding]::UTF8)
   - Template literal ХОРИОТОЙ: backtick ${...} ашиглахгүй
   - @keyframes: <style>{"@keyframes ..."}</style> гэж бич

5. АЛДАА ГАРВАЛ: яг тэр файлын тэр мөрийг шалга, таамаглахгүй

---

## TECH STACK

Frontend: Next.js 16 App Router, React, TypeScript
Backend:  NestJS, TypeScript, PostgreSQL, TypeORM
Servers:  Backend :4000 | Frontend :3000
OS:       Windows PowerShell

---

## FOLDER ЗАМУУД

Backend:  C:\Users\User\projects\bizprint\backend\src\
Frontend: C:\Users\User\projects\bizprint\frontend\
Admin UI: C:\Users\User\projects\bizprint\frontend\app\admin\

---

## BACKEND — БҮРЭН ФАЙЛ ЖАГСААЛТ

### Auth
auth/guards/jwt-auth.guard.ts     ← ЗӨВХӨН ЭНЭ ЗАМ (../auth/guards/jwt-auth.guard)
auth/auth.service.ts
auth/auth.controller.ts           POST /auth/login, /auth/register, GET /auth/me

### Admin
admin/admin.controller.ts         GET /admin/users, /vendors, /machines, /orders, /stats

### Core entities
users/user.entity.ts              id, email, password, role, wallet_balance, full_name
orders/entities/order.entity.ts   id, user, status, total_price, product_type, quantity
factories/factory.entity.ts       id, name, location, machines, rating, status
machines/machine.entity.ts        id, factory_id, type, max_sheet_size, speed_per_hour

### Products
products/product.entity.ts        id, name, name_mn, slug, category, base_price, min_quantity
categories/category.entity.ts     id, name, name_mn, slug, parent_id, color, icon, sort_order, is_active
product-attributes/product-attribute.entity.ts  id, product_id, name, type, options, unit, required
pricing-rules/pricing-rule.entity.ts            id, product_id, attribute_key, attribute_value, price_multiplier

### Banners — АНХААРАЛ: camelCase
banners/banner.entity.ts
  Fields: id, title, subtitle, imageUrl, link, isActive, order, createdAt
  БУРУУ: is_active, image_url, sort_order
  ЗӨВХӨН: isActive, imageUrl, order

### Settings
settings/settings.entity.ts       key, value
GET /settings | POST /settings/bulk | GET /settings/public

### Wallet (шинэ)
wallet/wallet.entity.ts           Wallet + WalletTransaction
wallet/wallet.service.ts          getBalance, credit, debit, getTransactions
GET /wallet/balance | GET /wallet/transactions | POST /wallet/withdraw

### AI / Quote
pricing/pricing.service.ts        POST /pricing/quote
quote/quote.service.ts            POST /quote/calculate
ai/full-quote/                    POST /ai/full-quote
upload/upload.controller.ts       POST /upload/file → { url, path }

---

## FRONTEND — БҮРЭН ФАЙЛ ЖАГСААЛТ

### Layout
app/layout.tsx                    Root layout, dark theme default
app/admin/layout.tsx              ← UNIFIED SIDEBAR (бүх admin хуудас энэнээс sidebar авна)

### Admin хуудсууд
app/admin/page.tsx                Dashboard — KPI, charts, recent orders
app/admin/users/page.tsx          Хэрэглэгчид — role filter, search, table
app/admin/orders/page.tsx         Захиалгууд — status filter, search, table
app/admin/vendors/page.tsx        Vendors — stat cards, table
app/admin/machines/page.tsx       Машинууд — type filter, stat cards, table
app/admin/products/page.tsx       Бүтээгдэхүүн — category filter, table
app/admin/banners/page.tsx        Баннерууд — file upload, toggle, edit modal
app/admin/cms/page.tsx            CMS тохиргоо — settings + banner tab
app/admin/categories/page.tsx     Ангилал — CRUD (дэд ангилал хийгдэх)
app/admin/payments/page.tsx       Payments
app/admin/reports/page.tsx        Reports
app/admin/settings/page.tsx       Тохиргоо
app/admin/pricing-rules/page.tsx  Үнийн матриц (хийгдэх)
app/admin/wallet-requests/page.tsx Wallet хүсэлт (хийгдэх)

### Public хуудсууд
app/page.tsx                      Нүүр хуудас — Vistaprint загвар, mega menu, product grid
app/login/page.tsx                Login — role-based redirect
app/register/page.tsx             Бүртгэл
app/quote/page.tsx                Үнэ тооцоолол
app/products/page.tsx             Бүтээгдэхүүн жагсаалт
app/shop/page.tsx                 Дэлгүүр
app/cart/page.tsx                 Сагс
app/checkout/page.tsx             Худалдан авалт

### Dashboard
app/dashboard/page.tsx            Default dashboard
app/dashboard/customer/page.tsx   Хэрэглэгч
app/dashboard/vendor/page.tsx     Үйлдвэр
app/dashboard/admin/page.tsx      Admin redirect
app/dashboard/wallet/page.tsx     Хэтэвч

### Components
components/nav/MegaNav.tsx        Мега меню — 4 section
components/auth/RoleSelector.tsx
components/ThemeToggle.tsx

---

## CSS СТАНДАРТ

### Admin (dark theme) — var() ашиглана
var(--bg)       = #0A0A0A    var(--surface)  = #0F0F0F
var(--surface2) = #141414    var(--border)   = #1A1A1A
var(--border2)  = #2A2A2A    var(--text)     = #F1F5F9
var(--text2)    = #888       var(--text3)    = #444
var(--text4)    = #2A2A2A

### Accent
Primary:  #FF6B35 (нүүр хуудас)
Admin:    #FF6B00 (admin)
Success:  #1D9E75
Danger:   #e24b4a
Info:     #378ADD
Font:     'DM Sans', 'Segoe UI', system-ui

### Admin хуудас бичих дүрэм
- layout.tsx sidebar өгнө — өөрийн sidebar/topbar НЭМЭХГҮЙ
- Эхлэл: padding:'28px 32px'
- Зөвхөн content бичнэ

---

## LOGIN REDIRECT

admin    → /admin
vendor   → /dashboard/vendor
customer → /dashboard/customer
designer → /dashboard
sales    → /dashboard/sales
courier  → /dashboard

---

## ХИЙГДСЭН ✅ vs ХИЙГДЭХ 📋

ХИЙГДСЭН:
✅ Admin layout, dashboard, users, orders, vendors, machines
✅ Admin products, banners (file upload), cms, payments, reports
✅ Нүүр хуудас — Vistaprint загвар, masonry grid, category filter
✅ MegaNav — mega dropdown menu
✅ Login role-based redirect
✅ Backend: wallet, category tree, product-attributes, pricing-rules entities

ХИЙГДЭХ (дараалалаар):
📋 1. Admin categories — дэд ангилал CRUD + параметр тодорхойлолт
📋 2. Admin pricing-rules — үнийн матриц UI
📋 3. Quote форм — ангилал бүрт өөр параметр
📋 4. Wallet UI — dashboard-д balance, татах
📋 5. Referral систем — борлуулагч линк, QR, комисс
📋 6. Дизайнер workflow
📋 7. Үйлдвэрийн dashboard
📋 8. Хүргэлтийн систем

---

## ШИНЭ ЧАТ ЭХЛЭХ ЗААВАР

Шинэ чатад ИНГЭж хэлээрэй:

"BizPrint хэвлэлийн платформ хөгжүүлж байна.
Энэ CONTEXT.md файлыг уншаад дараах ажлыг хий:
[ажлын нэр]

Эхлэхийн өмнө:
1. Холбогдох файлуудыг type командаар шалга
2. Байгаа зүйлийг дахин бичихгүй
3. Код бичихэд PowerShell @"..."@ ашигла, backtick template literal хориотой"

---

## ФАЙЛ ШАЛГАХ КОМАНДУУД

# Backend файл харах
type C:\Users\User\projects\bizprint\backend\src\[module]\[file].ts

# Frontend файл харах  
type C:\Users\User\projects\bizprint\frontend\app\[path]\page.tsx

# Backend алдаа харах
# Backend terminal-д харагдана

# Мөр шалгах
 = Get-Content "C:\...\file.tsx"
[N-3..N+3] | ForEach-Object { Write-Host  }

# Folder бүтэц
Get-ChildItem -Path "C:\...\src" -Recurse -Filter "*.ts" | Select-Object Name