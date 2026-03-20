import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Machine } from '../machines/machine.entity'
import pdfParse from 'pdf-parse'

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
    const quantity  = Number(input.quantity)  || 100
    const pages     = Number(input.pages)     || 1
    const width_mm  = Number(input.width_mm)  || 210
    const height_mm = Number(input.height_mm) || 297
    const color_mode = input.color_mode || 'color'
    const sides     = input.sides || 'single'
    const paper_gsm = Number(input.paper_gsm) || 150
    const finishing = input.finishing || 'none'
    const binding   = input.binding   || 'none'

    const size = this.detectSize(width_mm, height_mm)

    const sheets_per_copy = Math.ceil(pages / (sides === 'double' ? 2 : 1))

    const machineSelection = await this.selectBestMachine({
      quantity,
      width_mm,
      height_mm,
      color_mode,
    })

    const imposition = machineSelection.bestFit ?? 1
    const total_sheets = Math.ceil((quantity * sheets_per_copy) / imposition)

    const machine_name  = machineSelection.machine?.name ?? 'Digital Press'
    const machine_speed = machineSelection.machine?.speed_per_hour ?? 3000
    const hour_rate     = machineSelection.machine?.hour_rate ?? 50000

    const print_hours = total_sheets / machine_speed
    const color_rate  = color_mode === 'color' ? 1.0 : 0.4

    const paper_cost     = Math.round(total_sheets * this.getPaperPrice(paper_gsm))
    const print_cost     = Math.round(print_hours * hour_rate * color_rate)
    const finishing_cost = this.getFinishingCost(finishing, quantity)
    const binding_cost   = this.getBindingCost(binding, quantity)
    const setup_cost     = quantity < 500 ? 50000 : quantity < 2000 ? 30000 : 0

    const subtotal    = paper_cost + print_cost + finishing_cost + binding_cost + setup_cost
    const overhead    = Math.round(subtotal * 0.10)
    const margin      = Math.round((subtotal + overhead) * 0.20)
    const total_price = subtotal + overhead + margin
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
        ? { w: machineSelection.machine.sheet_width_mm, h: machineSelection.machine.sheet_height_mm }
        : null,
      print_hours: Math.round(print_hours * 100) / 100,
      paper_cost, print_cost, finishing_cost, binding_cost,
      setup_cost, subtotal, overhead, margin,
      total_price, unit_price,
      currency: 'MNT',
      breakdown: {
        paper_price_per_sheet: this.getPaperPrice(paper_gsm),
        color_rate, hour_rate, print_hours,
        overhead_10pct: overhead,
        margin_20pct: margin,
      },
    }
  }

  detectSize(w: number, h: number) {
    const W = Math.min(w, h), H = Math.max(w, h)
    if (W >= 195 && W <= 225 && H >= 280 && H <= 315) return 'A4'
    if (W >= 138 && W <= 158 && H >= 195 && H <= 225) return 'A5'
    if (W >= 280 && W <= 315 && H >= 400 && H <= 440) return 'A3'
    if (W >= 85  && W <= 95  && H >= 50  && H <= 60)  return 'BusinessCard'
    return 'Custom'
  }

  /**
   * Compute best fit (imposition) per machine with 90° rotation option.
   */
  private computeSheetFit(machine: Machine, width: number, height: number) {
    const fitNormal =
      Math.floor(machine.sheet_width_mm / width) *
      Math.floor(machine.sheet_height_mm / height)

    const fitRotated =
      Math.floor(machine.sheet_width_mm / height) *
      Math.floor(machine.sheet_height_mm / width)

    if (fitRotated > fitNormal) {
      return { fit: Math.max(fitRotated, 1), rotated: true }
    }

    return { fit: Math.max(fitNormal, 1), rotated: false }
  }

  getPaperPrice(gsm: number) {
    if (gsm <= 90)  return 35
    if (gsm <= 115) return 45
    if (gsm <= 150) return 60
    if (gsm <= 200) return 85
    if (gsm <= 250) return 110
    if (gsm <= 300) return 145
    if (gsm <= 350) return 180
    return 220
  }

  getFinishingCost(finishing: string, quantity: number) {
    const rates: Record<string, number> = {
      'none': 0, 'laminate_matte': 80, 'laminate_gloss': 75,
      'soft_touch': 120, 'uv': 60, 'fold': 30,
    }
    return Math.round((rates[finishing] || 0) * quantity)
  }

  getBindingCost(binding: string, quantity: number) {
    const rates: Record<string, number> = {
      'none': 0, 'staple': 50, 'perfect': 800,
      'spiral': 1200, 'hardcover': 3500,
    }
    return Math.round((rates[binding] || 0) * quantity)
  }

  /**
   * Select the lowest-cost machine + imposition given size & quantity.
   */
  async selectBestMachine(params: {
    quantity: number
    width_mm: number
    height_mm: number
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
      cost: number
      fit: number
      rotated: boolean
    } | null = null

    for (const machine of machines) {
      const fitResult = this.computeSheetFit(machine, width_mm, height_mm)
      const fit = fitResult.fit || 1
      if (fit <= 0) continue

      const total_sheets = Math.ceil(quantity / fit)
      const hours = total_sheets / machine.speed_per_hour
      const cost = hours * machine.hour_rate * colorMultiplier

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
