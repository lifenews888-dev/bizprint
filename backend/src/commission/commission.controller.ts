import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommissionService } from './commission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';

@Controller('commission')
export class CommissionController {
  constructor(private svc: CommissionService) {}

  // Escrow release: every 6h, auto-approve commissions for orders that have
  // been DELIVERED for ≥ 48h with no dispute. The window matches CLAUDE.md
  // ("48-72h after delivery").
  @Cron('0 */6 * * *')
  async escrowReleaseCron() {
    return this.svc.autoApproveDelayedCommissions(48);
  }

  // Manual escrow release trigger for admin (test/recovery)
  @Post('escrow/release')
  @UseGuards(JwtAuthGuard, AdminGuard)
  manualEscrowRelease(@Body('hold_hours') holdHours?: number) {
    return this.svc.autoApproveDelayedCommissions(holdHours ?? 48);
  }

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

  @Get('batches')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getBatches() {
    return this.svc.getBatches();
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
