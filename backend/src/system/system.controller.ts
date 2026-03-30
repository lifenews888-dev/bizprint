import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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

  @Get('modules')
  modules() {
    return this.svc.getModuleRegistry();
  }

  @Get('database')
  database() {
    return this.svc.getDatabaseInfo();
  }
}
