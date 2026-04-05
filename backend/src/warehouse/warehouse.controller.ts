import {
  Controller, Get, Post, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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
  stockIn(@Body() dto: any) {
    return this.svc.stockIn(dto);
  }

  @Post('stock-out')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin', 'factory')
  stockOut(@Body() dto: any) {
    return this.svc.stockOut(dto);
  }

  @Post('adjust')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin', 'factory')
  adjust(@Body() dto: any) {
    return this.svc.adjust(dto);
  }

  @Get('transactions')
  getTransactions(@Query() query: any) {
    return this.svc.getTransactions(query);
  }

  @Get('low-stock')
  getLowStock() {
    return this.svc.getLowStockItems();
  }

  @Get('summary')
  getSummary() {
    return this.svc.getSummary();
  }
}
