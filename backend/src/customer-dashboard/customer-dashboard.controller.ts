import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common'
import { CustomerDashboardService } from './customer-dashboard.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('customer-dashboard')
export class CustomerDashboardController {

  constructor(private readonly service: CustomerDashboardService) {}

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  getSummary(@Request() req: any) {
    return this.service.getSummary(req.user.id)
  }

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
