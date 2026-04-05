import {
  Controller, Get, Post, Patch, Body, Param,
  UseGuards, Query, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProductionService } from './production.service';

@ApiTags('Production')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('production')
export class ProductionController {
  constructor(private readonly svc: ProductionService) {}

  @Get()
  @ApiOperation({ summary: 'Бүх production job жагсаалт' })
  findAll(@Query('status') status?: string, @Query('shopId') shopId?: string) {
    return this.svc.findAll({ status, shopId });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Production dashboard summary' })
  getSummary(@Query('shopId') shopId?: string) {
    return this.svc.getSummary(shopId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Get('order/:orderId')
  getByOrder(@Param('orderId') orderId: string) {
    return this.svc.getJobsByOrder(orderId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin', 'factory', 'vendor')
  @ApiOperation({ summary: 'Шинэ production job үүсгэх' })
  createJob(@Body() dto: any, @Request() req: any) {
    return this.svc.createJob({ ...dto, createdById: req.user.id });
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin', 'factory', 'vendor')
  @ApiOperation({ summary: 'Job статус өөрчлөх (Kanban drag & drop)' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Request() req: any,
  ) {
    return this.svc.updateStatus(id, status, req.user.id);
  }

  @Patch(':id/assign')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin', 'factory')
  @ApiOperation({ summary: 'Machine хуваарилах' })
  assignMachine(
    @Param('id') id: string,
    @Body('machineId') machineId: string,
    @Request() req: any,
  ) {
    return this.svc.assignMachine(id, machineId, req.user.id);
  }

  @Patch(':id/start')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin', 'factory', 'vendor')
  startJob(@Param('id') id: string, @Request() req: any) {
    return this.svc.startJob(id, req.user.id);
  }

  @Patch(':id/complete')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin', 'factory', 'vendor')
  completeJob(@Param('id') id: string, @Request() req: any) {
    return this.svc.completeJob(id, req.user.id);
  }
}
