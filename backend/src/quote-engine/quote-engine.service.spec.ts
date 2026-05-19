import { QuoteEngineService } from './quote-engine.service';

describe('QuoteEngineService public calculators', () => {
  function makeService() {
    const pricingConfig = {
      getValue: jest.fn(async () => null),
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

  it('calculateWide returns VAT-aware total for m2 quotes', async () => {
    const service = makeService();

    const result: any = await service.calculateWide({
      type: 'banner',
      width: 2,
      length: 1,
      pricing_mode: 'retail',
    });

    expect(result.base_price).toBe(16000);
    expect(result.vat).toBe(Math.round(result.subtotal * 0.10));
    expect(result.total_price).toBe(result.subtotal + result.vat);
  });
});
