import { Controller, Get, Post, Put, Delete, Patch, Param, Body, UseGuards } from '@nestjs/common';
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

  @Get('settings/public')
  getPublicSettings() { return this.svc.getSettingsObject(); }

  @Get('hero-slides/public')
  getPublicSlides() { return this.svc.getActiveSlides(); }

  @Get('mega-menu/public')
  getPublicMegaMenu() { return this.svc.getMegaMenu(); }

  @Get('mega-menu')
  getMenuItems() { return this.svc.getMenuItems(); }

  @Post('mega-menu')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  createMenuItem(@Body() dto: any) { return this.svc.createMenuItem(dto); }

  @Put('mega-menu/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  updateMenuItem(@Param('id') id: string, @Body() dto: any) { return this.svc.updateMenuItem(id, dto); }

  @Delete('mega-menu/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  deleteMenuItem(@Param('id') id: string) { return this.svc.deleteMenuItem(id); }

  @Patch('mega-menu/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  reorderMenu(@Body() body: { items: { id: string; sort_order: number }[] }) {
    return this.svc.reorderMenuItems(body.items);
  }

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

  // Bulk settings update (from admin CMS page)
  @Post('settings/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  bulkUpdate(@Body() body: { items: { key: string; value: string }[] }) {
    return this.svc.bulkUpdateSettings(body.items);
  }

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

  // ── Hero Slides ──
  @Get('hero-slides')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  getAllSlides() { return this.svc.getAllSlides(); }

  @Post('hero-slides')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  createSlide(@Body() dto: any) { return this.svc.createSlide(dto); }

  @Patch('hero-slides/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  updateSlide(@Param('id') id: string, @Body() dto: any) { return this.svc.updateSlide(id, dto); }

  @Delete('hero-slides/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  deleteSlide(@Param('id') id: string) { return this.svc.deleteSlide(id); }

  @Patch('hero-slides/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  reorderSlides(@Body() body: { items: { id: string; sort_order: number }[] }) { return this.svc.reorderSlides(body.items); }
}
