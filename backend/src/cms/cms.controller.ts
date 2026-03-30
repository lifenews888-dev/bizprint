import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { CmsService } from './cms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('cms')
export class CmsController {
  constructor(private svc: CmsService) {}

  // ── Public ──
  @Get('header')
  getHeader() { return this.svc.getHeader(); }

  @Get('mega-menu')
  getMegaMenu() { return this.svc.getMegaMenu(); }

  @Get('footer')
  getFooter() { return this.svc.getFooter(); }

  // ── Admin ──
  @Get('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  getSettings() { return this.svc.getSettings(); }

  @Patch('header')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  updateHeader(@Body() dto: any) { return this.svc.updateHeader(dto); }

  @Patch('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  updateSettings(@Body() dto: any) { return this.svc.updateSettings(dto); }

  @Patch('footer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  updateFooter(@Body() dto: any) { return this.svc.updateFooter(dto); }

  // ── Mega Menu Builder ──
  @Get('mega-menu/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  getMegaMenuConfig() { return this.svc.getMegaMenuConfig(); }

  @Patch('mega-menu/columns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  updateColumns(@Body() body: { column_ids: string[] }) { return this.svc.updateMegaMenuColumns(body.column_ids); }

  @Patch('mega-menu/promo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  updatePromo(@Body() dto: any) { return this.svc.updatePromo(dto); }
}
