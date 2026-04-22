import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommissionService } from './commission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';

@Controller('commission')
export class CommissionController {
  constructor(private svc: CommissionService) {}

  // Escrow release: every 6h, auto-approve commissions for orders that have
  // been DELIVERED for ≥ 48h with no dispute. Same window for vendor and
  // sales-agent commissions so the customer's dispute window is consistent.
  @Cron('0 */6 * * *')
  async escrowReleaseCron() {
    await this.svc.autoApproveDelayedCommissions(48);
    await this.svc.autoApproveDelayedSalesCommissions(48);
    return { ok: true };
  }

  // Manual escrow release trigger for admin (test/recovery)
  @Post('escrow/release')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async manualEscrowRelease(@Body('hold_hours') holdHours?: number) {
    const vendor = await this.svc.autoApproveDelayedCommissions(holdHours ?? 48);
    const sales = await this.svc.autoApproveDelayedSalesCommissions(holdHours ?? 48);
    return { vendor, sales };
  }

  // ── Sales agent endpoints ────────────────────────────────────────────────

  /** List my sales commissions (sales agent's own dashboard). */
  @Get('sales/me')
  @UseGuards(JwtAuthGuard)
  mySalesCommissions(@Req() req: any) {
    return this.svc.findSalesByAgent(req.user.id);
  }

  /** Summary KPIs for the logged-in sales agent. */
  @Get('sales/me/summary')
  @UseGuards(JwtAuthGuard)
  mySalesSummary(@Req() req: any) {
    return this.svc.getSalesSummary(req.user.id);
  }

  /** Public-ish leaderboard so agents see how they rank. */
  @Get('sales/leaderboard')
  @UseGuards(JwtAuthGuard)
  salesLeaderboard(@Query('limit') limit?: string) {
    return this.svc.getSalesLeaderboard(limit ? Number(limit) : 10);
  }

  /** Admin-only: approve a batch of sales commissions early. */
  @Post('sales/approve-payout')
  @UseGuards(JwtAuthGuard, AdminGuard)
  approveSalesPayout(@Body('ids') ids: string[]) {
    return this.svc.approveSalesPayout(ids);
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
