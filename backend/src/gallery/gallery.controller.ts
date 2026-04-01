import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { GalleryService } from './gallery.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGuard } from '../admin/admin.guard'

@Controller('gallery')
export class GalleryController {
  constructor(private readonly service: GalleryService) {}

  // Public: get active gallery images
  @Get()
  findAll(@Query('active') active?: string) {
    return this.service.findAll(active === 'true')
  }

  // Public: get recent images for home preview
  @Get('recent')
  findRecent(@Query('limit') limit?: string) {
    return this.service.findRecent(limit ? +limit : 6)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }
}

@Controller('admin/gallery')
export class AdminGalleryController {
  constructor(private readonly service: GalleryService) {}

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll() {
    return this.service.findAll(false)
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }

  @Post('reorder')
  @UseGuards(JwtAuthGuard, AdminGuard)
  reorder(@Body() body: { ids: string[] }) {
    return this.service.reorder(body.ids)
  }
}
