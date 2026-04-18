import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { PricingRule } from '../pricing-rules/pricing-rule.entity';

export interface QuoteInput {
  product_id: string;
  quantity: number;
  options?: Record<string, string>;
  rush?: boolean;
  delivery?: boolean;
}

export interface QuoteResult {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  setup_fee: number;
  subtotal: number;
  platform_margin: number;
  delivery_fee: number;
  total: number;
  currency: string;
  valid_until: string;
  breakdown: Record<string, any>;
}

// ─── Offset / Print Cost Constants ───────────────────────────────────────────

/** CTP plate making cost per plate (Монголын зах зээл, 2024-2025) */
const PLATE_COST = 30_000;

/** Offset press: ₮50,000/hr, 4,000 sheets/hr */
const OFFSET_MACHINE_RATE = 50_000;
const OFFSET_MACHINE_SPEED = 4_000;

/** Digital/short-run: ₮25,000/hr, 1,500 sheets/hr */
const DIGITAL_MACHINE_RATE = 25_000;
const DIGITAL_MACHINE_SPEED = 1_500;

/** Paper price per sheet (₮) by GSM bracket */
const PAPER_PRICE: Record<number, number> = {
  60:  30,
  80:  38,
  90:  45,
  100: 55,
  115: 68,
  150: 92,
  170: 115,
  200: 140,
  250: 180,
  300: 225,
  350: 275,
};

/** Finishing cost per copy (₮) for A4-size product */
const FINISHING_COST_PER_COPY: Record<string, number> = {
  none:           0,
  laminate_matte: 90,
  laminate_gloss: 80,
  soft_touch:    140,
  uv:             70,
  fold:           25,
  spot_uv:       110,
};

/** Binding cost per copy (₮) */
const BINDING_COST_PER_COPY: Record<string, number> = {
  none:         0,
  staple:     100,
  saddle_stitch: 150,
  perfect:    700,
  spiral:    1000,
  wire_o:    1200,
  hardcover: 3500,
};

/** Overhead on top of direct production cost */
const OVERHEAD_RATE   = 0.15;
/** Platform / profit margin */
const PLATFORM_MARGIN = 0.25;
/** Paper waste factor */
const WASTE_FACTOR    = 1.05;
/** Minimum cutting/trimming charge per job */
const CUTTING_FIXED   = 8_000;
/** Minimum charge for any offset job */
const OFFSET_MIN_JOB  = 50_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPaperPrice(gsm: number): number {
  const brackets = Object.keys(PAPER_PRICE)
    .map(Number)
    .sort((a, b) => a - b);
  for (const b of brackets) {
    if (gsm <= b) return PAPER_PRICE[b];
  }
  return PAPER_PRICE[350];
}

/**
 * Extract a numeric value from options, trying multiple possible key names.
 * e.g. extractNum(options, ['pages','хуудас тоо','page_count'], 1)
 */
function extractNum(
  options: Record<string, string> | undefined,
  keys: string[],
  defaultVal: number,
): number {
  if (!options) return defaultVal;
  for (const k of keys) {
    const v = options[k];
    if (v !== undefined) {
      const n = parseInt(v, 10);
      if (!isNaN(n) && n > 0) return n;
    }
  }
  return defaultVal;
}

/**
 * Extract a string value from options, trying multiple possible key names.
 */
function extractStr(
  options: Record<string, string> | undefined,
  keys: string[],
  defaultVal: string,
): string {
  if (!options) return defaultVal;
  for (const k of keys) {
    const v = options[k];
    if (v !== undefined && v.trim() !== '') return v.trim();
  }
  return defaultVal;
}

function mapFinishing(raw: string): string {
  const r = raw.toLowerCase();
  if (r.includes('мат') || r.includes('matte'))   return 'laminate_matte';
  if (r.includes('глос') || r.includes('gloss'))  return 'laminate_gloss';
  if (r.includes('soft') || r.includes('соф'))    return 'soft_touch';
  if (r.includes('uv') || r.includes('уф'))        return 'uv';
  if (r.includes('fold') || r.includes('нугал'))  return 'fold';
  if (r.includes('spot'))                          return 'spot_uv';
  return 'none';
}

function mapBinding(raw: string): string {
  const r = raw.toLowerCase();
  if (r.includes('perfect') || r.includes('перфект') || r.includes('нуруу'))  return 'perfect';
  if (r.includes('spiral')  || r.includes('спираль'))                          return 'spiral';
  if (r.includes('wire')    || r.includes('wire-o'))                            return 'wire_o';
  if (r.includes('hardcover') || r.includes('хатуу') || r.includes('хавтас')) return 'hardcover';
  if (r.includes('staple')  || r.includes('степл') || r.includes('дэгээ'))    return 'staple';
  if (r.includes('saddle')  || r.includes('зүссэн'))                           return 'saddle_stitch';
  return 'none';
}

// ─── Offset cost engine ───────────────────────────────────────────────────────

interface OffsetParams {
  quantity:   number;
  pages:      number;  // total page count (1 = one-sided single sheet)
  sides:      'single' | 'double';
  paper_gsm:  number;
  colors:     number;  // 1 = B&W / spot color, 4 = CMYK
  finishing:  string;  // normalised key
  binding:    string;  // normalised key
  rush:       boolean;
}

interface OffsetResult {
  unit_price:     number;
  setup_fee:      number;
  subtotal:       number;
  platform_fee:   number;
  total_cost:     number;
  breakdown:      Record<string, number>;
}

function calcOffsetCost(p: OffsetParams): OffsetResult {
  // sheets_per_copy: how many physical sheets one copy needs
  const sheets_per_copy = Math.max(1, Math.ceil(p.pages / (p.sides === 'double' ? 2 : 1)));

  // plate_count: for each print form we need `colors` plates per side
  // forms = ceil(pages / pages_per_form), where pages_per_form = 4 for A4, 8 for A5
  // Simplified to ceil(pages / 4) — covers the majority of common formats
  const form_count  = Math.max(1, Math.ceil(p.pages / 4));
  const plate_count = p.colors * form_count * (p.sides === 'double' ? 2 : 1);
  const plate_cost  = plate_count * PLATE_COST;

  // Paper
  const total_sheets = Math.ceil(sheets_per_copy * p.quantity * WASTE_FACTOR);
  const paper_cost   = total_sheets * getPaperPrice(p.paper_gsm);

  // Machine (offset for qty >= 200, digital below that)
  const useOffset     = p.quantity >= 200;
  const machine_rate  = useOffset ? OFFSET_MACHINE_RATE  : DIGITAL_MACHINE_RATE;
  const machine_speed = useOffset ? OFFSET_MACHINE_SPEED : DIGITAL_MACHINE_SPEED;
  const print_cost    = Math.ceil((total_sheets / machine_speed) * machine_rate);

  // Finishing & binding
  const finish_cost  = (FINISHING_COST_PER_COPY[p.finishing] ?? 0) * p.quantity;
  const bind_cost    = (BINDING_COST_PER_COPY[p.binding] ?? 0)     * p.quantity;

  // Rush premium
  const rush_factor  = p.rush ? 1.35 : 1.0;

  // Total direct production cost
  const production_cost = Math.round(
    (plate_cost + paper_cost + print_cost + finish_cost + bind_cost + CUTTING_FIXED) * rush_factor,
  );

  // Ensure we never go below minimum offset job charge
  const adjusted_cost = Math.max(production_cost, OFFSET_MIN_JOB);

  // Overhead + margin
  const with_overhead  = Math.round(adjusted_cost * (1 + OVERHEAD_RATE));
  const with_margin    = Math.round(with_overhead  * (1 + PLATFORM_MARGIN));

  const unit_price   = Math.ceil(with_margin / p.quantity);
  const subtotal     = unit_price * p.quantity;
  const platform_fee = Math.round(subtotal * PLATFORM_MARGIN);

  return {
    unit_price,
    setup_fee:    plate_cost,
    subtotal,
    platform_fee,
    total_cost:   with_margin,
    breakdown: {
      sheets_per_copy,
      total_sheets,
      plate_count,
      plate_cost,
      paper_cost,
      print_cost,
      finish_cost,
      bind_cost,
      production_cost,
      overhead: Math.round(adjusted_cost * OVERHEAD_RATE),
      margin:   Math.round(with_overhead * PLATFORM_MARGIN),
      rush_factor,
    },
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(PricingRule)
    private rulesRepo: Repository<PricingRule>,
  ) {}

  async calculateQuote(input: QuoteInput): Promise<QuoteResult> {
    const product = await this.productRepo.findOne({
      where: { id: input.product_id, is_active: true },
    });
    if (!product) throw new NotFoundException('Бүтээгдэхүүн олдсонгүй');

    const quantity    = Math.max(1, input.quantity);
    const opts        = input.options ?? {};

    // ── Extract print parameters from options ─────────────────────────────
    const pages_raw     = extractNum(opts, ['pages', 'хуудас', 'хуудасны тоо', 'page_count'], 1);
    const pages         = Math.max(1, pages_raw);
    const sides_raw     = extractStr(opts, ['sides', 'хэвлэлийн тал', 'тал'], 'single');
    const sides: 'single' | 'double' = sides_raw.includes('2') ||
      sides_raw.toLowerCase().includes('double') ||
      sides_raw.includes('2 тал')
        ? 'double'
        : 'single';
    const paper_gsm     = extractNum(opts, ['paper_gsm', 'gsm', 'цаасны жин', 'грамм'], 150);
    const colors_raw    = extractStr(opts, ['colors', 'color_mode', 'өнгийн тоо', 'өнгө'], 'color');
    const colors        = colors_raw.includes('1') || colors_raw.toLowerCase().includes('bw') ||
      colors_raw.toLowerCase().includes('black') || colors_raw.includes('хар')
        ? 1
        : 4;
    const finishing_raw = extractStr(opts, ['finishing', 'арчаалт', 'ламинат'], 'none');
    const binding_raw   = extractStr(opts, ['binding', 'оёлт', 'хавтас', 'нуруу'], 'none');
    const finishing     = mapFinishing(finishing_raw);
    const binding       = mapBinding(binding_raw);

    // ── Decide pricing strategy ────────────────────────────────────────────
    // Use cost-based offset engine for print products.
    // Use simple base-price model for 'ready' products (merchandise, etc.).
    const useOffsetEngine = product.product_type === 'print';

    let unit_price: number;
    let setup_fee: number;
    let engine_breakdown: Record<string, any> = {};

    if (useOffsetEngine) {
      // Cost-based offset / digital print calculation
      const result = calcOffsetCost({
        quantity,
        pages,
        sides,
        paper_gsm,
        colors,
        finishing,
        binding,
        rush: !!input.rush,
      });
      unit_price       = result.unit_price;
      setup_fee        = result.setup_fee;
      engine_breakdown = result.breakdown;

    } else {
      // Simple catalog-price model for ready/merchandise products
      const base_price = Number(product.base_price);

      // Smooth continuous quantity discount (no cliff)
      const qty_discount = Math.min(0.35, Math.log10(Math.max(1, quantity / 50)) * 0.12);
      const qty_multiplier = Math.max(0.65, 1.0 - qty_discount);

      // Apply active pricing rules (respecting min_quantity and price_override)
      const rules = await this.rulesRepo.find({
        where: { product_id: input.product_id, is_active: true },
      });

      let option_delta    = 0.0;  // sum of multiplier deltas
      let option_addition = 0;
      let override_price: number | null = null;
      const applied_rules: string[] = [];

      for (const [key, value] of Object.entries(opts)) {
        const rule = rules.find(
          r => r.attribute_key === key &&
               r.attribute_value === value &&
               (!r.min_quantity || quantity >= r.min_quantity),
        );
        if (!rule) continue;
        if (rule.price_override != null) {
          override_price = Number(rule.price_override);
        } else {
          option_delta    += Number(rule.price_multiplier ?? 0);
          option_addition += Number(rule.price_addition    ?? 0);
        }
        applied_rules.push(`${key}=${value}`);
      }

      const rush_multiplier    = input.rush ? 1.35 : 1.0;
      const option_multiplier  = 1.0 + option_delta;

      unit_price = override_price !== null
        ? Math.round(override_price * rush_multiplier)
        : Math.round(base_price * qty_multiplier * option_multiplier * rush_multiplier + option_addition);

      setup_fee = 0;

      engine_breakdown = {
        base_price,
        qty_multiplier: Math.round(qty_multiplier * 1000) / 1000,
        option_multiplier: Math.round(option_multiplier * 1000) / 1000,
        rush_multiplier,
        option_addition,
        applied_rules,
      };
    }

    const subtotal       = unit_price * quantity + setup_fee;
    const platform_margin = Math.round(subtotal * PLATFORM_MARGIN);
    const delivery_fee   = input.delivery ? 15_000 : 0;
    const total          = subtotal + platform_margin + delivery_fee;

    const valid_until = new Date();
    valid_until.setHours(valid_until.getHours() + 24);

    return {
      product_id:       product.id,
      product_name:     product.name_mn || product.name,
      quantity,
      unit_price,
      setup_fee,
      subtotal,
      platform_margin,
      delivery_fee,
      total,
      currency: 'MNT',
      valid_until: valid_until.toISOString(),
      breakdown: {
        ...engine_breakdown,
        unit_price,
        setup_fee,
        subtotal,
        platform_margin_25pct: platform_margin,
        delivery_fee,
        total,
        pricing_model: useOffsetEngine ? 'offset_cost_based' : 'catalog_multiplier',
        input_params: {
          pages,
          sides,
          paper_gsm,
          colors,
          finishing,
          binding,
        },
      },
    };
  }
}
