import { Injectable } from '@nestjs/common'

@Injectable()
export class QuoteService {

  calculatePrice(data: any) {

    const basePrice = 1000

    const materialCost = data.quantity * basePrice

    const setupCost = 5000

    const total = materialCost + setupCost

    return {
      quantity: data.quantity,
      materialCost,
      setupCost,
      total,
    }
  }
}