import {
  Controller, Get, Post, Body, Param, Query, Req, UseGuards, Headers,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  /** Public track endpoint (called from frontend) */
  @Post('track')
  track(
    @Body() body: { entity_type: string; entity_id: string; event_type: string; metadata?: any },
    @Req() req,
    @Headers('user-agent') ua?: string,
    @Headers('referer') referrer?: string,
  ) {
    return this.svc.track({
      ...body,
      visitor_ip: req.ip,
      visitor_ua: ua,
      referrer,
    });
  }

  /** User's own analytics dashboard */
  @UseGuards(JwtAuthGuard)
  @Get('my')
  myStats(@Req() req, @Query('days') days?: number) {
    return this.svc.getUserStats(req.user.id, days || 30);
  }

  /** Analytics for a specific entity */
  @UseGuards(JwtAuthGuard)
  @Get('entity/:type/:id')
  entityStats(
    @Param('type') type: string,
    @Param('id') id: string,
    @Query('days') days?: number,
  ) {
    return this.svc.getEntityStats(type, id, days || 30);
  }

  /** Summary for customer app dashboard (charts + stats) */
  @UseGuards(JwtAuthGuard)
  @Get('summary')
  async summary(@Req() req, @Query('days') days?: number) {
    const stats = await this.svc.getUserStats(req.user.id, days || 7);
    return {
      ...stats,
      period_days: days || 7,
    };
  }

  /** Admin platform-wide analytics */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('platform')
  platformStats(@Query('days') days?: number) {
    return this.svc.getPlatformStats(days || 30);
  }
}
