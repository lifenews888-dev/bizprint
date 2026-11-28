/**
 * Сагсны үнийн луйврын эсрэг тест.
 * Хөтчөөс ирсэн үнэд итгэхгүй байх ёстой — зөвхөн серверийн битүүмжилсэн
 * (price_seal) үнэ, эсвэл серверийн каталог / үнэ бодогчийн үнийг авна.
 */
import { CartService } from './cart.service';
import { CartStatus } from './cart.entity';
import { sealPrice, verifyPriceSeal } from '../common/price-seal';

process.env.PRICE_SEAL_SECRET = 'test-price-seal-secret-at-least-24-chars';

const repo = () => ({
  findOne: jest.fn(),
  save: jest.fn(async (v) => v),
  create: jest.fn((v) => v),
  delete: jest.fn(),
  update: jest.fn(),
});

function setup(product: Record<string, any>) {
  const r = {
    cart: repo(), item: repo(), quotation: repo(), quotationItem: repo(), order: repo(),
    orderItem: repo(), vendorGroup: repo(), product: repo(), user: repo(),
  };
  r.product.findOne.mockResolvedValue({ id: 'p-1', is_active: true, is_out_of_stock: false, stock_quantity: null, ...product });
  r.cart.findOne.mockResolvedValue({ id: 'cart-1', status: CartStatus.ACTIVE, items: [] });
  const service = new CartService(
    r.cart as any, r.item as any, r.quotation as any, r.quotationItem as any, r.order as any,
    r.orderItem as any, r.vendorGroup as any, r.product as any, r.user as any,
    { calculateFullPrice: jest.fn() } as any,
    { generateNumber: jest.fn(async () => 'Q-TEST') } as any,
    { log: jest.fn(async () => undefined) } as any,
  );
  const accepted = () => (r.item.create.mock.calls.at(-1)?.[0] as any)?.unit_price;
  return { service, accepted };
}

const add = (service: CartService, source: string, unit_price: number, quantity = 1, extra: Record<string, any> = {}) =>
  service.addItem('user-1', {
    product_id: 'p-1',
    quantity,
    unit_price,
    specs: { pricing: { source, unit_price }, pricing_snapshot: { source, ...extra } },
  });

describe('price-seal', () => {
  const p = { scope: 'ai-upload', unit_price: 50_000, quantity: 100 };
  it('зөв битүүмжийг хүлээн авна', () => {
    expect(verifyPriceSeal(sealPrice(p), p)).toBe(true);
  });
  it('үнэ, тоо, эх сурвалж өөрчлөгдвөл татгалзана', () => {
    const seal = sealPrice(p);
    expect(verifyPriceSeal(seal, { ...p, unit_price: 1 })).toBe(false);
    expect(verifyPriceSeal(seal, { ...p, quantity: 1000 })).toBe(false);
    expect(verifyPriceSeal(seal, { ...p, scope: 'server:other' })).toBe(false);
  });
  it('хугацаа дууссан, хуурамч, хоосон битүүмжийг татгалзана', () => {
    const old = sealPrice(p, 60, Date.now() - 3_600_000);
    expect(verifyPriceSeal(old, p)).toBe(false);
    expect(verifyPriceSeal('v1.9999999999.AAAA', p)).toBe(false);
    expect(verifyPriceSeal(undefined, p)).toBe(false);
  });
});

describe('Сагс — хөтчийн илгээсэн үнийг шалгах', () => {
  it.each(['server', 'pricing-catalog', 'ai-upload', 'quote', 'inquiry'])(
    'тогтмол үнэтэй бараа: source "%s" гэж бичээд 1₮ илгээвэл каталогийн үнийг авна',
    async (source) => {
      const { service, accepted } = setup({ pricing_mode: 'fixed', sale_price: 90_000, base_price: 100_000 });
      await add(service, source, 1);
      expect(accepted()).toBe(90_000);
    },
  );

  it('шатлалтай бараа: битүүмжгүй хямд үнийг серверийн үнэ бодогчийн үнээр солино', async () => {
    const { service, accepted } = setup({
      pricing_mode: 'tier',
      base_price: 2_000, // анхдагч шатлал: 50–99ш → 10% хөнгөлөлт
    });
    await add(service, 'server', 1, 50);
    expect(accepted()).toBe(1_800);
  });

  it('талбайн үнэтэй бараа (туг, баннер): 1₮ хүлээн авахгүй', async () => {
    const { service, accepted } = setup({ pricing_mode: 'formula', requires_dimensions: true, base_price: 50_000 });
    await add(service, 'server', 1, 1, { breakdown: { width_mm: 2000, height_mm: 1000 } });
    expect(accepted()).toBeGreaterThan(1_000);
  });

  it('серверийн битүүмжтэй үнийг (барааны хуудас) яг хүлээн авна', async () => {
    const { service, accepted } = setup({ pricing_mode: 'tier', base_price: 2_000 });
    const price_seal = sealPrice({ scope: 'server:p-1', unit_price: 1_800, quantity: 50 });
    await add(service, 'server', 1_800, 50, { breakdown: { unit_price: 1_800, price_seal } });
    expect(accepted()).toBe(1_800);
  });

  it('өөр барааны битүүмжийг энэ бараанд ашиглаж болохгүй', async () => {
    const { service, accepted } = setup({ pricing_mode: 'fixed', sale_price: 90_000 });
    const price_seal = sealPrice({ scope: 'server:cheap-product', unit_price: 100, quantity: 1 });
    await add(service, 'server', 100, 1, { breakdown: { price_seal } });
    expect(accepted()).toBe(90_000);
  });

  it('албан каталогийн бараа: 1₮ илгээсэн ч серверийн каталогийн үнийг авна', async () => {
    const { service, accepted } = setup({
      pricing_mode: 'catalog',
      price_formula: { type: 'catalog', variants: [{ code: 'BP-076', unit: 'pack', pack: 200, inc: 55_000 }] },
    });
    await service.addItem('user-1', {
      product_id: 'p-1',
      quantity: 2,
      unit_price: 1,
      specs: {
        pricing: { source: 'server', unit_price: 1 },
        pricing_snapshot: { source: 'server' },
        catalog: { line: { kind: 'item', code: 'BP-076', qty: 2 } },
      },
    });
    expect(accepted()).toBe(55_000);
  });

  it('AI (PDF) үнэ битүүмжтэй бол хүлээн авна, тоог өөрчилбөл авахгүй', async () => {
    const seal = sealPrice({ scope: 'ai-upload', unit_price: 700, quantity: 100 });
    const a = setup({ pricing_mode: 'fixed', sale_price: 1_000 });
    await add(a.service, 'ai-upload', 700, 100, { serverQuote: { unit_price: 700, price_seal: seal } });
    expect(a.accepted()).toBe(700);

    const b = setup({ pricing_mode: 'fixed', sale_price: 1_000 });
    await add(b.service, 'ai-upload', 700, 5000, { serverQuote: { unit_price: 700, price_seal: seal } });
    expect(b.accepted()).toBe(1_000);
  });
});
