import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { QuoteConfigService } from './quote-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';

@Controller('cms/quote-config')
export class QuoteConfigController {
  constructor(private svc: QuoteConfigService) {}

  // Public: frontend fetches the list
  @Get()
  findAll() {
    return this.svc.findAll();
  }

  // Admin: seed initial data
  @Get('seed')
  @UseGuards(JwtAuthGuard, AdminGuard)
  seed() {
    return this.svc.seed();
  }

  @Get(':type')
  findOne(@Param('type') type: string) {
    return this.svc.findOne(type);
  }

  @Put(':type')
  @UseGuards(JwtAuthGuard, AdminGuard)
  upsert(@Param('type') type: string, @Body() body: any) {
    return this.svc.upsert(type, body);
  }
}
