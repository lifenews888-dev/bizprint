import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common'
import { CustomerDashboardService } from './customer-dashboard.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('customer-dashboard')
@UseGuards(JwtAuthGuard)
export class CustomerDashboardController {
  constructor(private readonly service: CustomerDashboardService) {}

  private assertOwner(req: any, customerId: string) {
    const { role, id } = req.user
    if (role !== 'admin' && role !== 'superadmin' && id !== customerId) {
      throw new ForbiddenException('Өөрийн өгөгдөлд л хандах боломжтой')
    }
  }

  @Get('summary')
  getSummary(@Request() req: any) {
    return this.service.getSummary(req.user.id)
  }

  @Get(':customerId/orders')
  getOrders(@Param('customerId') customerId: string, @Request() req: any) {
    this.assertOwner(req, customerId)
    return this.service.getOrders(customerId)
  }

  @Get(':customerId/payments')
  getPayments(@Param('customerId') customerId: string, @Request() req: any) {
    this.assertOwner(req, customerId)
    return this.service.getPayments(customerId)
  }

  @Get(':customerId/production')
  getProduction(@Param('customerId') customerId: string, @Request() req: any) {
    this.assertOwner(req, customerId)
    return this.service.getProductionStatus(customerId)
  }
}
