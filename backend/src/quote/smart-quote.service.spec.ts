import { SmartQuoteService } from './smart-quote.service';

describe('SmartQuoteService pricing', () => {
  function makeService(overrides: Partial<Record<string, any>> = {}) {
    const catalog = {
      getLetterPrice: jest.fn(async (size: number) => ({ 30: 45000, 50: 75000 }[size] || 45000)),
      calculateMaterial: jest.fn(async () => ({
        material_name: 'Vinyl',
        material_key: 'vinyl',
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
});
