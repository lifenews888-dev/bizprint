import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { CmsService } from './cms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('cms')
export class CmsController {
  constructor(private svc: CmsService) {}

  @Get('header')
  getHeader() { return this.svc.getHeader(); }

  @Get('mega-menu')
  getMegaMenu() { return this.svc.getMegaMenu(); }

  @Get('settings')
  getSettings() { return this.svc.getSettings(); }

  @Patch('header')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  updateHeader(@Body() dto: any) { return this.svc.updateHeader(dto); }

  @Patch('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  updateSettings(@Body() dto: any) { return this.svc.updateSettings(dto); }
}
