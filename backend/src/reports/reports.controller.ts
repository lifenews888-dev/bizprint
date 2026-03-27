import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private parseDates(query: any): { start: Date; end: Date; prevStart?: Date; prevEnd?: Date } {
    const end = query.end ? new Date(query.end) : new Date();
    const start = query.start
      ? new Date(query.start)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // default 30 days

    // Calculate previous period for comparison
    const diff = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - diff);

    return { start, end, prevStart, prevEnd };
  }

  @Get('summary')
  async getSummary(@Query() query: any) {
    const { start, end, prevStart, prevEnd } = this.parseDates(query);
    return this.reportsService.getSummary(start, end, prevStart, prevEnd);
  }

  @Get('profit')
  async getProfit(@Query() query: any) {
    const { start, end } = this.parseDates(query);
    const groupBy = (query.groupBy as 'day' | 'week' | 'month') || 'day';
    return this.reportsService.getProfitTimeSeries(start, end, groupBy);
  }

  @Get('vendors')
  async getVendors(@Query() query: any) {
    const { start, end } = this.parseDates(query);
    return this.reportsService.getVendorReport(start, end);
  }

  @Get('products')
  async getProducts(@Query() query: any) {
    const { start, end } = this.parseDates(query);
    return this.reportsService.getProductReport(start, end);
  }

  @Get('customers')
  async getCustomers(@Query() query: any) {
    const { start, end } = this.parseDates(query);
    return this.reportsService.getCustomerReport(start, end);
  }

  @Get('cashflow')
  async getCashflow(@Query() query: any) {
    const { start, end } = this.parseDates(query);
    return this.reportsService.getCashflow(start, end);
  }
}
