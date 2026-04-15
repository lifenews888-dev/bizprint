import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';

@Controller('commission')
export class CommissionController {
  constructor(private svc: CommissionService) {}

  // Vendor can read their own; admin can read any
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('vendor_id') vendorId?: string, @Query('status') status?: string) {
    return this.svc.findAll({ vendorId, status });
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  getSummary(@Query('vendor_id') vendorId?: string) {
    return this.svc.getSummary(vendorId);
  }

  @Post('approve-payout')
  @UseGuards(JwtAuthGuard, AdminGuard)
  approvePayout(@Body('ids') ids: string[]) {
    return this.svc.approvePayout(ids);
  }

  @Post('mark-paid/:batchId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  markPaid(@Param('batchId') batchId: string) {
    return this.svc.markPaid(batchId);
  }
}
