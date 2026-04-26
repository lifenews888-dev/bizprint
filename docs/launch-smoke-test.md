# BizPrint — Launch Smoke Test шалгах хуудас

> Эхлээд production хүртэл deploy хийсний дараа доорх жагсаалтыг **гар** болон **гар утас** дээр алхам алхмаар шалгана.
> Бүх хэсэг ✅ болсон үед "Launch pass" гэж тооцно.

**Production URL:** https://frontend-biz6.vercel.app
**Гол утас:** 72000444

---

## 1. 🌐 Public хуудсууд

### 1.1 Нүүр хуудас (`/`)
- [ ] Hero гарчиг "Хэвлэлийн бүх төрлийн захиалгыг нэг дороос" эсвэл CMS-ийн утга харагдана
- [ ] Hero subtitle уншигдахуйц байна (мобайл болон desktop)
- [ ] Trust line "24-48 цагийн гүйцэтгэл · Дизайн + хэвлэл + хүргэлт · Байгууллагын захиалга" харагдана
- [ ] Гурван quick path линк (Файлтай → /quick-order, Файлгүй → /quote, Яаралтай → tel:72000444) ажиллана
- [ ] CTA "Захиалга өгөх" товч `/quote` руу очно
- [ ] CTA "72000444 руу залгах" утас руу залгана (мобайл дээр)
- [ ] Hero slide-ууд (CMS) ачаалагдаж байна (зураг/видео ээлжилнэ)
- [ ] "Үйлчилгээ" grid — 4 карт зөв линктэй (Хэвлэл/Дизайн/Байгууллагын/Яаралтай)
- [ ] "Хэвлэлийн үнэ мэдэх" + InstantQuoteWidget харагдана
- [ ] Бүтээгдэхүүний tab/carousel ачаалагдана (хэрэв категори байгаа бол)
- [ ] "Хэрхэн ажилладаг вэ" — 4 алхам зөв текст
- [ ] "Яагаад Bizprint?" trust grid — 6 карт
- [ ] Bottom CTA "Захиалга өгөх / 72000444 / Бөөн захиалга" ажиллана
- [ ] Хэрэглэгчдийн сэтгэгдэл хэсэг харагдана
- [ ] Footer + MegaNav зөв линктэй

### 1.2 Метадата + SEO
- [ ] Browser tab дээр сайтын title зөв ("Bizprint.mn — Хэвлэлийн үйлчилгээ ...")
- [ ] View source-д `<meta name="description">` бөглөгдсөн
- [ ] OpenGraph (`og:title`, `og:description`, `og:locale=mn_MN`, `og:siteName`) бөглөгдсөн
- [ ] Twitter card (`twitter:card=summary_large_image`) бөглөгдсөн
- [ ] Favicon CMS-ээс зөв ачаалагдсан
- [ ] `/sitemap.xml` буцаах
- [ ] `/robots.txt` буцаах

### 1.3 Бусад public хуудсууд
- [ ] `/shop` — бүтээгдэхүүний жагсаалт ачаалагдана
- [ ] `/shop/[id]` — нэг бүтээгдэхүүний дэлгэрэнгүй
- [ ] `/quote` — үнийн санал форм
- [ ] `/smart-quote` — AI quote
- [ ] `/quick-order` — файл upload форм
- [ ] `/campaign/request` — байгууллагын захиалга
- [ ] `/contact` — холбоо барих
- [ ] `/about` — бидний тухай
- [ ] `/login` — нэвтрэх форм + "Нууц үг мартсан?" линк
- [ ] `/register` — 3-step бүртгэлийн форм
- [ ] `/forgot-password`, `/reset-password` — нууц үг сэргээх флоу

---

## 2. 📱 Mobile sticky CTA

### 2.1 Үзэгдэц
- [ ] Гар утсан дээр (md breakpoint-оос доош) доод буланд 3 товчтой sticky bar харагдана
- [ ] Desktop дээр (md+) **харагдахгүй**
- [ ] Safe-area inset (iPhone home indicator) дээр зөв бөглөгдсөн
- [ ] Body доор padding бий — content sticky bar-аар халхлагдахгүй

### 2.2 Hide logic шалгах
- [ ] `/admin/*`, `/dashboard/*`, `/login`, `/register`, `/checkout`, `/design/editor`, `/creator/*`, `/designer/*`, `/courier/*`, `/sales/*`, `/factory/*`, `/mobile/*` хуудсуудад харагдахгүй

### 2.3 Үйлдэл + tracking
- [ ] **Залгах** → `tel:72000444` нээгдэж залгах хүсэлт гарна
- [ ] **Чатаар** → `/quick-order` руу очно
- [ ] **Үнэ авах** → `/quote` руу очно
- [ ] DevTools Network/Console дээр GA `gtag('event', 'cta_call_click', ...)` дуудагдсан
- [ ] Facebook Pixel `fbq('trackCustom', 'cta_call_click', ...)` дуудагдсан (хэрэв Pixel суусан бол)
- [ ] `cta_chat_click`, `cta_quote_click` events ажилладаг
- [ ] GA / Pixel суугаагүй ч JS алдаа гарахгүй (analytics helper аюулгүй)

---

## 3. 🛒 Захиалгын флоу

### 3.1 Зочин (хэрэглэгч нэвтэрсэнгүй)
- [ ] Бүтээгдэхүүн нэмэх — сагсанд нэмэгдэнэ (localStorage)
- [ ] Сагсны хуудас (`/cart`) ачаалагдана
- [ ] Checkout эхлэхэд login руу хүсэлт гарна

### 3.2 Бүртгэлтэй хэрэглэгч
- [ ] Login хийх (`superadmin@bizprint.mn` / `Admin@2026` эсвэл өөр test account)
- [ ] Сагсанд бүтээгдэхүүн нэмэх
- [ ] `/cart/quote` — quote үүсгэх
- [ ] `/cart/quote/confirm` — захиалга үүсгэх
- [ ] Захиалга `DRAFT` → `QUOTATION_SENT` → `CONFIRMED` рүү шилжих
- [ ] Confirm-ийн дараа хэрэглэгчид notification ирэх (Socket.IO эсвэл email)
- [ ] Файл upload (PDF) хэвийн ажиллана (`/quick-order` эсвэл `pending_file` order)

### 3.3 Add-on (Дагалдах) бүтээгдэхүүн
- [ ] Бүтээгдэхүүний хуудаст "🔗 Хамт авах уу?" хэсэг харагдана (хэрэв admin холбосон бол)
- [ ] Add-on checkbox сонгож сагсанд нэмэгдэх

---

## 4. 👤 Customer Dashboard

### 4.1 `/dashboard/customer/home`
- [ ] Хэрэглэгчийн нэр + role харагдана
- [ ] Сүүлийн захиалгууд харагдана
- [ ] VerificationBanner — хэрэв `verification_status !== 'verified'` бол шар/цэнхэр banner

### 4.2 `/dashboard/customer/orders`
- [ ] Захиалгын жагсаалт ачаалагдана
- [ ] Нэг захиалгыг нээхэд OrderStepper харагдана
- [ ] PDF татах товч ажиллана
- [ ] `pending_file` төлөвт "Файл оруулах" товч `/dashboard/customer/orders/{id}/upload` руу очно
- [ ] "💬 Чат" → `/dashboard/customer/chat`
- [ ] "⭐ Үнэлгээ" товч (delivered/completed үед) харагдана

### 4.3 `/dashboard/customer/invoices`
- [ ] Нэхэмжлэлийн жагсаалт ачаалагдана
- [ ] Stats grid (Төлөгдсөн, Хүлээгдэж буй, Нийт дүн) зөв тоонуудтай
- [ ] Нэг нэхэмжлэлийг нээхэд дэлгэрэнгүй харагдана
- [ ] Paid badge (зөвхөн `status === 'paid'` үед)
- [ ] Payment Status Timeline (paid → held → released) харагдана (хэрэв history байгаа бол)
- [ ] PaymentTimeline (Escrow History) доод хэсэгт харагдана

### 4.4 `/dashboard/customer/cart`
- [ ] Сагсанд байгаа item-уудыг харуулна
- [ ] Тоо ширхэг өөрчлөх / устгах ажиллана
- [ ] `useRoleGuard(['customer'])` зөвхөн customer role-д нээгдэнэ

### 4.5 `/dashboard/customer/design/[id]`
- [ ] Дизайн хүсэлтийн мэдээлэл харагдана
- [ ] Хувилбар (version) сэргээх товч `showToast('...', 'success')` toast харуулна
- [ ] Comment thread, Zoom уулзалт ажиллана

---

## 5. ⚙️ Admin Orders

### 5.1 `/admin/orders`
- [ ] Захиалгын жагсаалт ачаалагдана (бүх төлөв)
- [ ] Хайлт `search` ажиллана
- [ ] Захиалга нээх — дэлгэрэнгүй modal/panel
- [ ] Төлөв шилжүүлэх (DRAFT → CONFIRMED → IN_PRODUCTION → ... → COMPLETED)
- [ ] CSV/Excel export товч CSV файл татна
- [ ] PDF invoice download ажиллана
- [ ] File-review хэсэгт upload-сан файл харагдах
- [ ] Order timeline / status history бүртгэгдэнэ

### 5.2 Бусад admin хуудсууд (sanity check)
- [ ] `/admin/users` — KYC verification (pending → verified) toggle ажиллана
- [ ] `/admin/products` — бүтээгдэхүүн үүсгэх + add-on холбох
- [ ] `/admin/cms` — settings (phone, hero_title) хадгалагдана + reload-ийн дараа үлдэнэ
- [ ] `/admin/gallery` — Cloudinary upload ажиллана (`ml_default` Unsigned)
- [ ] `/admin/print-calculator` — өнгө/ашиг тохиргоо хадгалагдана

---

## 6. 📊 Analytics

### 6.1 Google Analytics (gtag)
- [ ] `NEXT_PUBLIC_GA_ID` тохируулсан үед `<script>` ачаалагдана
- [ ] DevTools Network → `collect?...&en=cta_call_click` request явсан
- [ ] DevTools Console → `dataLayer` дээр event push-сэн

### 6.2 Facebook Pixel (fbq)
- [ ] FacebookPixel компонент ачаалагдана
- [ ] `fbq('init', PIXEL_ID)` хийгдсэн
- [ ] `trackCustom` event Network дээр харагдана (`facebook.com/tr/...`)

### 6.3 UTM tracking
- [ ] `?utm_source=fb&utm_medium=ad&utm_campaign=launch` параметртэй URL-аар орж ирэхэд UTMTracker capture хийнэ
- [ ] localStorage-д `utm_*` түр хадгалагдана

### 6.4 Tracking events checklist
| Event | Trigger | Файл |
|---|---|---|
| `cta_call_click` | Mobile sticky bar — Залгах | `MobileStickyCTA.tsx` |
| `cta_chat_click` | Mobile sticky bar — Чатаар | `MobileStickyCTA.tsx` |
| `cta_quote_click` | Mobile sticky bar — Үнэ авах | `MobileStickyCTA.tsx` |
| `hero_quickpath_with_file` | Hero — Файлтай бол | `app/page.tsx` |
| `hero_quickpath_no_file` | Hero — Файлгүй бол | `app/page.tsx` |
| `hero_quickpath_urgent` | Hero — Яаралтай бол | `app/page.tsx` |

---

## 7. 🚀 Launch Pass Criteria

### Заавал ✅ байх ёстой:
- [ ] Нүүр хуудас 5с-ээс бага хугацаанд ачаалагдана (3G mobile дээр <8с)
- [ ] Mobile sticky CTA 3 товч бүгд ажиллана
- [ ] `tel:72000444` залгалт ажиллана (iOS + Android)
- [ ] Login + Register бүрэн ажиллана
- [ ] `/quote`, `/quick-order`, `/shop` хуудсууд crash-гүй
- [ ] Захиалгын сагс → quote → confirm флоу end-to-end ажиллана
- [ ] Admin захиалга төлөв шилжүүлэх ажиллана
- [ ] CMS settings (phone, hero) хадгалагдаад server restart-ийн дараа үлдэнэ
- [ ] Vercel build амжилттай (165+ pages)
- [ ] Console-д runtime error байхгүй (404 image байж болно)
- [ ] Lighthouse Mobile Performance ≥70 (target ≥85)

### Хүсэхгүй (warning):
- [ ] Console.error байж болно (intentional logging)
- [ ] Lint warning байж болно (2000+ pre-existing, блоклосонгүй)

### Pass-ийн дараа:
- [ ] PostHog/GA dashboard-д events харагдсан эсэхийг 24 цагийн дараа шалгах
- [ ] Эхний 10 захиалгын сэтгэгдэл, friction шалгах
- [ ] Vercel Web Vitals дээр LCP/CLS/INP green байгаа эсэх

---

**Шалгасан огноо:** _______________
**Шалгасан хүн:** _______________
**Pass / Fail:** _______________
**Тэмдэглэл:** _______________
