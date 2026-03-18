import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PagesService } from './pages.service';
import { AdminGuard } from '../admin/admin.guard';

@Controller('pages')
export class PagesController {
  constructor(private readonly service: PagesService) {}

  // Нийтийн
  @Get('published')
  getPublished() {
    return this.service.findPublished();
  }

  @Get('type/:type')
  getByType(@Param('type') type: string) {
    return this.service.findByType(type);
  }

  @Get('slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  // Admin
  @Get()
  @UseGuards(AdminGuard)
  getAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(+id, body);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}