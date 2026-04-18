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

/** Offset press: ₮50,000/hr, 4,000 sheets/hr → ₮12.5/sheet */
const OFFSET_MACHINE_RATE  = 50_000;
const OFFSET_MACHINE_SPEED = 4_000;

/** Digital B&W: ₮40/sheet → ₮60,000/hr at 1,500 sheets/hr */
const DIGITAL_BW_RATE    = 60_000;
/** Digital Color (CMYK): ₮120/sheet → ₮180,000/hr at 1,500 sheets/hr */
const DIGITAL_COLOR_RATE = 180_000;
const DIGITAL_MACHINE_SPEED = 1_500;

/** Minimum quantity to even consider switching to offset press */
const OFFSET_MIN_QTY = 200;

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
  none:            0,
  staple:        100,
  saddle_stitch: 150,
  perfect:       700,
  spiral:       1000,
  wire_o:       1200,
  hardcover:    3500,
};

/** Overhead on direct production cost */
const OVERHEAD_RATE   = 0.15;
/** Platform service margin (shown as separate line to customer) */
const PLATFORM_MARGIN = 0.25;
/** Paper waste factor */
const WASTE_FACTOR    = 1.05;
/** Minimum cutting/trimming charge per job */
const CUTTING_FIXED   = 8_000;
/** Minimum total charge for any print job */
const JOB_MIN_CHARGE  = 50_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPaperPrice(gsm: number): number {
  const brackets = Object.keys(PAPER_PRICE).map(Number).sort((a, b) => a - b);
  for (const b of brackets) {
    if (gsm <= b) return PAPER_PRICE[b];
  }
  return PAPER_PRICE[350];
}

/**
 * Extract a numeric value from options, trying multiple possible key names.
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

// ─── Print cost engine ────────────────────────────────────────────────────────

interface PrintParams {
  quantity:   number;
  pages:      number;
  sides:      'single' | 'double';
  paper_gsm:  number;
  colors:     number;  // 1 = B&W / spot, 4 = CMYK
  finishing:  string;
  binding:    string;
  rush:       boolean;
}

interface PrintResult {
  unit_price:    number;   // per-copy variable cost (paper+print+finishing+binding) with overhead
  setup_fee:     number;   // one-time fixed cost (plates+cutting) with overhead
  subtotal:      number;   // unit_price × qty + setup_fee
  platform_fee:  number;   // 25% of subtotal (informational, added in outer layer)
  total_cost:    number;   // same as subtotal (pre-platform total)
  press:         'offset' | 'digital';
  breakdown:     Record<string, number | boolean>;
}

/**
 * Calculate production cost for a specific press technology.
 *
 * unit_price  = variable cost per copy (paper + machine time + finishing + binding)
 *               × rush × (1 + overhead)  — NO platform margin embedded
 * setup_fee   = fixed one-time cost (plates + cutting)
 *               × rush × (1 + overhead)  — NO platform margin embedded
 *
 * Platform margin (25%) is added by the caller on top of (unit_price × qty + setup_fee).
 * This avoids double-counting.
 */
function calcForPress(p: PrintParams, useOffset: boolean): PrintResult {
  const rush_factor = p.rush ? 1.35 : 1.0;

  // ── Machine selection ─────────────────────────────────────────────────────
  const machine_rate  = useOffset
    ? OFFSET_MACHINE_RATE
    : (p.colors === 4 ? DIGITAL_COLOR_RATE : DIGITAL_BW_RATE);
  const machine_speed = useOffset ? OFFSET_MACHINE_SPEED : DIGITAL_MACHINE_SPEED;

  // ── Plate setup (OFFSET ONLY — digital presses don't use CTP plates) ──────
  const form_count  = Math.max(1, Math.ceil(p.pages / 4));
  const plate_count = useOffset
    ? p.colors * form_count * (p.sides === 'double' ? 2 : 1)
    : 0;
  const plate_cost = plate_count * PLATE_COST;

  // ── Variable production costs (scale with quantity) ───────────────────────
  const sheets_per_copy = Math.max(1, Math.ceil(p.pages / (p.sides === 'double' ? 2 : 1)));
  const total_sheets    = Math.ceil(sheets_per_copy * p.quantity * WASTE_FACTOR);
  const paper_cost      = total_sheets * getPaperPrice(p.paper_gsm);
  const print_cost      = Math.ceil((total_sheets / machine_speed) * machine_rate);
  const finish_cost     = (FINISHING_COST_PER_COPY[p.finishing] ?? 0) * p.quantity;
  const bind_cost       = (BINDING_COST_PER_COPY[p.binding]    ?? 0) * p.quantity;

  const variable_raw = Math.round((paper_cost + print_cost + finish_cost + bind_cost) * rush_factor);
  const variable_oh  = Math.round(variable_raw * (1 + OVERHEAD_RATE));
  const unit_price   = Math.ceil(variable_oh / p.quantity);

  // ── Fixed one-time costs (per job, not per copy) ──────────────────────────
  const fixed_raw = Math.round((plate_cost + CUTTING_FIXED) * rush_factor);
  const setup_fee = Math.round(fixed_raw * (1 + OVERHEAD_RATE));

  const raw_subtotal = unit_price * p.quantity + setup_fee;
  const subtotal     = Math.max(raw_subtotal, JOB_MIN_CHARGE);

  return {
    unit_price,
    setup_fee,
    subtotal,
    platform_fee: Math.round(subtotal * PLATFORM_MARGIN),
    total_cost:   subtotal,
    press:        useOffset ? 'offset' : 'digital',
    breakdown: {
      sheets_per_copy,
      total_sheets,
      plate_count,
      plate_cost,
      paper_cost,
      print_cost,
      finish_cost,
      bind_cost,
      variable_raw,
      fixed_raw,
      rush_factor,
      use_offset_press: useOffset,
    },
  };
}

/**
 * Pick the cheaper technology (digital vs offset) for this job.
 * Offset is only considered at qty ≥ OFFSET_MIN_QTY (200).
 * Both prices are pre-platform; the dynamic selection avoids cliff pricing.
 */
function calcPrintCost(p: PrintParams): PrintResult {
  const digital = calcForPress(p, false);

  if (p.quantity < OFFSET_MIN_QTY) {
    return digital;
  }

  const offset = calcForPress(p, true);

  // Pick whichever is cheaper for the customer
  return offset.subtotal < digital.subtotal ? offset : digital;
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

    const quantity = Math.max(1, input.quantity);
    const opts     = input.options ?? {};

    // ── Extract print parameters from options ─────────────────────────────
    const pages_raw  = extractNum(opts, ['pages', 'хуудас', 'хуудасны тоо', 'page_count'], 1);
    const pages      = Math.max(1, pages_raw);
    const sides_raw  = extractStr(opts, ['sides', 'хэвлэлийн тал', 'тал'], 'single');
    const sides: 'single' | 'double' =
      sides_raw.includes('2') ||
      sides_raw.toLowerCase().includes('double') ||
      sides_raw.includes('2 тал')
        ? 'double'
        : 'single';
    const paper_gsm     = extractNum(opts, ['paper_gsm', 'gsm', 'цаасны жин', 'грамм'], 150);
    const colors_raw    = extractStr(opts, ['colors', 'color_mode', 'өнгийн тоо', 'өнгө'], 'color');
    const colors        =
      colors_raw.includes('1') ||
      colors_raw.toLowerCase().includes('bw') ||
      colors_raw.toLowerCase().includes('black') ||
      colors_raw.includes('хар')
        ? 1
        : 4;
    const finishing_raw = extractStr(opts, ['finishing', 'арчаалт', 'ламинат'], 'none');
    const binding_raw   = extractStr(opts, ['binding', 'оёлт', 'хавтас', 'нуруу'], 'none');
    const finishing     = mapFinishing(finishing_raw);
    const binding       = mapBinding(binding_raw);

    // ── Decide pricing strategy ────────────────────────────────────────────
    const useOffsetEngine = product.product_type === 'print';

    let unit_price: number;
    let setup_fee: number;
    let engine_breakdown: Record<string, any> = {};

    if (useOffsetEngine) {
      // ── Cost-based print calculation (digital or offset, auto-selected) ──
      const result = calcPrintCost({
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
      engine_breakdown = { ...result.breakdown, press: result.press };

      // unit_price and setup_fee already include overhead but NOT platform margin.
      // Compute subtotal here and add platform margin cleanly below.
      const pre_margin_subtotal = unit_price * quantity + setup_fee;
      const platform_margin     = Math.round(pre_margin_subtotal * PLATFORM_MARGIN);
      const delivery_fee        = input.delivery ? 15_000 : 0;
      const total               = pre_margin_subtotal + platform_margin + delivery_fee;

      const valid_until = new Date();
      valid_until.setHours(valid_until.getHours() + 24);

      return {
        product_id:       product.id,
        product_name:     product.name_mn || product.name,
        quantity,
        unit_price,
        setup_fee,
        subtotal:         pre_margin_subtotal,
        platform_margin,
        delivery_fee,
        total,
        currency: 'MNT',
        valid_until: valid_until.toISOString(),
        breakdown: {
          ...engine_breakdown,
          unit_price,
          setup_fee,
          subtotal:              pre_margin_subtotal,
          platform_margin_25pct: platform_margin,
          delivery_fee,
          total,
          pricing_model: 'print_cost_based',
          input_params: { pages, sides, paper_gsm, colors, finishing, binding },
        },
      };

    } else {
      // ── Simple catalog-price model for ready/merchandise products ─────────
      const base_price = Number(product.base_price);

      // Smooth continuous quantity discount (no cliff)
      const qty_discount   = Math.min(0.35, Math.log10(Math.max(1, quantity / 50)) * 0.12);
      const qty_multiplier = Math.max(0.65, 1.0 - qty_discount);

      const rules = await this.rulesRepo.find({
        where: { product_id: input.product_id, is_active: true },
      });

      let option_delta    = 0.0;
      let option_addition = 0;
      let override_price: number | null = null;
      const applied_rules: string[] = [];

      for (const [key, value] of Object.entries(opts)) {
        const rule = rules.find(
          r =>
            r.attribute_key === key &&
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

      const rush_multiplier   = input.rush ? 1.35 : 1.0;
      const option_multiplier = 1.0 + option_delta;

      unit_price = override_price !== null
        ? Math.round(override_price * rush_multiplier)
        : Math.round(
            base_price * qty_multiplier * option_multiplier * rush_multiplier +
            option_addition,
          );

      setup_fee = 0;

      engine_breakdown = {
        base_price,
        qty_multiplier:    Math.round(qty_multiplier    * 1000) / 1000,
        option_multiplier: Math.round(option_multiplier * 1000) / 1000,
        rush_multiplier,
        option_addition,
        applied_rules,
      };
    }

    // ── Final totals (catalog path) ────────────────────────────────────────
    const subtotal        = unit_price * quantity + setup_fee;
    const platform_margin = Math.round(subtotal * PLATFORM_MARGIN);
    const delivery_fee    = input.delivery ? 15_000 : 0;
    const total           = subtotal + platform_margin + delivery_fee;

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
        pricing_model: 'catalog_multiplier',
        input_params: { pages, sides, paper_gsm, colors, finishing, binding },
      },
    };
  }
}
