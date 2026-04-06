// ============================================================
// БАЙРШУУЛАХ ЗААВАР — Claude Code terminal дээр ажиллуул
// ============================================================

// ── 1. ФАЙЛУУДЫГ ЗӨВ БАЙРШИЛД ХУУЛАХ ──────────────────────

/*
backend/src/materials/
  ├── entities/
  │   ├── paper-stock.entity.ts       ← paper-stock.entity.ts
  │   ├── ink-profile.entity.ts       ← ink-profile.entity.ts
  │   └── finishing-option.entity.ts  ← finishing-option.entity.ts
  ├── materials.service.ts            ← materials.service.ts (дээрх файлаас service хэсэг)
  ├── materials.controller.ts         ← materials.controller.ts
  └── materials.module.ts             ← materials.module.ts

backend/src/qa/
  ├── entities/
  │   ├── qa-checkpoint.entity.ts
  │   ├── print-passport.entity.ts
  │   └── non-conformance-log.entity.ts
  ├── qa.service.ts
  ├── qa.controller.ts
  └── qa.module.ts

backend/src/warehouse/
  ├── entities/
  │   └── inventory-transaction.entity.ts
  ├── warehouse.service.ts
  ├── warehouse.controller.ts
  └── warehouse.module.ts

backend/src/b2b/
  ├── entities/
  │   ├── b2b-company.entity.ts
  │   ├── b2b-member.entity.ts
  │   └── b2b-approval-flow.entity.ts
  ├── b2b.service.ts
  ├── b2b.controller.ts
  └── b2b.module.ts

frontend/src/app/quote/instant/
  └── page.tsx                        ← instant-quote-page.tsx

frontend/src/app/dashboard/factory/production-board/
  └── page.tsx                        ← production-board-page.tsx

frontend/src/app/dashboard/factory/warehouse/
  └── page.tsx                        ← warehouse-page.tsx
*/


// ── 2. APP.MODULE.TS-Д НЭМЭХ ───────────────────────────────
/*
backend/src/app.module.ts-д imports массивт нэмэх:

import { MaterialsModule } from './materials/materials.module';
import { QaModule } from './qa/qa.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { B2BModule } from './b2b/b2b.module';

@Module({
  imports: [
    // ... байгаа module-үүд ...
    MaterialsModule,
    QaModule,
    WarehouseModule,
    B2BModule,
  ],
})
*/


// ── 3. SMART QUOTE-Д MATERIAL SERVICE ХОЛБОХ ───────────────
/*
backend/src/ai/smart-quote/smart-quote.module.ts-д нэмэх:

import { MaterialsModule } from '../../materials/materials.module';

@Module({
  imports: [..., MaterialsModule],
})

backend/src/ai/smart-quote/smart-quote.service.ts-д нэмэх:

constructor(
  // байгаа dependencies...
  private materialsService: MaterialsService,
) {}

async calculateWithMaterials(specs: any) {
  const cost = await this.materialsService.calcMaterialCost({
    paperStockId: specs.paperStockId,
    inkProfileId: specs.inkProfileId,
    finishingOptionIds: specs.finishing ?? [],
    quantity: specs.quantity,
    widthMm: specs.widthMm,
    heightMm: specs.heightMm,
    colorMode: specs.colorMode,
  });
  return cost;
}
*/


// ── 4. QUOTE API ROUTE НЭМЭХ (frontend/src/app/api/quote/instant/route.ts) ──
export const quoteInstantRoute = `
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/quote/instant\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
`;


// ── 5. BACKEND QUOTE/INSTANT ENDPOINT ──────────────────────
export const quoteInstantEndpoint = `
// backend/src/quote/quote.controller.ts-д нэмэх

@Post('instant')
async instantQuote(@Body() dto: {
  productType: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
  colorMode: string;
  finishing: string[];
}) {
  // 1. Default paper stock олох (productType-р)
  const paperDefaults: Record<string, { size: string; gsm: number }> = {
    vizit_kart: { size: 'A4', gsm: 300 },
    flyar:      { size: 'A4', gsm: 130 },
    broushur:   { size: 'A4', gsm: 170 },
    poster:     { size: 'A4', gsm: 170 },
    banner:     { size: 'custom', gsm: 510 },
    sticker:    { size: 'A4', gsm: 130 },
    nom:        { size: 'A4', gsm: 80 },
  };

  const def = paperDefaults[dto.productType] ?? { size: 'A4', gsm: 130 };
  const paper = await this.materialsService.findPaperBySpec(def.size, def.gsm);
  const ink = (await this.materialsService.findAllInk())[0];

  if (!paper || !ink) {
    // Fallback: materials seed хийгдээгүй
    const base = dto.quantity * 50; // энгийн fallback
    return { total: base, unitPrice: 50, breakdown: { paper: base * 0.4, ink: base * 0.4, finishing: 0, platform: base * 0.1 }, leadDays: 3 };
  }

  const cost = await this.materialsService.calcMaterialCost({
    paperStockId: paper.id,
    inkProfileId: ink.id,
    finishingOptionIds: dto.finishing,
    quantity: dto.quantity,
    widthMm: dto.widthMm,
    heightMm: dto.heightMm,
    colorMode: dto.colorMode as any,
  });

  const platform = cost.subtotal * 0.05;
  const total = cost.subtotal + platform;

  return {
    total: Math.round(total),
    unitPrice: Math.round(total / dto.quantity),
    breakdown: {
      paper: Math.round(cost.paperCost),
      ink: Math.round(cost.inkCost),
      finishing: Math.round(cost.finishingCost),
      platform: Math.round(platform),
    },
    leadDays: dto.quantity <= 500 ? 2 : dto.quantity <= 2000 ? 3 : 5,
  };
}
`;


// ── 6. SEED RUN ─────────────────────────────────────────────
/*
Backend эхлэхэд автомат seed хийхийн тулд app.service.ts-д нэмэх:

async onApplicationBootstrap() {
  await this.materialsService.seedDefaults();
}

Эсвэл endpoint-р:
POST /api/materials/seed  (admin токентой)
*/


// ── 7. FRONTEND NAVIGATION-Д НЭМЭХ ────────────────────────
/*
Navbar эсвэл sidebar-д:

Customer:
  href="/quote/instant"  → "Үнэ тооцоолох"

Factory dashboard:
  href="/dashboard/factory/production-board"  → "Үйлдвэрлэлийн самбар"
  href="/dashboard/factory/warehouse"         → "Агуулах"
  href="/dashboard/factory/qa"                → "Чанарын хяналт" (дараа нэмнэ)

Admin:
  href="/admin/materials"  → "Материалын удирдлага"
  href="/admin/b2b"        → "B2B компаниуд"
*/
