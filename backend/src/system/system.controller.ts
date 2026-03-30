import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin', 'admin')
export class SystemController {
  constructor(private readonly svc: SystemService) {}

  @Get('health')
  health() {
    return this.svc.getHealth();
  }

  @Get('metrics')
  metrics() {
    return this.svc.getMetrics();
  }

  @Get('errors')
  errors(@Query('limit') limit?: string) {
    return this.svc.getErrors(Number(limit) || 50);
  }

  @Get('users/stats')
  userStats() {
    return this.svc.getUserStats();
  }

  @Get('users')
  users(@Query('search') search?: string, @Query('limit') limit?: string) {
    return this.svc.getUsers(search, Number(limit) || 50);
  }

  @Get('config')
  config() {
    return this.svc.getConfig();
  }

  @Get('kpis')
  kpis() {
    return this.svc.getDashboardKpis();
  }

  // ── Test: generate fake error ──
  @Post('test-error')
  testError() {
    SystemService.logError({
      level: 'error',
      message: 'Test error from admin panel',
      stack: 'Error: Test error\n    at SystemController.testError\n    at /backend/src/system/system.controller.ts:50',
      endpoint: '/system/test-error',
      method: 'POST',
      status_code: 500,
    });
    return { success: true, message: 'Test error logged' };
  }

  // ── Users: ban/unban ──
  @Patch('users/:id/ban')
  banUser(@Param('id') id: string, @Body() body: { ban: boolean }) {
    return this.svc.banUser(id, body.ban);
  }

  // ── Users: reset password ──
  @Post('users/:id/reset-password')
  resetPassword(@Param('id') id: string) {
    return this.svc.resetPassword(id);
  }

  // ── Config: update ──
  @Patch('config')
  updateConfig(@Body() body: { key: string; value: any }) {
    return this.svc.updateConfig(body.key, body.value);
  }

  // ── Config: audit log ──
  @Get('config/audit')
  configAudit() {
    return this.svc.getConfigAuditLog();
  }

  // ── System Power Control ──
  @Post('power/restart')
  restart(@Body() body: { confirm_code?: string }) {
    return this.svc.restartSystem(body.confirm_code);
  }

  @Post('power/maintenance')
  maintenance(@Body() body: { enable: boolean }) {
    return this.svc.setMaintenanceMode(body.enable);
  }

  @Post('power/clear-cache')
  clearCache() {
    return this.svc.clearSystemCache();
  }

  // ── Price Integrity Audit ──
  @Get('audit/prices')
  auditPrices() {
    return this.svc.auditPrices();
  }

  @Post('audit/fix-prices')
  fixPrices() {
    return this.svc.fixPrices();
  }

  @Get('modules')
  modules() {
    return this.svc.getModuleRegistry();
  }

  @Get('database')
  database() {
    return this.svc.getDatabaseInfo();
  }
}
