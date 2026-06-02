import { SmartQuoteService } from './smart-quote.service';

describe('SmartQuoteService pricing', () => {
  function makeService(overrides: Partial<Record<string, any>> = {}) {
    const catalog = {
      getLetterPrice: jest.fn(async (size: number) => ({ 30: 45000, 50: 75000 }[size] || 45000)),
      calculateMaterial: jest.fn(async (materialKey = 'vinyl') => ({
        material_name: materialKey === 'backlit' ? 'Backlit film' : materialKey === 'mesh' ? 'Mesh баннер' : 'Vinyl',
        material_key: materialKey,
        area_m2: 2,
        total_cost: 17600,
      })),
      selectMachine: jest.fn(async () => ({
        name: 'Roland Wide Format',
        machine_type: 'wide',
      })),
      simulateProduction: jest.fn(async () => ({
        estimated_days: 1,
        total_production_cost: 50000,
        steps: [],
      })),
      getMarginRate: jest.fn(async () => 0.45),
      autoSelectMaterial: jest.fn(async () => 'vinyl'),
      ...overrides,
    };

    const service = new SmartQuoteService({} as any, {} as any, catalog as any);
    return { service, catalog };
  }

  it('calculates tovgor letters from catalog price, logo, rush, and VAT', async () => {
    const { service } = makeService();

    const result: any = await service.calculatePrice({
      product_type: 'tovgor',
      text_lines: [{ label: 'Tom', text: 'BIZ', size: 50, letter_count: 3 }],
      logo_price: 80000,
      urgency: '24h',
    });

    expect(result.unit_price).toBe(75000);
    expect(result.subtotal).toBe(396500);
    expect(result.vat).toBe(39650);
    expect(result.total_price).toBe(436150);
    expect(result.line_items).toHaveLength(3);
  });

  it('treats small width and height inputs as meters for area quotes', async () => {
    const { service, catalog } = makeService();

    const result: any = await service.calculatePrice({
      product_type: 'wide',
      width: 2,
      height: 1,
      quantity: 1,
    });

    expect(catalog.calculateMaterial).toHaveBeenCalledWith('vinyl', 2000, 1000, 1);
    expect(result.subtotal).toBe(98020);
    expect(result.vat).toBe(9802);
    expect(result.total_price).toBe(107822);
  });

  it('converts inch dimensions to millimeters before pricing', async () => {
    const { service, catalog } = makeService();

    await service.calculatePrice({
      product_type: 'wide',
      width: 24,
      height: 36,
      unit: 'inch',
      quantity: 2,
    });

    expect(catalog.calculateMaterial).toHaveBeenCalledWith('vinyl', 610, 914, 2);
  });

  it('defaults zero area quote quantity to one before pricing', async () => {
    const { service, catalog } = makeService();

    const result: any = await service.calculatePrice({
      product_type: 'wide',
      width: 1,
      height: 2,
      quantity: 0,
    });

    expect(catalog.calculateMaterial).toHaveBeenCalledWith('vinyl', 1000, 2000, 1);
    expect(catalog.selectMachine).toHaveBeenCalledWith('vinyl', 1);
    expect(result.line_items[0].quantity).toBe(1);
    expect(result.unit_price).toBe(result.total_price);
  });

  it('resolves Mongolian wide-format material aliases before pricing', async () => {
    const { service, catalog } = makeService();

    const backlit: any = await service.calculatePrice({
      product_type: 'wide',
      width: 1,
      height: 2,
      quantity: 1,
      material: 'Гэрэлт хулдаас',
    });

    expect(catalog.calculateMaterial).toHaveBeenCalledWith('backlit', 1000, 2000, 1);
    expect(catalog.simulateProduction).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ has_led: true }),
    );
    expect(backlit.options[1].material).toBe('backlit');

    await service.calculatePrice({
      product_type: 'wide',
      width: 1,
      height: 2,
      quantity: 1,
      material: 'Торон баннер',
    });

    expect(catalog.calculateMaterial).toHaveBeenLastCalledWith('mesh', 1000, 2000, 1);
  });

  it('extracts UTF-8 PDF quote fields and returns a Mongolian summary', () => {
    const { service } = makeService();

    const parsed = service.extractQuoteData('Banner 100×200cm qty: 2 vinyl ₮ 50,000');
    const summary = service.parsePdfSummary(parsed);

    expect(parsed.dimensions).toEqual({ width: 100, height: 200, unit: 'cm' });
    expect(parsed.quantity).toBe(2);
    expect(parsed.material).toBe('vinyl');
    expect(parsed.price).toEqual({ amount: 50000, currency: '₮' });
    expect(summary).toBe('Хэмжээ: 100×200cm, Тоо: 2, Материал: vinyl, Үнэ: ₮50000');
  });

  it('returns a readable Mongolian summary when PDF fields are missing', () => {
    const { service } = makeService();

    expect(service.parsePdfSummary({ confidence: 0, rawText: '' })).toBe('Мэдээлэл олдсонгүй');
  });
});
