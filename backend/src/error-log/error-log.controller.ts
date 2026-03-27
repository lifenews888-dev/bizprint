import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ErrorLogService } from './error-log.service';
import { ErrorSource, ErrorSeverity, ErrorStatus } from './error-log.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('errors')
export class ErrorLogController {
  constructor(private readonly service: ErrorLogService) {}

  /** Client apps report errors here (no auth required for error reporting) */
  @Post('report')
  report(@Body() body: {
    source: ErrorSource; message: string; error_code?: string; stack_trace?: string
    user_id?: string; order_id?: string; endpoint?: string; http_method?: string; http_status?: number
    app_version?: string; device_info?: string; os?: string; browser?: string
    severity?: ErrorSeverity; metadata?: Record<string, any>
  }) {
    return this.service.log(body);
  }

  /** Admin: error summary for dashboard */
  @Get('summary')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getSummary() {
    return this.service.getSummary();
  }

  /** Admin: list errors with filters */
  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll(
    @Query('source') source?: ErrorSource,
    @Query('severity') severity?: ErrorSeverity,
    @Query('status') status?: ErrorStatus,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      source, severity, status,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  /** Admin: errors for specific order (debug mode) */
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findByOrder(@Param('orderId') orderId: string) {
    return this.service.findByOrder(orderId);
  }

  /** Admin: update error status */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ErrorStatus; resolved_by?: string; note?: string },
  ) {
    return this.service.updateStatus(id, body.status, body.resolved_by, body.note);
  }
}
