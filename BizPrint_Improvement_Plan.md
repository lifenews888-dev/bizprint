# BizPrint — Сайжруулалтын Бүрэн Төлөвлөгөө

## Судалгааны Арга

Дэлхийн шилдэг Print MIS/Marketplace системүүдийг (PressWise, PrintPLANR, MarketDirect, Hexicom, Ordant, Wsc Printer, Optimus MIS, MARKET-X) судалж, BizPrint-ийн одоогийн 75 модуль, 141 entity, 128 хуудастай системтэй харьцуулсан.

---

## 1. Одоогийн Системийн Хүчтэй Талууд

BizPrint нь 21 хоногт 225 commit-ээр бүтээгдсэн маш хүчтэй суурьтай систем. Дэлхийн шилдэг Print MIS-үүдтэй харьцуулахад дараах давуу талтай:

| Модуль | BizPrint | Дэлхийн Print MIS |
|--------|----------|-------------------|
| AI интеграци (14 модуль) | ✅ Claude tool_use, Smart Quote, Prepress | ⚠️ Ихэнх нь AI-гүй эсвэл шинээр нэмж байгаа |
| Escrow төлбөр | ✅ Бүрэн хэрэгжсэн | ⚠️ Зөвхөн enterprise системд байдаг |
| Gang Run оптимизаци | ✅ Байгаа | ✅ PressWise-д байдаг |
| Imposition layout | ✅ Байгаа | ✅ Стандарт feature |
| 14 статус state machine | ✅ Бүрэн | ✅ PressWise 12, PrintPLANR 10 статус |
| Multi-vendor marketplace | ✅ Байгаа | ⚠️ Ихэнх нь нэг үйлдвэрт зориулсан |
| Realtime (6 WebSocket) | ✅ Хүчтэй | ❌ Ихэнх нь polling ашигладаг |
| Mobile apps (4 ширхэг) | ✅ Expo | ⚠️ Зөвхөн responsive web |

---

## 2. Дэлхийн Шилдэг Системүүдээс Суралцах Зүйлс

### 2.1 Print Estimator — Тооцооллын Гүнзгийрүүлэлт

**PressWise, PrintPLANR** системүүдийн хамгийн хүчтэй тал бол тооцооллын нарийвчлал. BizPrint-ийн SmartQuoteModule болон PrintCostModule-д дараах нэмэлтүүд хэрэгтэй:

**Санал 1: Материалын мэдээллийн сан (Material Database)**
```
Шинэ entity хэрэгтэй:
- PaperStock: нэр, хэмжээ, жин (gsm), үнэ/хуудас, нийлүүлэгч, нөөц
- InkProfile: CMYK/Pantone/UV, зарцуулалт тооцоо, үнэ/литр
- FinishingOption: нугалах, зүсэх, хавтаслах, уут хийх — тус бүрийн нэгж үнэ
- SubstrateType: vinyl, canvas, mesh, backlit — том хэлбэрт зориулсан
```

Яагаад: Одоо `PricingConfigModule` байгаа ч материалын бодит өгөгдөлтэй холбоогүй бол AI тооцоолол "таамаг" хэвээр байна. PrintPLANR-ийн хамгийн гол давуу тал нь бодит материалын өртгөөс тооцдог.

**Санал 2: Тооцооллын загвар (Estimation Templates)**
```
Бүтээгдэхүүний төрөл бүрт тусдаа тооцооллын загвар:
- Ном: хуудас тоо × цаас үнэ + хэвлэх зардал + хавтасны зардал + боловсруулалт
- Нэрийн хуудас: тираж × цаасны өртөг + хэвлэлт + зүсэлт + нугалалт (хэрэв байвал)
- Баннер: м² × материалын өртөг + хэвлэлт + хүрээ/суурь
- Хайрцаг: зүсмэл × материал + хэвлэлт + наалт + нугалалт
```

### 2.2 Production Board — Үйлдвэрлэлийн Самбар

**Hexicom, Wsc Printer** системүүдийн гол давуу тал нь visual production board. BizPrint-д `ProductionSchedulerModule` байгаа ч frontend дээр Kanban/Gantt board бүрэн хэрэгжсэн эсэхийг шалгах хэрэгтэй.

**Санал 3: Visual Production Board**
```
Frontend-д нэмэх:
- Kanban board: Хүлээгдэж буй → Prepress → Хэвлэж буй → Боловсруулалт → Хүргэлт
- Gantt chart: Машин бүрийн ачаалал, цаг хуваарилалт
- Capacity meter: Үйлдвэр бүрийн хүчин чадлын хувь (%, ачаалал)
- Drag-and-drop: Ажлыг машин хооронд шилжүүлэх
```

Яагаад: Wsc Printer-ийн CPO (Combined Production Optimization) модуль нь захиалгуудыг материал, хэмжээ, боловсруулалтаар бүлэглэж, lead time-г 30% бууруулдаг гэж мэдээлдэг.

### 2.3 Prepress Automation — Файл шалгалтын автоматжуулалт

**Санал 4: Automated Preflight Check**
```
PdfInspectorModule-д нэмэх:
1. Resolution check: 300 DPI-аас доош бол анхааруулга
2. Color mode: RGB → CMYK автомат хөрвүүлэх санал
3. Bleed check: trim + bleed (3mm) байгаа эсэх
4. Font embedding: embed хийгдээгүй font байвал анхааруулга
5. Overprint/Transparency: flatten шаардлагатай эсэх
6. File format validation: PDF/X-1a, PDF/X-4 нийцэл
```

Яагаад: PressWise-ийн хамгийн их цаг хэмнэдэг feature нь auto-preflight. Захиалагч файл байршуулмагц автомат шалгаж, асуудал байвал шууд мэдэгдэл илгээдэг.

### 2.4 Vendor Comparison — Үйлдвэрүүдийг харьцуулах

**Санал 5: Smart Vendor Matching**
```
Захиалагч нэг захиалга өгөхөд:
1. Бүх чадвартай үйлдвэрүүдээс автомат үнийн санал авах
2. Хүргэх хугацаа, чанарын үнэлгээ, үнэ гэсэн 3 шалгуураар эрэмблэх
3. AI-аар хамгийн тохиромжтой үйлдвэрийг санал болгох
4. Захиалагч харьцуулж сонгох (side-by-side comparison UI)
```

Яагаад: MARKET-X (manroland Goss) систем нь олон нийлүүлэгчийг харьцуулах боломжоор marketplace давуу талаа бий болгосон.

### 2.5 Quality Assurance — Чанарын хяналт

**Санал 6: QA Checkpoint System**
```
Шинэ entity/модуль:
- QaCheckpoint: захиалга бүрийн шалгалтын цэг
- PrintPassport: хэвлэлийн бүтээгдэхүүний "паспорт" — материал, тохиргоо, шалгалтын бүртгэл
- NonConformanceLog: алдаа, гэмтлийн бүртгэл
- Operator sign-off: ажилтан бүрийн баталгаажуулалт
```

Яагаад: Wsc Printer-ийн QA модуль нь хэвлэлийн алдааг 40% бууруулсан гэж мэдээлдэг. Хэвлэлийн салбарт чанарын хяналт нь ROI хамгийн өндөр feature.

---

## 3. Одоогийн Модулиудыг Сайжруулах Санал

### 3.1 OrdersModule — Захиалгын сайжруулалт

**Санал 7: Auto Job Ticket Generation**
```
Захиалга баталгаажсан даруйд автомат job ticket үүсгэх:
- Хэвлэлийн тохиргоо (цаас, өнгө, хэмжээ, тираж)
- Машины хуваарилалт (MachineSelectorModule-тай холбох)
- Боловсруулалтын алхмууд (FinishingOption-тай холбох)
- Хүргэлтийн мэдээлэл
- QR код (ажилтан scan хийх)
```

### 3.2 QuoteModule — Үнийн саналыг хурдасгах

**Санал 8: Instant Quote Widget**
```
Захиалагч сайт дээр шууд:
1. Бүтээгдэхүүн сонгох (ном, нэрийн хуудас, баннер...)
2. Тохиргоо сонгох (хэмжээ, цаас, тираж, өнгө)
3. Шууд үнийн тооцоолол харах (Smart Quote + Material DB)
4. "Захиалах" дарахад checkout руу шилжих
```

Яагаад: MarketDirect Platform-ийн хамгийн их conversion авдаг feature нь instant quote. Хэрэглэгч 10 секундэд үнэ харж чаддаг.

### 3.3 GangRunModule — Оптимизацийг бодитоор ашиглах

**Санал 9: Gang Run Dashboard**
```
Админ/Үйлдвэрийн dashboard-д:
- Хүлээгдэж буй захиалгуудыг ижил материал, хэмжээгээр бүлэглэх
- Нэгтгэх боломжтой захиалгуудыг visual-аар харуулах
- Хэмнэлтийн тооцоо: тусдаа хийвэл X₮, нэгтгэвэл Y₮, хэмнэлт Z₮
- Нэг товч дарж gang run batch үүсгэх
```

### 3.4 AnalyticsModule — Хэвлэлийн шинжилгээ

**Санал 10: Print-specific KPIs**
```
Стандарт аналитикаас гадна хэвлэлд зориулсан:
- Waste rate: Цаасны хаягдлын хувь (%)
- Machine utilization: Машин бүрийн ашиглалт (%)
- On-time delivery rate: Хугацаандаа хүргэсэн хувь
- Reprint rate: Дахин хэвлэсэн хувь (чанарын асуудал)
- Cost per impression: Нэгж хэвлэлийн өртөг
- Quote-to-order conversion: Үнийн саналаас захиалга болсон хувь
- Average turnaround time: Дундаж гүйцэтгэлийн хугацаа
```

---

## 4. Шинээр Нэмэх Модулиудын Санал

### 4.1 WarehouseModule — Агуулахын удирдлага

**Санал 11: Print Warehouse Management**
```
PrintPLANR-ийн загвараар:
- Цаасны нөөц: төрөл, хэмжээ, gsm, тоо ширхэг, дуусах огноо
- Бэхний нөөц: төрөл, өнгө, литр, сүүлд нэмсэн огноо
- Auto reorder: Тодорхой түвшинд хүрэхэд автомат захиалга
- Supplier integration: Нийлүүлэгчдэд автомат PO илгээх
- Cost tracking: Материал бүрийн зарцуулалтын түүх
```

### 4.2 ProofingModule — Баталгаажуулалтын систем

**Санал 12: Online Proofing System**
```
Захиалагч дэлгэцэн дээрээ:
1. Хэвлэлийн preview (PDF viewer + annotation)
2. Тайлбар нэмэх (зураг дээр comment)
3. Батлах / Буцаах товч
4. Version history (v1, v2, v3...)
5. Signature/approval timestamp
```

Яагаад: Ordant MIS-ийн судалгаагаар файл батлах хугацаа удаах тусам захиалга цуцлагдах магадлал нэмэгддэг. Online proofing нь turnaround-г 50%+ хурдасгадаг.

### 4.3 MaintenanceModule — Машины засвар үйлчилгээ

**Санал 13: Machine Maintenance Tracker**
```
Үйлдвэрийн машин бүрт:
- Preventive maintenance schedule (хуваарьт засвар)
- Downtime tracking (зогсолтын бүртгэл)
- Parts inventory (сэлбэг хэрэгслийн нөөц)
- Alert system (засвар хийх цаг болсон мэдэгдэл)
```

### 4.4 B2B Portal — Байнгын захиалагчдад зориулсан

**Санал 14: Dedicated B2B Client Portal**
```
Байнгын B2B захиалагчдад:
- Тусгай үнийн жагсаалт (negotiated pricing)
- Захиалгын загвар хадгалах (repeat order templates)
- Approval workflow (компани дотоод батлах процесс)
- Budget tracking (төсвийн хяналт)
- Sub-accounts (ажилтнуудад тусдаа эрх)
```

Яагаад: MARKET-X (manroland) системийн B2B portal нь company account + approval process + sub-account-ыг нэгтгэсэн нь enterprise захиалагчдыг татах гол давуу тал.

---

## 5. Тэргүүлэх Дарааллын Санал

### Шат 1: Шууд нөлөөтэй (1-2 долоо хоног)

| # | Санал | Нөлөө | Хүчин чармайлт |
|---|-------|--------|----------------|
| 8 | Instant Quote Widget | Маш өндөр — conversion нэмэгдэнэ | Дунд — SmartQuote + frontend |
| 4 | Automated Preflight | Өндөр — prepress цаг хэмнэнэ | Бага — PdfInspector өргөтгөл |
| 7 | Auto Job Ticket | Өндөр — гар ажиллагаа багасна | Бага — Orders + Machine холбох |
| 10 | Print KPIs | Дунд — шийдвэр гаргалтыг сайжруулна | Бага — Analytics өргөтгөл |

### Шат 2: Өрсөлдөх давуу тал (3-4 долоо хоног)

| # | Санал | Нөлөө | Хүчин чармайлт |
|---|-------|--------|----------------|
| 1 | Material Database | Маш өндөр — тооцооллын нарийвчлал | Дунд — шинэ entities + seed |
| 3 | Visual Production Board | Өндөр — үйлдвэрийн UX | Дунд — Kanban + Gantt UI |
| 5 | Smart Vendor Matching | Маш өндөр — marketplace давуу тал | Дунд — AI + comparison UI |
| 9 | Gang Run Dashboard | Өндөр — зардал хэмнэлт | Бага — frontend visualization |

### Шат 3: Enterprise feature (5-8 долоо хоног)

| # | Санал | Нөлөө | Хүчин чармайлт |
|---|-------|--------|----------------|
| 6 | QA Checkpoint | Өндөр — чанар сайжрана | Дунд — шинэ модуль |
| 11 | Warehouse Management | Өндөр — нөөц хяналт | Их — бүрэн шинэ модуль |
| 12 | Online Proofing | Маш өндөр — turnaround хурдасна | Их — PDF viewer + annotation |
| 14 | B2B Portal | Маш өндөр — enterprise retention | Их — бүрэн шинэ portal |

---

## 6. Техникийн Санал

### 6.1 Backend (NestJS) — нэмэх entities

```typescript
// Материалын бааз
@Entity() class PaperStock {
  id, name, size, weight_gsm, price_per_sheet, supplier, stock_qty, reorder_level
}

@Entity() class InkProfile {
  id, type (CMYK/Pantone/UV), coverage_rate, price_per_liter, supplier
}

@Entity() class FinishingOption {
  id, name, type (fold/cut/bind/laminate), unit_price, setup_cost, time_per_unit
}

// Чанарын хяналт
@Entity() class QaCheckpoint {
  id, orderId, stage, checkedBy, status, notes, photos, timestamp
}

@Entity() class PrintPassport {
  id, orderId, paper, ink, machine, settings, qaChecks[], finalApproval
}

// Агуулах
@Entity() class InventoryTransaction {
  id, materialId, type (in/out), qty, reason, orderId?, timestamp
}
```

### 6.2 Frontend (Next.js) — нэмэх хуудсууд

```
/quote/instant          — Instant quote calculator (public)
/dashboard/factory/production-board  — Kanban + Gantt
/dashboard/factory/inventory         — Материалын нөөц
/dashboard/factory/qa               — Чанарын хяналт
/dashboard/customer/proofing/[id]   — Online proof review
/admin/materials                    — Материалын бааз удирдлага
/admin/vendor-comparison            — Үйлдвэр харьцуулалт
/admin/gang-run                     — Gang run dashboard
```

### 6.3 AI сайжруулалт

```
AgentModule-д нэмэх tool-ууд:
- suggest_vendor: Захиалгын параметрээр хамгийн тохиромжтой үйлдвэр санал болгох
- estimate_cost: Материалын DB-тэй холбож бодит үнэ тооцоох
- optimize_production: Олон захиалгыг gang run-д нэгтгэх санал
- predict_delivery: Хүргэлтийн хугацаа таамаглах
- quality_alert: Чанарын асуудал илрүүлэх (reprint rate trend)
```

---

## 7. Дүгнэлт

BizPrint нь дэлхийн шилдэг Print MIS системүүдтэй харьцуулахад **AI интеграци, realtime, escrow** талаараа давуу. Гэхдээ хэвлэлийн салбарын **материалын нарийвчилсан тооцоолол, visual production board, QA систем, online proofing** зэрэг салбарын онцлог feature-үүдийг нэмснээр бүрэн enterprise-grade Print MIS + Marketplace болох боломжтой.

**Хамгийн өндөр нөлөөтэй 3 санал:**
1. **Instant Quote Widget** — захиалагч татах conversion
2. **Material Database + Smart Vendor Matching** — marketplace давуу тал
3. **Automated Preflight + Online Proofing** — turnaround хурдасгах
