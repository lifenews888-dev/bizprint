import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CapacityService } from './capacity.service';

@Controller('capacity')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CapacityController {
  constructor(private readonly capacityService: CapacityService) {}

  @Get('overview')
  getOverview() {
    return this.capacityService.getOverview();
  }

  @Get('products')
  getProductCapacity() {
    return this.capacityService.getProductCapacity();
  }

  @Get('vendors')
  getVendorCapacity() {
    return this.capacityService.getVendorCapacity();
  }
}
