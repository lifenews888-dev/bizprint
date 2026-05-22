import { QuoteController } from './quote.controller';

describe('QuoteController instantQuote', () => {
  const controller = new QuoteController(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  it('returns legacy and canonical VAT-aware fields', async () => {
    const result: any = await controller.instantQuote({
      productType: 'flyer',
      widthMm: 148,
      heightMm: 210,
      quantity: 500,
      colorMode: 'CMYK',
      finishing: [],
    });

    expect(result.total).toBeGreaterThan(0);
    expect(result.unitPrice).toBeGreaterThan(0);
    expect(result.subtotal).toBe(result.total);
    expect(result.vat).toBe(Math.round(result.subtotal * 0.10));
    expect(result.total_price).toBe(result.subtotal + result.vat);
    expect(result.unit_price).toBeCloseTo(result.total_price / result.quantity);
    expect(result.lead_days).toBe(result.leadDays);
    expect(result.product_type).toBe(result.productType);
    expect(result.line_items.length).toBeGreaterThan(0);
  });
});
