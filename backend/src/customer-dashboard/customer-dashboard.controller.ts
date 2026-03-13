import { Controller, Get, Param } from '@nestjs/common'
import { CustomerDashboardService } from './customer-dashboard.service'

@Controller('customer-dashboard')
export class CustomerDashboardController {

  constructor(private readonly service: CustomerDashboardService) {}

  @Get(':customerId/orders')
  getOrders(@Param('customerId') customerId: string) {

    return this.service.getOrders(customerId)

  }

  @Get(':customerId/payments')
  getPayments(@Param('customerId') customerId: string) {

    return this.service.getPayments(customerId)

  }

  @Get(':customerId/production')
  getProduction(@Param('customerId') customerId: string) {

    return this.service.getProductionStatus(customerId)

  }

}