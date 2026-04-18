import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Machine } from '../machines/machine.entity'
import pdfParse from 'pdf-parse'
import {
  PLATE_COST,
  DIGITAL_MAX_QTY,
  FINISHING_COST_PER_COPY,
  BINDING_COST_PER_COPY,
  OVERHEAD_RATE,
  PLATFORM_MARGIN,
  WASTE_FACTOR,
  CUTTING_FIXED,
  JOB_MIN_CHARGE,
  getPaperPriceA0,
  getPaperPricePerSheet,
  A4_W,
  A4_H,
} from '../pricing/pricing.constants'

@Injectable()
export class QuoteEngineService {
  constructor(
    @InjectRepository(Machine)
    private machineRepo: Repository<Machine>,
  ) {}

  async calculateFromPdf(file: Express.Multer.File, input: any) {
    const data = await pdfParse(file.buffer)
    const pages = data.numpages || 1
    return this.calculate({ ...input, pages })
  }

  async calculate(input: any) {
    const quantity   = Number(input.quantity)   || 100
    const pages      = Number(input.pages)      || 1
    const width_mm   = Number(input.width_mm)   || 210
    const height_mm  = Number(input.height_mm)  || 297
    const color_mode = input.color_mode || 'color'
    const sides      = input.sides      || 'single'
    const paper_gsm  = Number(input.paper_gsm)  || 150
    const finishing  = input.finishing  || 'none'
    const binding    = input.binding    || 'none'

    const size = this.detectSize(width_mm, height_mm)

    // Logical print sides per copy (= number of machine impressions per copy)
    const sheets_per_copy = Math.ceil(pages / (sides === 'double' ? 2 : 1))

    // ── Machine selection (from DB) ─────────────────────────────────────────
    const machineSelection = await this.selectBestMachine({
      quantity, width_mm, height_mm, color_mode,
    })

    const imposition    = machineSelection.bestFit ?? 1
    const machine_name  = machineSelection.machine?.name ?? 'Digital Press'
    const machine_speed = machineSelection.machine?.speed_per_hour ?? 3_000
    const hour_rate     = machineSelection.machine?.hour_rate ?? 50_000
    const sheet_w       = machineSelection.machine?.sheet_width_mm  ?? A4_W
    const sheet_h       = machineSelection.machine?.sheet_height_mm ?? A4_H

    // ── Sheet count (includes 5 % waste) ───────────────────────────────────
    const total_sheets = Math.ceil((quantity * sheets_per_copy * WASTE_FACTOR) / imposition)

    // ── Machine run time ───────────────────────────────────────────────────
    const print_hours  = total_sheets / machine_speed
    // B&W / spot color costs 40 % of full-color rate (matches two-rate digital model)
    const color_rate   = color_mode === 'color' ? 1.0 : 0.4
    // Number of ink colors for plate count calculation
    const colors       = color_mode === 'color' ? 4 : 1

    // ── Variable costs (per quantity) ──────────────────────────────────────
    // Paper price is derived from A0 base price scaled to actual machine sheet size
    const paper_price_per_sheet = getPaperPricePerSheet(paper_gsm, sheet_w, sheet_h)
    const paper_cost     = Math.round(total_sheets * paper_price_per_sheet)
    const print_cost     = Math.round(print_hours  * hour_rate * color_rate)
    const finishing_cost = (FINISHING_COST_PER_COPY[finishing] ?? 0) * quantity
    const binding_cost   = (BINDING_COST_PER_COPY[binding]     ?? 0) * quantity
    const direct_cost    = paper_cost + print_cost + finishing_cost + binding_cost

    // ── Setup / plate costs ────────────────────────────────────────────────
    // Offset press: CTP plates required (one plate per color per press form).
    // Digital press: no plates, but cutting/trimming still applies.
    // Press selection mirrors pricing.service.ts: offset when qty > DIGITAL_MAX_QTY.
    const use_offset  = quantity > DIGITAL_MAX_QTY

    // One "press form" covers 4 finished pages × imposition items per sheet.
    // e.g. 4pp A5 at 2-up on B2 → pages_per_form = 8 → 1 form for the whole job.
    const pages_per_form = 4 * imposition
    const form_count     = Math.max(1, Math.ceil(pages / pages_per_form))
    const plate_count    = use_offset
      ? colors * form_count * (sides === 'double' ? 2 : 1)
      : 0
    const setup_raw      = plate_count * PLATE_COST + CUTTING_FIXED

    // ── Apply overhead (15 %) to both variable and setup costs ─────────────
    const overhead    = Math.round((direct_cost + setup_raw) * OVERHEAD_RATE)
    const subtotal    = direct_cost + setup_raw + overhead

    // ── Platform margin (25 %) on top of full production cost ──────────────
    const margin      = Math.round(subtotal * PLATFORM_MARGIN)
    const total_price = Math.max(subtotal + margin, JOB_MIN_CHARGE)
    const unit_price  = Math.round(total_price / quantity)

    return {
      quantity, pages, size, width_mm, height_mm,
      color_mode, sides, paper_gsm, finishing, binding,
      sheets_per_copy, total_sheets,
      imposition_per_sheet: imposition,
      rotated: machineSelection.rotated,
      machine: machine_name,
      machine_speed,
      machine_sheet: machineSelection.machine
        ? { w: sheet_w, h: sheet_h }
        : null,
      print_hours: Math.round(print_hours * 100) / 100,
      paper_cost, print_cost, finishing_cost, binding_cost,
      setup_cost: setup_raw, plate_count, use_offset,
      subtotal, overhead, margin,
      total_price, unit_price,
      currency: 'MNT',
      breakdown: {
        paper_price_per_sheet,
        paper_price_a0_base: getPaperPriceA0(paper_gsm),
        color_rate,
        hour_rate,
        print_hours,
        use_offset,
        plate_count,
        overhead_rate:  OVERHEAD_RATE,
        overhead_15pct: overhead,
        margin_rate:    PLATFORM_MARGIN,
        margin_25pct:   margin,
      },
    }
  }

  detectSize(w: number, h: number) {
    const W = Math.min(w, h), H = Math.max(w, h)
    if (W >= 195 && W <= 225 && H >= 280 && H <= 315) return 'A4'
    if (W >= 138 && W <= 158 && H >= 195 && H <= 225) return 'A5'
    if (W >= 280 && W <= 315 && H >= 400 && H <= 440) return 'A3'
    if (W >=  85 && W <=  95 && H >=  50 && H <=  60) return 'BusinessCard'
    return 'Custom'
  }

  /**
   * Compute best fit (imposition) per machine sheet, trying both normal and
   * 90°-rotated orientations.
   */
  private computeSheetFit(machine: Machine, width: number, height: number) {
    const fitNormal =
      Math.floor(machine.sheet_width_mm  / width)  *
      Math.floor(machine.sheet_height_mm / height)

    const fitRotated =
      Math.floor(machine.sheet_width_mm  / height) *
      Math.floor(machine.sheet_height_mm / width)

    if (fitRotated > fitNormal) {
      return { fit: Math.max(fitRotated, 1), rotated: true }
    }
    return { fit: Math.max(fitNormal, 1), rotated: false }
  }

  /**
   * Select the lowest-cost machine for the given job parameters.
   * Cost model: (total_sheets / speed) × hour_rate × color_multiplier
   */
  async selectBestMachine(params: {
    quantity:   number
    width_mm:   number
    height_mm:  number
    color_mode: string
  }) {
    const machines = await this.machineRepo.find()
    if (!machines.length) {
      return { machine: null, bestFit: 1, rotated: false }
    }

    const { quantity, width_mm, height_mm, color_mode } = params
    const colorMultiplier = color_mode === 'color' ? 1.0 : 0.4

    let best: {
      machine: Machine
      cost:    number
      fit:     number
      rotated: boolean
    } | null = null

    for (const machine of machines) {
      const fitResult = this.computeSheetFit(machine, width_mm, height_mm)
      const fit = fitResult.fit || 1
      if (fit <= 0) continue

      const total_sheets = Math.ceil(quantity / fit)
      const hours = total_sheets / machine.speed_per_hour
      const cost  = hours * machine.hour_rate * colorMultiplier

      if (!best || cost < best.cost) {
        best = { machine, cost, fit, rotated: fitResult.rotated }
      }
    }

    if (!best) {
      return { machine: null, bestFit: 1, rotated: false }
    }

    return { machine: best.machine, bestFit: best.fit, rotated: best.rotated }
  }
}
