import { Injectable } from '@nestjs/common'
import { CreateQuoteDto } from './dto/create-quote.dto'

@Injectable()
export class QuoteService {

  calculateQuote(data: CreateQuoteDto) {

    const gsm = Number(data.gsm)
    const quantity = Number(data.quantity)

    const paperCost = this.calculatePaperCost(gsm, quantity)
    const printCost = this.calculatePrintCost(quantity)
    const finishingCost = this.calculateFinishingCost(data.finishing, quantity)

    const subtotal = paperCost + printCost + finishingCost
    const margin = subtotal * 0.25
    const total = subtotal + margin

    return {
      paper_cost: paperCost,
      print_cost: printCost,
      finishing_cost: finishingCost,
      margin,
      total_price: total,
      production_time: this.calculateProductionTime(quantity),
      recommended_machine: this.selectMachine(quantity)
    }
  }

  calculatePaperCost(gsm: number, quantity: number) {

    const sheetPrice = gsm * 0.01
    return sheetPrice * quantity
  }

  calculatePrintCost(quantity: number) {

    const machineRate = 50
    const speedPerHour = 5000

    const hours = quantity / speedPerHour

    return hours * machineRate
  }

  calculateFinishingCost(finishing: string | undefined, quantity: number) {

    if (!finishing) return 0

    const finishingRates: Record<string, number> = {
      laminate: 0.2,
      uv: 0.15,
      fold: 0.05
    }

    const rate = finishingRates[finishing] || 0

    return rate * quantity
  }

  calculateProductionTime(quantity: number) {

    const speedPerHour = 5000
    const hours = quantity / speedPerHour

    return `${Math.ceil(hours)} hour`
  }

  selectMachine(quantity: number) {

    if (quantity < 500) return 'Digital Press'
    if (quantity < 5000) return 'Konica Minolta'

    return 'Offset Heidelberg'
  }

}