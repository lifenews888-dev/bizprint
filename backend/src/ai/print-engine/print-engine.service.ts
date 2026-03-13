import { Injectable } from '@nestjs/common'

@Injectable()
export class PrintEngineService {

  run(data: any) {

    const quote = this.calculateQuote(data)

    const machine = this.selectMachine(data)

    const gang = this.optimizeGangRun(data)

    const production = this.scheduleProduction(data)

    const price = this.calculatePrice(quote, production)

    return {
      quote,
      machine,
      gang,
      production,
      price
    }

  }

  calculateQuote(data: any) {

    const sheets = Math.ceil(data.quantity / data.imposition)

    return {
      sheets,
      pages: data.pages
    }

  }

  selectMachine(data: any) {

    if (data.quantity > 5000) {
      return "OFFSET"
    }

    return "DIGITAL"

  }

  optimizeGangRun(data: any) {

    return {
      sheet_usage: "optimized"
    }

  }

  scheduleProduction(data: any) {

    const minutes = Math.ceil(data.quantity / data.machine_speed)

    return {
      production_minutes: minutes
    }

  }

  calculatePrice(quote: any, production: any) {

    const paper = quote.sheets * 0.02
    const machine = production.production_minutes * 0.5

    return {
      total_price: paper + machine
    }

  }

}