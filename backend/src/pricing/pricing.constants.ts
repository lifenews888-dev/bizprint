/**
 * pricing.constants.ts — SINGLE SOURCE OF TRUTH for all print pricing constants.
 *
 * All monetary values in MNT (Mongolian Tögrög).
 * Paper prices are based on Mongolian import market 2024-2025.
 *
 * Both pricing.service.ts and quote-engine.service.ts import from here.
 * Never hardcode pricing values in service files — update only this file.
 */

// ─── Paper format dimensions (mm) ────────────────────────────────────────────

export const A0_W    = 841;
export const A0_H    = 1189;
export const A0_AREA = A0_W * A0_H;   // 1,000,049 mm²  ≈ 1.00 m²

export const B0_W    = 1000;
export const B0_H    = 1414;
export const B0_AREA = B0_W * B0_H;   // 1,414,000 mm²  ≈ 1.41 m²

export const A4_W    = 210;
export const A4_H    = 297;
export const A4_AREA = A4_W * A4_H;   // 62,370 mm²

// ─── Paper prices per A0 parent sheet (₮) ────────────────────────────────────
//
// This is the natural purchase unit in Mongolia: printers buy paper as A0 (or
// B0) parent sheets and cut them to press-sheet size.  Prices below reflect
// offset-grade coated/uncoated stock as sold by major Mongolian importers
// (2024-2025 market).  Update these when market prices change; derived values
// (PAPER_PRICE, getPaperPricePerSheet) will automatically follow.
//
// GSM  │ A0 price (₮) │ note
// ─────┼──────────────┼──────────────────────────────────────────────────────
//  60  │    480       │ newsprint / economy offset
//  80  │    610       │ standard uncoated offset
//  90  │    720       │ premium uncoated
// 100  │    880       │ coated 1-side
// 115  │  1,090       │ coated 2-sides (gloss/matte)
// 130  │  1,280       │ medium coated
// 150  │  1,472       │ coated premium (brochures)
// 170  │  1,840       │ thick coated
// 200  │  2,240       │ card stock light
// 250  │  2,880       │ card stock medium
// 300  │  3,600       │ card stock heavy
// 350  │  4,400       │ thick board

export const PAPER_PRICE_A0: Record<number, number> = {
   60:   480,
   80:   610,
   90:   720,
  100:   880,
  115: 1_090,
  130: 1_280,
  150: 1_472,
  170: 1_840,
  200: 2_240,
  250: 2_880,
  300: 3_600,
  350: 4_400,
};

// ─── Paper price lookup helpers ───────────────────────────────────────────────

/**
 * Return the price of an A0 sheet at the given GSM.
 * Uses nearest-ceiling bracket (e.g. 95 gsm → 100 bracket).
 */
export function getPaperPriceA0(gsm: number): number {
  const brackets = Object.keys(PAPER_PRICE_A0).map(Number).sort((a, b) => a - b);
  for (const b of brackets) {
    if (gsm <= b) return PAPER_PRICE_A0[b];
  }
  return PAPER_PRICE_A0[350];
}

/**
 * Return the price for one press sheet of the given size (w × h mm).
 * Scales linearly from the A0 base price by area.
 *
 * Used by quote-engine when it knows the actual machine sheet dimensions.
 * e.g. B2 sheet (520×740mm):  610 × (520×740 / 1,000,049) ≈ ₮236/sheet at 80GSM
 */
export function getPaperPricePerSheet(gsm: number, sheet_w: number, sheet_h: number): number {
  const a0_price   = getPaperPriceA0(gsm);
  const sheet_area = sheet_w * sheet_h;
  return Math.round(a0_price * sheet_area / A0_AREA);
}

/**
 * Return price per A4-equivalent area unit.
 * Used by pricing.service.ts which normalises everything to A4 area before computing.
 */
export function getPaperPrice(gsm: number): number {
  return getPaperPricePerSheet(gsm, A4_W, A4_H);
}

/**
 * Pre-computed PAPER_PRICE table (per A4-equivalent area) derived from
 * PAPER_PRICE_A0.  Kept for easy reference; identical to calling getPaperPrice().
 */
export const PAPER_PRICE: Record<number, number> = Object.fromEntries(
  Object.keys(PAPER_PRICE_A0).map(gsm => [
    Number(gsm),
    getPaperPricePerSheet(Number(gsm), A4_W, A4_H),
  ]),
);

// ─── Finishing costs per copy (₮) ────────────────────────────────────────────
//
// "Per copy" means per finished A4-size product.  For smaller items (A5, biz-
// card, etc.) the caller should scale by area if desired, but for simplicity
// the engine treats finishing as a flat per-copy charge.

export const FINISHING_COST_PER_COPY: Record<string, number> = {
  none:             0,
  laminate_matte:  90,
  laminate_gloss:  80,
  soft_touch:     140,
  uv:              70,
  fold:            25,
  spot_uv:        110,
};

// ─── Binding costs per copy (₮) ──────────────────────────────────────────────

export const BINDING_COST_PER_COPY: Record<string, number> = {
  none:             0,
  staple:         100,
  saddle_stitch:  150,
  perfect:        700,
  spiral:       1_000,
  wire_o:       1_200,
  hardcover:    3_500,
};

// ─── Rate constants ───────────────────────────────────────────────────────────

/** CTP plate making cost per plate (Mongolian market, 2024-2025) */
export const PLATE_COST = 30_000;

/** Offset press: ₮50,000/hr running cost, 4,000 sheets/hr */
export const OFFSET_MACHINE_RATE  = 50_000;
export const OFFSET_MACHINE_SPEED =  4_000;

/** Digital B&W press: ₮60,000/hr at 1,500 sheets/hr (≈ ₮40/sheet) */
export const DIGITAL_BW_RATE    =  60_000;
/** Digital Color (CMYK) press: ₮180,000/hr at 1,500 sheets/hr (≈ ₮120/sheet) */
export const DIGITAL_COLOR_RATE = 180_000;
export const DIGITAL_MACHINE_SPEED = 1_500;

/** Quantity threshold: ≤ this value → digital short-run; > → offset press */
export const DIGITAL_MAX_QTY = 300;

/** Overhead factor applied to all direct production costs */
export const OVERHEAD_RATE = 0.15;

/** Platform service margin added on top of production cost + overhead */
export const PLATFORM_MARGIN = 0.25;

/** Extra sheet factor for press waste / makeready spoilage */
export const WASTE_FACTOR = 1.05;

/** Fixed cutting/trimming charge per job (every job gets cut after printing) */
export const CUTTING_FIXED = 8_000;

/** Absolute minimum charge for any print job (covers minimum viable run) */
export const JOB_MIN_CHARGE = 50_000;
