import { Injectable } from '@nestjs/common'
import { CreatePrintQuoteDto } from './dto/create-print-quote.dto'

@Injectable()
export class PrintQuoteService {

  calculate(data: CreatePrintQuoteDto) {

    const paperPrices = {
      A4: 120,
      A3: 220
    }

    const printPrices = {
      bw: 40,
      color: 120
    }

    const paper_cost =
      paperPrices[data.paper_size] *
      data.quantity *
      data.pages

    const print_cost =
      printPrices[data.color_mode] *
      data.quantity *
      data.pages

    const total = paper_cost + print_cost

    return {
      paper_cost,
      print_cost,
      total_price: total
    }

  }

}