import {
  Controller, Get, Post, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WarehouseService } from './warehouse.service';

@ApiTags('Warehouse')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly svc: WarehouseService) {}

  @Post('stock-in')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin', 'factory')
  @ApiOperation({ summary: 'Нөөц нэмэх' })
  stockIn(@Body() dto: any, @Request() req: any) {
    return this.svc.stockIn({ ...dto, createdById: dto.createdById ?? req.user.id });
  }

  @Post('stock-out')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin', 'factory')
  @ApiOperation({ summary: 'Нөөц хасах' })
  stockOut(@Body() dto: any, @Request() req: any) {
    return this.svc.stockOut({ ...dto, createdById: dto.createdById ?? req.user.id });
  }

  @Post('adjust')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin', 'factory')
  @ApiOperation({ summary: 'Тооллого засвар' })
  adjust(@Body() dto: any, @Request() req: any) {
    return this.svc.adjust({ ...dto, createdById: dto.createdById ?? req.user.id });
  }

  @Post('bulk-stock-in')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin', 'factory')
  @ApiOperation({ summary: 'Олон материал нэг дор хүлээн авах' })
  bulkStockIn(@Body() dto: any, @Request() req: any) {
    return this.svc.bulkStockIn(dto.items, dto.supplier, dto.invoiceNo, req.user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Гүйлгээний түүх' })
  getTransactions(@Query() query: any) {
    return this.svc.getTransactions(query);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Нөөц багатай материалууд' })
  getLowStock() {
    return this.svc.getLowStockItems();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Агуулахын ерөнхий мэдээлэл' })
  getSummary() {
    return this.svc.getSummary();
  }

  @Get('reorder-suggestions')
  @ApiOperation({ summary: 'Авто захиалгын санал' })
  getReorderSuggestions() {
    return this.svc.getReorderSuggestions();
  }

  @Get('usage-report')
  @ApiOperation({ summary: 'Материалын зарцуулалтын тайлан' })
  getUsageReport(@Query('days') days?: string) {
    return this.svc.getUsageReport(days ? parseInt(days) : 30);
  }
}
