import { ProductPriceCalculatorService } from '../products/product-price-calculator.service';
import { QuoteEngineService } from '../quote-engine/quote-engine.service';
import { SmartQuoteService } from '../quote/smart-quote.service';
import { ExpectedFields, pricingGoldenSheet } from './pricing-golden.cases';

function expectFields(result: Record<string, any>, expected: ExpectedFields) {
  for (const [key, value] of Object.entries(expected)) {
    expect(result[key]).toBe(value);
  }
}

describe('Golden pricing sheet', () => {
  describe('product page calculator', () => {
    const service = new ProductPriceCalculatorService();

    it.each(pricingGoldenSheet.productCases)('$name', ({ product, input, expected }) => {
      const result = service.calculate(product, input);
      expectFields(result as any, expected);
      expect(result.total_price).toBe(result.total);
      expect(result.total_price).toBe(result.subtotal_excl_vat + result.vat);
      expect(result.vat_rate).toBe(pricingGoldenSheet.metadata.vat_rate);
      expect(result.vat_included).toBe(true);
    });
  });

  describe('quote engine calculators', () => {
    function makeService() {
      const pricingConfig = { getValue: jest.fn(async () => null) };
      return new QuoteEngineService({} as any, {} as any, pricingConfig as any, {} as any);
    }

    it.each(pricingGoldenSheet.quoteEngineCases)('$name', async ({ method, input, expected }) => {
      const service = makeService();
      const result = await service[method](input);
      expectFields(result, expected);
      if (typeof result.total_price === 'number') {
        expect(result.total_price).toBe(result.subtotal + result.vat);
      }
    });
  });

  describe('smart quote calculator', () => {
    function makeService() {
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
      };
      return { service: new SmartQuoteService({} as any, {} as any, catalog as any), catalog };
    }

    it.each(pricingGoldenSheet.smartQuoteCases)('$name', async ({ input, expected, expectedCatalog }) => {
      const { service, catalog } = makeService();
      const result = await service.calculatePrice(input);
      expectFields(result as any, expected);
      expect((result as any).total_price).toBe((result as any).subtotal + (result as any).vat);
      if (expectedCatalog?.calculateMaterial) {
        expect(catalog.calculateMaterial).toHaveBeenCalledWith(...expectedCatalog.calculateMaterial);
      }
      if (expectedCatalog?.selectMachine) {
        expect(catalog.selectMachine).toHaveBeenCalledWith(...expectedCatalog.selectMachine);
      }
      if (expectedCatalog?.simulateProduction) {
        expect(catalog.simulateProduction).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining(expectedCatalog.simulateProduction),
        );
      }
      if (expectedCatalog?.standardOptionMaterial) {
        expect((result as any).options[1].material).toBe(expectedCatalog.standardOptionMaterial);
      }
    });
  });
});
