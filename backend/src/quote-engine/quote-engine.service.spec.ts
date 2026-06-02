import { QuoteEngineService } from './quote-engine.service';

describe('QuoteEngineService public calculators', () => {
  const toLegacyMojibake = (value: string) => Buffer.from(value, 'utf8').toString('latin1');

  function makeService(overrides: Record<string, number> = {}) {
    const pricingConfig = {
      getValue: jest.fn(async (key: string) => overrides[key] ?? null),
    };
    const service = new QuoteEngineService(
      {} as any,
      {} as any,
      pricingConfig as any,
      {} as any,
    );
    return service;
  }

  it('calculateOffset returns VAT-aware total_price and subtotal', async () => {
    const service = makeService();

    const result: any = await service.calculateOffset({
      size_code: 'A4',
      pages: 1,
      quantity: 100,
      gsm: 130,
      color_mode: 'full',
      sides: 'single',
      pricing_mode: 'retail',
    });

    expect(result.subtotal).toBeGreaterThan(0);
    expect(result.vat).toBe(Math.round(result.subtotal * 0.10));
    expect(result.total_price).toBe(result.subtotal + result.vat);
    expect(result.unit_price).toBe(Math.round(result.total_price / result.quantity));
    expect(result.vat_note).toBe('НӨАТ орсон');
  });

  it('calculateOffset clamps unsafe pages, gsm, and quantity', async () => {
    const service = makeService();

    const result: any = await service.calculateOffset({
      size_code: 'A4',
      pages: Number.POSITIVE_INFINITY,
      quantity: -200,
      gsm: -130,
      color_mode: 'full',
      sides: 'single',
      pricing_mode: 'retail',
    });

    expect(result.quantity).toBe(100);
    expect(result.paper_cost).toBeGreaterThan(0);
    expect(result.print_cost).toBeGreaterThan(0);
    expect(result.total_price).toBeGreaterThan(0);
    expect(Number.isFinite(result.total_price)).toBe(true);
  });

  it('calculateOffset caps extremely large quantity and page counts', async () => {
    const service = makeService();

    const result: any = await service.calculateOffset({
      size_code: 'A4',
      pages: 20_000,
      quantity: 2_000_000,
      gsm: 2000,
      color_mode: 'full',
      sides: 'double',
      pricing_mode: 'retail',
    });

    expect(result.quantity).toBe(1_000_000);
    expect(result.total_price).toBeGreaterThan(0);
    expect(Number.isFinite(result.total_price)).toBe(true);
  });

  it('calculateHadag returns VAT-aware total for letter quotes', async () => {
    const service = makeService();

    const result: any = await service.calculateHadag({
      product: 'tovgor',
      size: 30,
      quantity: 2,
      pricing_mode: 'retail',
    });

    expect(result.base_price).toBe(70000);
    expect(result.vat).toBe(Math.round(result.subtotal * 0.10));
    expect(result.total_price).toBe(result.subtotal + result.vat);
    expect(result.unit_price).toBe(Math.round(result.total_price / 2));
  });

  it('calculateHadag clamps unsafe tovgor size and quantity', async () => {
    const service = makeService();

    const result: any = await service.calculateHadag({
      product: 'tovgor',
      size: Number.NEGATIVE_INFINITY,
      quantity: -10,
      pricing_mode: 'retail',
    });

    expect(result.quantity).toBe(1);
    expect(result.base_label).toContain('30см');
    expect(result.base_price).toBe(35000);
    expect(result.total_price).toBeGreaterThan(0);
    expect(Number.isFinite(result.total_price)).toBe(true);
  });

  it('calculateHadag clamps unsafe area dimensions for non-tovgor products', async () => {
    const service = makeService();

    const result: any = await service.calculateHadag({
      product: 'pvc',
      width: -5,
      height: Number.POSITIVE_INFINITY,
      pricing_mode: 'retail',
    });

    expect(result.base_label).toContain('1×1м');
    expect(result.quantity).toBe(1);
    expect(result.total_price).toBeGreaterThan(0);
    expect(Number.isFinite(result.total_price)).toBe(true);
  });

  it('calculateWide returns VAT-aware total for m2 quotes', async () => {
    const service = makeService();

    const result: any = await service.calculateWide({
      type: 'banner',
      width: 2,
      length: 1,
      pricing_mode: 'retail',
    });

    expect(result.base_price).toBe(36700);
    expect(result.vat).toBe(Math.round(result.subtotal * 0.10));
    expect(result.total_price).toBe(result.subtotal + result.vat);
  });

  it('calculateWide clamps unsafe dimensions and quantity to billable positive values', async () => {
    const service = makeService();

    const result: any = await service.calculateWide({
      type: 'banner',
      width: -5,
      length: Number.POSITIVE_INFINITY,
      quantity: 1.6,
      finishing: ['Гантиг гагнуур'],
      pricing_mode: 'retail',
    });

    expect(result.width_m).toBe(1);
    expect(result.length_m).toBe(2);
    expect(result.quantity).toBe(2);
    expect(result.area_m2).toBe(2);
    expect(result.billable_area_m2).toBe(4);
    expect(result.finishing_cost).toBeGreaterThan(0);
    expect(result.total_price).toBeGreaterThan(0);
    expect(Number.isFinite(result.total_price)).toBe(true);
  });

  it('calculateWide caps extremely large dimensions and quantities', async () => {
    const service = makeService();

    const result: any = await service.calculateWide({
      type: 'banner',
      width: 5000,
      length: 5000,
      quantity: 2_000_000,
      pricing_mode: 'retail',
    });

    expect(result.width_m).toBe(1000);
    expect(result.length_m).toBe(1000);
    expect(result.quantity).toBe(1_000_000);
    expect(result.area_m2).toBe(1_000_000);
    expect(Number.isFinite(result.total_price)).toBe(true);
  });

  it('calculateWide changes price when material changes', async () => {
    const service = makeService();

    const vinyl: any = await service.calculateWide({
      type: 'banner',
      width: 1,
      length: 2,
      material: 'Vinyl 440gsm',
      pricing_mode: 'retail',
    });
    const backlit: any = await service.calculateWide({
      type: 'banner',
      width: 1,
      length: 2,
      material: 'Backlit хулдаас',
      pricing_mode: 'retail',
    });

    expect(vinyl.material_key).toBe('vinyl_440');
    expect(backlit.material_key).toBe('backlit');
    expect(backlit.total_price).toBeGreaterThan(vinyl.total_price);
  });

  it('calculateWide resolves Mongolian material names', async () => {
    const service = makeService();

    const mesh: any = await service.calculateWide({
      type: 'banner',
      width: 1,
      length: 2,
      material: 'Мэш баннер',
      pricing_mode: 'retail',
    });
    const backlit: any = await service.calculateWide({
      type: 'banner',
      width: 1,
      length: 2,
      material: 'Гэрэлт хулдаас',
      pricing_mode: 'retail',
    });

    expect(mesh.material_key).toBe('mesh_banner');
    expect(backlit.material_key).toBe('backlit');
    expect(backlit.total_price).toBeGreaterThan(mesh.total_price);
  });

  it('calculateWide uses pricing-config overrides for material rates', async () => {
    const service = makeService({
      wide_material_vinyl_440: 20000,
      retail_margin: 0.45,
    });

    const result: any = await service.calculateWide({
      type: 'banner',
      width: 1,
      length: 2,
      material: 'Vinyl 440gsm',
      pricing_mode: 'retail',
    });

    expect(result.material_rate_m2).toBe(20000);
    expect(result.material_cost).toBe(44000);
    expect(result.total_price).toBe(98890);
  });

  it('calculateWide prices Mongolian banner finishings by perimeter', async () => {
    const service = makeService({
      wide_finish_weld_m: 1200,
      wide_finish_grommet_m: 1800,
      retail_margin: 0.45,
    });

    const result: any = await service.calculateWide({
      type: 'banner',
      width: 1,
      length: 2,
      material: 'Vinyl 440gsm',
      finishing: ['Гантиг гагнуур', 'Оосор нэмэх'],
      pricing_mode: 'retail',
    });

    expect(result.finishing_cost).toBe(18000);
    expect(result.breakdown.finishing).toBe(18000);
  });

  it('calculateWide prices UTF-8 Mongolian banner finishings by perimeter', async () => {
    const service = makeService({
      wide_finish_weld_m: 1200,
      wide_finish_grommet_m: 1800,
      retail_margin: 0.45,
    });

    const result: any = await service.calculateWide({
      type: 'banner',
      width: 1,
      length: 2,
      material: 'Vinyl 440gsm',
      finishing: ['Гантиг гагнуур', 'Оосор нэмэх'],
      sides: 'double',
      pricing_mode: 'retail',
    });

    expect(result.finishing_cost).toBe(18000);
    expect(result.breakdown.finishing).toBe(18000);
    expect(result.side_multiplier).toBe(2);
    expect(result.total_price).toBe(107982);
  });

  it('calculateWide still recognizes legacy mojibake Mongolian aliases', async () => {
    const service = makeService({
      wide_finish_weld_m: 1200,
      wide_finish_grommet_m: 1800,
      retail_margin: 0.45,
    });

    const result: any = await service.calculateWide({
      type: 'banner',
      width: 1,
      length: 2,
      material: toLegacyMojibake('Гэрэлт хулдаас'),
      finishing: [
        toLegacyMojibake('Гантиг гагнуур'),
        toLegacyMojibake('Оосор нэмэх'),
      ],
      pricing_mode: 'retail',
    });

    expect(result.material_key).toBe('backlit');
    expect(result.finishing_cost).toBe(18000);
    expect(result.breakdown.finishing).toBe(18000);
  });
});
