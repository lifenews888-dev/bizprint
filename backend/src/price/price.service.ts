import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { PaperType } from '../paper-types/paper-type.entity'
import { PrintSize } from './print-size.entity'
import { FinishType } from './finish-type.entity'
import { Machine } from '../machines/machine.entity'

@Injectable()
export class PriceService {

  constructor(
    @InjectRepository(PaperType)
    private paperRepo: Repository<PaperType>,

    @InjectRepository(PrintSize)
    private sizeRepo: Repository<PrintSize>,

    @InjectRepository(FinishType)
    private finishRepo: Repository<FinishType>,

    @InjectRepository(Machine)
    private machineRepo: Repository<Machine>,
  ) {}

  async printQuote(data: any) {

    const paper = await this.paperRepo.findOne({
      where: { id: data.paper_id }
    })

    if (!paper) {
      throw new NotFoundException('Paper type not found')
    }

    const size = await this.sizeRepo.findOne({
      where: { id: data.size_id }
    })

    if (!size) {
      throw new NotFoundException('Print size not found')
    }

    const machines = await this.machineRepo.find()

    let bestMachine: Machine | null = null
    let bestCost = Infinity

    let sheet_capacity = 0
    let sheets_needed = 0
    let waste_percent = 0

    for (const machine of machines) {

      const sheet_width = machine.sheet_width_mm
      const sheet_height = machine.sheet_height_mm

      const normal_x = Math.floor(sheet_width / size.width_mm)
      const normal_y = Math.floor(sheet_height / size.height_mm)
      const normal_capacity = normal_x * normal_y

      const rotated_x = Math.floor(sheet_width / size.height_mm)
      const rotated_y = Math.floor(sheet_height / size.width_mm)
      const rotated_capacity = rotated_x * rotated_y

      const capacity = Math.max(normal_capacity, rotated_capacity)

      if (capacity <= 0) continue

      const sheets = Math.ceil(data.quantity / capacity)

      const run_time =
        sheets / machine.speed_per_hour

      const machine_cost =
        run_time * machine.hour_rate

      if (machine_cost < bestCost) {

        bestCost = machine_cost
        bestMachine = machine

        sheet_capacity = capacity
        sheets_needed = sheets

        const sheet_area = sheet_width * sheet_height
        const used_area = capacity * (size.width_mm * size.height_mm)

        waste_percent =
          ((sheet_area - used_area) / sheet_area) * 100
      }

    }

    if (!bestMachine) {
      throw new NotFoundException('No suitable machine found')
    }

    const paper_cost =
      sheets_needed * paper.price_per_sheet

    const production_cost =
      paper_cost + bestCost

    const unit_price =
      production_cost / data.quantity

    const total_price =
      production_cost * 1.4

    return {

      machine: bestMachine.name,

      sheet_capacity,
      sheets_needed,

      paper_cost,
      machine_cost: bestCost,

      production_cost,

      unit_price,
      total_price,

      waste_percent

    }

  }

  async gangQuote(data: any) {

    const paper = await this.paperRepo.findOne({
      where: { id: data.paper_id }
    })

    if (!paper) {
      throw new NotFoundException('Paper type not found')
    }

    const size = await this.sizeRepo.findOne({
      where: { id: data.size_id }
    })

    if (!size) {
      throw new NotFoundException('Print size not found')
    }

    const machines = await this.machineRepo.find()

    let bestMachine: Machine | null = null
    let bestCost = Infinity

    let sheet_capacity = 0
    let sheets_needed = 0

    const total_quantity =
      data.orders.reduce((sum: number, o: any) => sum + o.quantity, 0)

    for (const machine of machines) {

      const normal_x =
        Math.floor(machine.sheet_width_mm / size.width_mm)

      const normal_y =
        Math.floor(machine.sheet_height_mm / size.height_mm)

      const normal_capacity =
        normal_x * normal_y

      const rotated_x =
        Math.floor(machine.sheet_width_mm / size.height_mm)

      const rotated_y =
        Math.floor(machine.sheet_height_mm / size.width_mm)

      const rotated_capacity =
        rotated_x * rotated_y

      const capacity =
        Math.max(normal_capacity, rotated_capacity)

      if (capacity <= 0) continue

      const sheets =
        Math.ceil(total_quantity / capacity)

      const run_time =
        sheets / machine.speed_per_hour

      const machine_cost =
        run_time * machine.hour_rate

      if (machine_cost < bestCost) {

        bestCost = machine_cost
        bestMachine = machine

        sheet_capacity = capacity
        sheets_needed = sheets
      }

    }

    if (!bestMachine) {
      throw new NotFoundException('No suitable machine found')
    }

    const paper_cost =
      sheets_needed * paper.price_per_sheet

    const production_cost =
      paper_cost + bestCost

    const total_price =
      production_cost * 1.4

    const price_per_order =
      data.orders.map((order: any) => {

        const ratio =
          order.quantity / total_quantity

        return {
          name: order.name,
          quantity: order.quantity,
          price: total_price * ratio
        }

      })

    return {

      machine: bestMachine.name,

      sheet_capacity,
      sheets_needed,

      total_quantity,

      production_cost,
      total_price,

      orders: price_per_order

    }

  }

}