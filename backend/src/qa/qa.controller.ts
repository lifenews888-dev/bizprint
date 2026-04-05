import {
  Controller, Get, Post, Put, Patch, Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QaService } from './qa.service';

@ApiTags('QA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('qa')
export class QaController {
  constructor(private readonly svc: QaService) {}

  // ── Checkpoints ──────────────────────────────────────────
  @Post('checkpoints')
  @ApiOperation({ summary: 'QA checkpoint үүсгэх' })
  createCheckpoint(@Body() dto: any, @Request() req: any) {
    return this.svc.createCheckpoint({ ...dto, checkedById: dto.checkedById ?? req.user.id });
  }

  @Get('checkpoints/order/:orderId')
  @ApiOperation({ summary: 'Захиалгын бүх checkpoint-ууд' })
  getCheckpoints(@Param('orderId') orderId: string) {
    return this.svc.getCheckpointsByOrder(orderId);
  }

  @Put('checkpoints/:id')
  updateCheckpoint(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateCheckpoint(id, dto);
  }

  @Patch('checkpoints/:id/sign-off')
  @ApiOperation({ summary: 'Operator sign-off' })
  operatorSignOff(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    return this.svc.operatorSignOff(id, req.user.id, dto.note);
  }

  // ── Print Passport ───────────────────────────────────────
  @Post('passport/:orderId')
  createPassport(@Param('orderId') orderId: string, @Body() dto: any) {
    return this.svc.createPassport(orderId, dto);
  }

  @Get('passport/:orderId')
  getPassport(@Param('orderId') orderId: string) {
    return this.svc.getPassport(orderId);
  }

  @Patch('passport/:orderId/approve')
  @ApiOperation({ summary: 'Print passport батлах' })
  approvePassport(@Param('orderId') orderId: string, @Request() req: any) {
    return this.svc.approvePassport(orderId, req.user.id);
  }

  // ── Order QA Report ──────────────────────────────────────
  @Get('report/:orderId')
  @ApiOperation({ summary: 'Захиалгын QA тайлан (бүгд нэг дор)' })
  getOrderReport(@Param('orderId') orderId: string) {
    return this.svc.getOrderQaReport(orderId);
  }

  // ── Non-Conformance Log ──────────────────────────────────
  @Post('ncl')
  @ApiOperation({ summary: 'NCL бүртгэх' })
  createNcl(@Body() dto: any, @Request() req: any) {
    return this.svc.createNcl({ ...dto, reportedById: dto.reportedById ?? req.user.id });
  }

  @Get('ncl/all')
  getAllNcl() {
    return this.svc.getAllNcl();
  }

  @Get('ncl/order/:orderId')
  getNclByOrder(@Param('orderId') orderId: string) {
    return this.svc.getNclByOrder(orderId);
  }

  @Patch('ncl/:id/review')
  @ApiOperation({ summary: 'NCL шалгаж эхлэх' })
  reviewNcl(@Param('id') id: string, @Request() req: any) {
    return this.svc.reviewNcl(id, req.user.id);
  }

  @Patch('ncl/:id/resolve')
  @ApiOperation({ summary: 'NCL шийдвэрлэх' })
  resolveNcl(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    return this.svc.resolveNcl(id, dto.resolution, req.user.id);
  }

  @Patch('ncl/:id/reject')
  @ApiOperation({ summary: 'NCL татгалзах' })
  rejectNcl(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    return this.svc.rejectNcl(id, dto.reason, req.user.id);
  }

  // ── Summary ──────────────────────────────────────────────
  @Get('summary')
  @ApiOperation({ summary: 'QA ерөнхий статистик' })
  getSummary() {
    return this.svc.getQaSummary();
  }
}
