# BizPrint — Frontend Бүтэц (Бүрэн)

## 📁 Файлын бүтэц

```
app/
├── layout.tsx              ← Root layout (MegaNav, Footer, ChatWidget, AnnouncementBar)
├── page.tsx                ← Нүүр хуудас (Баннер слайдер, Features, CTA)
├── globals.css             ← CSS variables, responsive utilities
│
├── login/page.tsx          ← Нэвтрэх
├── register/page.tsx       ← Бүртгүүлэх
├── shop/page.tsx           ← Дэлгүүр (бүтээгдэхүүний жагсаалт)
├── cart/page.tsx           ← Сагс
├── checkout/page.tsx       ← Захиалга баталгаажуулах
├── quote/page.tsx          ← AI Үнийн санал
├── order/page.tsx          ← Захиалгын төлөв
├── partner/page.tsx        ← Партнер бүртгэл
├── factory/page.tsx        ← Үйлдвэрүүд
├── designer/page.tsx       ← Дизайнер dashboard
├── courier/page.tsx        ← Курьер dashboard
├── sales/page.tsx          ← Борлуулалт dashboard
│
├── admin/
│   ├── layout.tsx          ← Admin sidebar layout (бүх admin хуудсуудыг wrap хийнэ)
│   ├── page.tsx            ← Admin Dashboard (stats, quick links, orders)
│   ├── banners/page.tsx    ← Баннер CRUD + зураг upload
│   ├── pages/page.tsx      ← Статик хуудас CRUD
│   ├── menus/page.tsx      ← Цэс CRUD
│   ├── categories/page.tsx ← Ангилал CRUD
│   ├── settings/page.tsx   ← Тохиргоо (key-value)
│   ├── orders/page.tsx     ← Захиалга удирдлага + status update
│   ├── users/page.tsx      ← Хэрэглэгч CRUD + role
│   ├── products/page.tsx   ← Бүтээгдэхүүн CRUD
│   ├── vendors/page.tsx    ← Vendor CRUD
│   ├── commission/page.tsx ← Комисс удирдлага
│   ├── chat/page.tsx       ← Админ чат
│   ├── wallet-requests/    ← Wallet хүсэлтүүд
│   ├── pricing-rules/      ← Үнийн дүрэм
│   ├── workflow/page.tsx   ← Үйлдвэрлэл + хүргэлт
│   ├── machines/page.tsx   ← Тоног төхөөрөмж
│   ├── marketing/page.tsx  ← Маркетинг
│   └── reports/page.tsx    ← Тайлан
│
├── dashboard/
│   ├── page.tsx            ← Хэрэглэгчийн dashboard
│   ├── vendor/page.tsx     ← Vendor dashboard
│   ├── delivery/page.tsx   ← Хүргэлт tracking
│   ├── factory/page.tsx    ← Үйлдвэрийн dashboard
│   ├── orders/page.tsx     ← Миний захиалгууд
│   └── customer/
│       ├── wallet/page.tsx ← Хэтэвч
│       └── quotes/page.tsx ← Миний үнийн санал
│
└── vendor/store/page.tsx   ← Vendor дэлгүүр

components/
├── nav/MegaNav.tsx         ← Mega навигаци
├── layouts/DashboardLayout.tsx ← Dashboard sidebar layout
├── AnnouncementBar.tsx     ← Зарлалын мөр
├── Footer.tsx              ← Footer
├── ChatWidget.tsx          ← Floating чат
├── ChatBox.tsx             ← Чат бүрэн
├── NotificationBell.tsx    ← Мэдэгдэл
├── ThemeToggle.tsx         ← Dark/Light toggle
└── DeliveryTab.tsx         ← Хүргэлтийн tab

hooks/
└── useChat.ts              ← WebSocket чат hook
```

## 🔧 Суулгах заавар

### 1. Файлуудыг хуулах
frontend фолдер дотор энэ ZIP-ийн файлуудыг хуулна:
- `app/` фолдерыг бүтнээр солино
- `components/` фолдерыг бүтнээр солино
- `hooks/` фолдерыг бүтнээр солино

### 2. Backend ажиллуулах
```powershell
cd C:\Users\User\projects\bizprint\backend
npm run start:dev
```

### 3. Frontend ажиллуулах
```powershell
cd C:\Users\User\projects\bizprint\frontend
npm run dev
```

### 4. Нэвтрэх
```
Email: test@bizprint.mn
Password: Test1234!
```

## 🎨 Дизайн систем

- Брэнд өнгө: `#FF6B00` (orange)
- Dark theme: `--bg: #0A0A0A`, `--surface: #0F0F0F`
- Light theme: `--bg: #F5F5F0`, `--surface: #FFFFFF`
- Font: DM Sans, Segoe UI, system-ui

## 📌 API Endpoints (Backend)

| Endpoint | Тайлбар |
|----------|---------|
| POST /auth/login | Нэвтрэх |
| POST /auth/register | Бүртгүүлэх |
| GET/POST/PATCH/DELETE /banners | Баннер CRUD |
| GET/POST/PATCH/DELETE /pages | Хуудас CRUD |
| GET/POST/PATCH/DELETE /menus | Цэс CRUD |
| GET/POST/PATCH/DELETE /categories | Ангилал CRUD |
| GET/POST/PATCH/DELETE /settings | Тохиргоо CRUD |
| GET /settings/public | Public тохиргоо |
| GET/POST/PATCH/DELETE /products | Бүтээгдэхүүн CRUD |
| GET/POST/PATCH/DELETE /orders | Захиалга CRUD |
| GET /admin/users | Хэрэглэгч жагсаалт |
| GET /admin/vendors | Vendor жагсаалт |
| POST /upload/file | Файл upload |
| GET /production-jobs | Үйлдвэрлэлийн ажлууд |

## ⚠️ Анхааруулга

- `imageUrl` (camelCase) ашиглана, `image_url` биш
- `isActive` (camelCase) ашиглана, `is_active` биш
- Token авах: `localStorage.getItem('token')`
- Banner upload: FormData ашиглан /upload/file руу POST хийнэ
