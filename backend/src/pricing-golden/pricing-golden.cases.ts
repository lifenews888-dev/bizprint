export type ExpectedFields = Record<string, number | string | boolean | undefined>;

export interface ProductGoldenCase {
  name: string;
  product: Record<string, any>;
  input: Record<string, any>;
  expected: ExpectedFields;
}

export interface QuoteEngineGoldenCase {
  name: string;
  method: 'calculateWide' | 'calculateHadag' | 'calculateOffset';
  input: Record<string, any>;
  expected: ExpectedFields;
}

export interface SmartQuoteGoldenCase {
  name: string;
  input: Record<string, any>;
  expected: ExpectedFields;
  expectedCatalog?: {
    calculateMaterial?: [string, number, number, number];
    selectMachine?: [string, number];
    simulateProduction?: Record<string, any>;
    standardOptionMaterial?: string;
  };
}

export const pricingGoldenSheet = {
  metadata: {
    currency: 'MNT',
    vat_rate: 0.1,
    source: 'Current approved regression baseline. Replace expected values with the signed business price sheet when available.',
  },
  productCases: [
    {
      name: 'fixed base price',
      product: { pricing_mode: 'fixed', base_price: 12000 },
      input: { quantity: 3 },
      expected: { formula_used: 'fixed', total: 36000, unit_price: 12000, quantity: 3 },
    },
    {
      name: 'fixed sale price overrides base price',
      product: { pricing_mode: 'fixed', base_price: 12000, sale_price: 9000 },
      input: { quantity: 2 },
      expected: { formula_used: 'fixed', total: 18000, unit_price: 9000, quantity: 2 },
    },
    {
      name: 'area product uses square meters',
      product: { pricing_mode: 'formula', price_formula: { type: 'area_based', price_per_m2: 8000, min_area_m2: 0.25 } },
      input: { quantity: 1, width_mm: 1000, height_mm: 2000 },
      expected: { formula_used: 'area_based', area_m2: 2, subtotal: 16000, total: 16000, unit_price: 16000 },
    },
    {
      name: 'area product applies minimum area',
      product: { pricing_mode: 'formula', price_formula: { type: 'area_based', price_per_m2: 8000, min_area_m2: 0.25 } },
      input: { quantity: 1, width_mm: 300, height_mm: 300 },
      expected: { formula_used: 'area_based', area_m2: 0.25, subtotal: 2000, total: 2000, unit_price: 2000 },
    },
    {
      name: 'area product applies default volume discount',
      product: { pricing_mode: 'formula', price_formula: { type: 'area_based', price_per_m2: 10000, min_area_m2: 0.25 } },
      input: { quantity: 5, width_mm: 1000, height_mm: 1000 },
      expected: { formula_used: 'area_based', subtotal: 50000, volume_discount: 1500, discount_rate: 0.03, total: 48500 },
    },
    {
      name: 'area product includes per-m2 and fixed options',
      product: {
        pricing_mode: 'formula',
        price_formula: {
          type: 'area_based',
          price_per_m2: 10000,
          min_area_m2: 0.25,
          options: {
            lamination: { type: 'per_m2', price: 2000 },
            eyelets: { type: 'fixed', price: 5000 },
          },
        },
      },
      input: { quantity: 2, width_mm: 1000, height_mm: 2000, options: { lamination: true, eyelets: true } },
      expected: { formula_used: 'area_based', area_m2: 2, material_cost: 40000, addons_cost: 18000, subtotal: 58000, total: 58000, unit_price: 29000 },
    },
    {
      name: 'tier product uses default 100+ tier and setup',
      product: { pricing_mode: 'tier', base_price: 1000, price_formula: { setup_cost: 5000 } },
      input: { quantity: 100 },
      expected: { formula_used: 'tier_based', base_setup: 5000, material_cost: 80000, volume_discount: 20000, total: 85000, unit_price: 800 },
    },
    {
      name: 'tier product uses custom multiplier',
      product: {
        pricing_mode: 'tier',
        base_price: 1000,
        price_formula: { quantity_tiers: [{ min: 1, max: 9, multiplier: 1 }, { min: 10, max: null, multiplier: 0.7 }] },
      },
      input: { quantity: 10 },
      expected: { formula_used: 'tier_based', material_cost: 7000, volume_discount: 3000, total: 7000, unit_price: 700 },
    },
    {
      name: 'quote-required product without dimensions returns request state',
      product: { pricing_mode: 'quote_required', price_formula: {} },
      input: { quantity: 1 },
      expected: { formula_used: 'quote_required', is_estimate: true, total: 0 },
    },
    {
      name: 'quote-required product can return dimensional estimate',
      product: { pricing_mode: 'quote_required', price_formula: { type: 'area_based', price_per_m2: 50000, min_area_m2: 1 } },
      input: { quantity: 1, width_mm: 500, height_mm: 500 },
      expected: { formula_used: 'estimate', is_estimate: true, area_m2: 1, total: 50000 },
    },
  ] satisfies ProductGoldenCase[],
  quoteEngineCases: [
    {
      name: 'wide banner retail',
      method: 'calculateWide',
      input: { type: 'banner', width: 2, length: 1, pricing_mode: 'retail' },
      expected: {
        base_price: 36700,
        material_key: 'vinyl_440',
        material_rate_m2: 8500,
        print_rate_m2: 6500,
        material_cost: 18700,
        print_cost: 13000,
        setup_cost: 5000,
        subtotal: 53215,
        vat: 5322,
        total_price: 58537,
        unit_price: 58537,
      },
    },
    {
      name: 'wide banner b2b',
      method: 'calculateWide',
      input: { type: 'banner', width: 2, length: 1, pricing_mode: 'b2b' },
      expected: { base_price: 36700, subtotal: 44040, vat: 4404, total_price: 48444, unit_price: 48444 },
    },
    {
      name: 'wide banner retail rush 24h',
      method: 'calculateWide',
      input: { type: 'banner', width: 2, length: 1, rush_hours: 24, pricing_mode: 'retail' },
      expected: { base_price: 36700, rush_amount: 11010, subtotal: 69180, vat: 6918, total_price: 76098 },
    },
    {
      name: 'wide banner vinyl double finishing',
      method: 'calculateWide',
      input: {
        type: 'banner',
        width: 1,
        length: 2,
        quantity: 1,
        material: 'Vinyl 440gsm',
        finishing: ['Гантиг гагнуур', 'Оосор нэмэх'],
        sides: 'double',
        pricing_mode: 'retail',
      },
      expected: {
        base_price: 67700,
        material_key: 'vinyl_440',
        material_rate_m2: 8500,
        print_rate_m2: 6500,
        material_cost: 18700,
        print_cost: 26000,
        finishing_cost: 18000,
        setup_cost: 5000,
        side_multiplier: 2,
        subtotal: 98165,
        vat: 9817,
        total_price: 107982,
        unit_price: 107982,
      },
    },
    {
      name: 'wide flag retail',
      method: 'calculateWide',
      input: { type: 'flag', width: 1, length: 3, pricing_mode: 'retail' },
      expected: { base_price: 52550, subtotal: 76198, vat: 7620, total_price: 83818 },
    },
    {
      name: 'hadag tovgor retail',
      method: 'calculateHadag',
      input: { product: 'tovgor', size: 30, quantity: 2, pricing_mode: 'retail' },
      expected: { base_price: 70000, subtotal: 101500, vat: 10150, total_price: 111650, unit_price: 55825, quantity: 2 },
    },
    {
      name: 'hadag pvc retail',
      method: 'calculateHadag',
      input: { product: 'pvc', width: 2, height: 1, pricing_mode: 'retail' },
      expected: { base_price: 560000, subtotal: 812000, vat: 81200, total_price: 893200, unit_price: 893200 },
    },
    {
      name: 'hadag pvc retail with relay and rush 48h',
      method: 'calculateHadag',
      input: { product: 'pvc', width: 2, height: 1, extra_rele: true, rush_hours: 48, pricing_mode: 'retail' },
      expected: { base_price: 560000, extras_total: 30000, rush_amount: 84000, subtotal: 977300, vat: 97730, total_price: 1075030 },
    },
    {
      name: 'offset A4 full-color retail',
      method: 'calculateOffset',
      input: { size_code: 'A4', pages: 1, quantity: 100, gsm: 130, color_mode: 'full', sides: 'single', pricing_mode: 'retail' },
      expected: { pre_discount_subtotal: 52500, discount_pct: 5, discount_amount: 2625, subtotal: 72319, vat: 7232, total_price: 79551, unit_price: 796 },
    },
  ] satisfies QuoteEngineGoldenCase[],
  smartQuoteCases: [
    {
      name: 'raised letters include logo, rush, and VAT',
      input: {
        product_type: 'tovgor',
        text_lines: [{ label: 'Tom', text: 'BIZ', size: 50, letter_count: 3 }],
        logo_price: 80000,
        urgency: '24h',
      },
      expected: { subtotal: 396500, vat: 39650, total_price: 436150, unit_price: 75000, product_type: 'tovgor' },
    },
    {
      name: 'wide quote converts meter inputs and applies catalog margin',
      input: { product_type: 'wide', width: 2, height: 1, quantity: 1 },
      expected: { subtotal: 98020, vat: 9802, total_price: 107822, unit_price: 107822, product_type: 'wide' },
      expectedCatalog: {
        calculateMaterial: ['vinyl', 2000, 1000, 1],
        selectMachine: ['vinyl', 1],
      },
    },
    {
      name: 'wide quote converts inch dimensions before catalog pricing',
      input: { product_type: 'wide', width: 24, height: 36, unit: 'inch', quantity: 2 },
      expected: { subtotal: 98020, vat: 9802, total_price: 107822, unit_price: 53911, product_type: 'wide' },
      expectedCatalog: {
        calculateMaterial: ['vinyl', 610, 914, 2],
        selectMachine: ['vinyl', 2],
      },
    },
    {
      name: 'wide quote defaults zero quantity to one',
      input: { product_type: 'wide', width: 1, height: 2, quantity: 0 },
      expected: { subtotal: 98020, vat: 9802, total_price: 107822, unit_price: 107822, product_type: 'wide' },
      expectedCatalog: {
        calculateMaterial: ['vinyl', 1000, 2000, 1],
        selectMachine: ['vinyl', 1],
      },
    },
    {
      name: 'wide quote resolves Mongolian backlit material aliases',
      input: { product_type: 'wide', width: 1, height: 2, quantity: 1, material: 'Гэрэлт хулдаас' },
      expected: { subtotal: 98020, vat: 9802, total_price: 107822, unit_price: 107822, product_type: 'wide' },
      expectedCatalog: {
        calculateMaterial: ['backlit', 1000, 2000, 1],
        selectMachine: ['backlit', 1],
        simulateProduction: { has_led: true },
        standardOptionMaterial: 'backlit',
      },
    },
  ] satisfies SmartQuoteGoldenCase[],
};
