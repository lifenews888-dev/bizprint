import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common'
import { CmsService } from './cms.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGuard } from '../admin/admin.guard'

@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // ─── Settings ────────────────────────────────────────────

  @Get('settings')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAllSettings() {
    return this.cmsService.findAllSettings()
  }

  @Get('settings/public')
  findPublicSettings() {
    return this.cmsService.findPublicSettings()
  }

  @Put('settings/:key')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateSetting(
    @Param('key') key: string,
    @Body('value') value: any,
    @Request() req: any,
  ) {
    return this.cmsService.updateSetting(key, value, req.user?.id)
  }

  @Post('settings/bulk')
  @UseGuards(JwtAuthGuard, AdminGuard)
  bulkUpdateSettings(
    @Body('items') items: { key: string; value: any }[],
    @Request() req: any,
  ) {
    return this.cmsService.bulkUpdateSettings(items, req.user?.id)
  }

  // ─── Mega Menu ───────────────────────────────────────────

  @Get('mega-menu')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAllMenuItems() {
    return this.cmsService.findAllMenuItems()
  }

  @Get('mega-menu/public')
  findPublicMenuItems() {
    return this.cmsService.findPublicMenuItems()
  }

  @Post('mega-menu')
  @UseGuards(JwtAuthGuard, AdminGuard)
  createMenuItem(@Body() data: any) {
    return this.cmsService.createMenuItem(data)
  }

  @Put('mega-menu/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateMenuItem(@Param('id') id: string, @Body() data: any) {
    return this.cmsService.updateMenuItem(id, data)
  }

  @Delete('mega-menu/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  deleteMenuItem(@Param('id') id: string) {
    return this.cmsService.deleteMenuItem(id)
  }

  @Post('mega-menu/reorder')
  @UseGuards(JwtAuthGuard, AdminGuard)
  reorderMenuItems(@Body('items') items: { id: string; sort_order: number }[]) {
    return this.cmsService.reorderMenuItems(items)
  }

  // ─── Seed ────────────────────────────────────────────────

  @Post('seed')
  @UseGuards(JwtAuthGuard, AdminGuard)
  seed() {
    return this.cmsService.seed()
  }
}
