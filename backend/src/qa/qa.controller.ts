import {
  Controller, Get, Post, Put, Patch, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QaService } from './qa.service';

@ApiTags('QA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('qa')
export class QaController {
  constructor(private readonly svc: QaService) {}

  @Post('checkpoints')
  createCheckpoint(@Body() dto: any) {
    return this.svc.createCheckpoint(dto);
  }

  @Get('checkpoints/order/:orderId')
  getCheckpoints(@Param('orderId') orderId: string) {
    return this.svc.getCheckpointsByOrder(orderId);
  }

  @Put('checkpoints/:id')
  updateCheckpoint(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateCheckpoint(id, dto);
  }

  @Post('passport/:orderId')
  createPassport(@Param('orderId') orderId: string, @Body() dto: any) {
    return this.svc.createPassport(orderId, dto);
  }

  @Get('passport/:orderId')
  getPassport(@Param('orderId') orderId: string) {
    return this.svc.getPassport(orderId);
  }

  @Patch('passport/:orderId/approve')
  approvePassport(@Param('orderId') orderId: string, @Body('approvedById') approvedById: string) {
    return this.svc.approvePassport(orderId, approvedById);
  }

  @Post('ncl')
  createNcl(@Body() dto: any) {
    return this.svc.createNcl(dto);
  }

  @Get('ncl/all')
  getAllNcl() {
    return this.svc.getAllNcl();
  }

  @Get('ncl/order/:orderId')
  getNclByOrder(@Param('orderId') orderId: string) {
    return this.svc.getNclByOrder(orderId);
  }

  @Patch('ncl/:id/resolve')
  resolveNcl(
    @Param('id') id: string,
    @Body('resolution') resolution: string,
    @Body('resolvedById') resolvedById: string,
  ) {
    return this.svc.resolveNcl(id, resolution, resolvedById);
  }

  @Get('summary')
  getSummary() {
    return this.svc.getQaSummary();
  }
}
