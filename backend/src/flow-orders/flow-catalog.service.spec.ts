import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FlowCatalogService } from './flow-catalog.service';
import { FlowOrdersService } from './flow-orders.service';

// migrations/2026-11-25-0x-shop-catalog-*.sql дахь албан үнийн хэсэг
const FLAG_OUTDOOR = {
  slug: 'flagoutdoor',
  name: 'Гадна туг',
  name_mn: 'Гадна туг',
  category: 'flag',
  is_active: true,
  requires_dimensions: true,
  pricing_mode: 'catalog',
  price_formula: {
    type: 'catalog',
    variants: [
      { code: 'BP-041', family: 'Гадна туг', option: 'Нимгэн силк', unit: 'm2', inc: 55000, ex: 50000,
        presets: [{ w: 1.0, h: 0.5, inc: 27500 }, { w: 2.0, h: 1.0, inc: 110000 }] },
      { code: 'BP-047', family: 'Тугны суурь, иш', option: 'Барьдаг иш', unit: 'pcs', inc: 41800, ex: 38000 },
    ],
  },
};
const TABLE_FLAG = {
  slug: 'tableflag', name: 'Ширээний туг', name_mn: 'Ширээний туг', category: 'flag',
  is_active: true, pricing_mode: 'catalog',
  price_formula: { type: 'catalog', variants: [
    { code: 'BP-051', family: 'Ширээний туг', option: '1 тугтай суурьтай', unit: 'pcs', inc: 49500, ex: 45000 },
  ] },
};

function makeCatalog() {
  const all = [FLAG_OUTDOOR, TABLE_FLAG];
  const repo: any = {
    find: jest.fn(async ({ where }: any) => all.filter((p) => !where.category || p.category === where.category)),
    findOne: jest.fn(async ({ where }: any) => all.find((p) => p.slug === where.slug) || null),
  };
  return new FlowCatalogService(repo);
}

describe('FlowCatalogService', () => {
  const svc = makeCatalog();

  it('lists catalog variants with VAT-included prices', async () => {
    const list = await svc.list('flag');
    expect(list.map((p) => p.slug)).toEqual(['flagoutdoor', 'tableflag']);
    expect(list[0].variants[0]).toMatchObject({ code: 'BP-041', unit: 'm2', priceIncVat: 55000 });
  });

  it('prices m² flags exactly like the site (preset 2×1м = 110,000₮)', async () => {
    const q = await svc.quote({ productSlug: 'flagoutdoor', variantCode: 'BP-041', widthM: 2, heightM: 1, quantity: 1 });
    expect(q.total).toBe(110000);
    expect(q.amountExVat).toBe(100000);
    expect(q.vat).toBe(10000);
  });

  it('doubles m² price for two-sided print and adds extras as separate lines', async () => {
    const q = await svc.quote({
      productSlug: 'flagoutdoor', variantCode: 'BP-041', widthM: 1.2, heightM: 2.4, quantity: 2, sides: 2,
      extras: [{ variantCode: 'BP-047', quantity: 2 }],
    });
    // 1.2×2.4 = 2.88м² × 55,000 = 158,400 → 2 тал → 316,800 × 2ш = 633,600 ; иш 41,800×2
    expect(q.mainTotal).toBe(633600);
    expect(q.extras[0]).toMatchObject({ variantCode: 'BP-047', quantity: 2, total: 83600 });
    expect(q.total).toBe(633600 + 83600);
  });

  it('does not double pcs products and requires dimensions for m²', async () => {
    const q = await svc.quote({ productSlug: 'tableflag', variantCode: 'BP-051', quantity: 3, sides: 2 });
    expect(q.total).toBe(148500);
    expect(q.sides).toBe(1);
    await expect(svc.quote({ productSlug: 'flagoutdoor', variantCode: 'BP-041', quantity: 1 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unknown products, variants and m² extras', async () => {
    await expect(svc.quote({ productSlug: 'nope', variantCode: 'X', quantity: 1 })).rejects.toBeInstanceOf(NotFoundException);
    await expect(svc.quote({ productSlug: 'flagoutdoor', variantCode: 'BP-999', quantity: 1 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.quote({ productSlug: 'flagoutdoor', variantCode: 'BP-041', widthM: 1, heightM: 1, quantity: 1,
      extras: [{ variantCode: 'BP-041', quantity: 1 }] })).rejects.toThrow('Нэмэлт хувилбар буруу');
  });
});

describe('FlowOrdersService catalog orders', () => {
  it('creates a catalog order priced by the catalog service', async () => {
    const saved: any[] = [];
    const repo: any = {
      create: (o: any) => ({ ...o }),
      save: jest.fn(async (o: any) => { o.id = '00000000-0000-4000-8000-000000000001'; saved.push(o); return o; }),
    };
    const flow = new FlowOrdersService(repo, {} as any, makeCatalog());
    const o = await flow.create({
      conversationId: 'c1', customer: { phone: '9911-2233' }, product: 'catalog',
      productSlug: 'flagoutdoor', variantCode: 'BP-041', widthM: 2, heightM: 1, quantity: 1,
      fields: {}, design: { background: '#0b3d2e', headline: 'Монгол Шуудан', layout: 'center', evil: '<x>' },
    } as any);
    expect(o).toMatchObject({ product: 'catalog', productSlug: 'flagoutdoor', amount: 110000, template: 'fabric-auto' });
    expect(o.orderNo).toMatch(/^BP\d{6}-/);
    expect(o.spec).toMatchObject({ widthM: 2, heightM: 1, sides: 1, design: { background: '#0B3D2E', headline: 'Монгол Шуудан', layout: 'center' } });
    expect((o.spec as any).design.evil).toBeUndefined();
  });

  it('requires productSlug and variantCode', async () => {
    const flow = new FlowOrdersService({} as any, {} as any, makeCatalog());
    await expect(flow.create({ conversationId: 'c', customer: { phone: '99112233' }, product: 'catalog', quantity: 1, fields: {} } as any))
      .rejects.toThrow('productSlug');
  });
});
