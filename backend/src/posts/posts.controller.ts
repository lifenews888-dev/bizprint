import { Controller, Get, Post as HttpPost, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('posts')
export class PostsController {
  constructor(private svc: PostsService) {}

  @Get()
  findPublished(@Query('category') category?: string) { return this.svc.findPublished(category); }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  findAll() { return this.svc.findAll(); }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    await this.svc.incrementView(slug);
    return this.svc.findBySlug(slug);
  }

  @HttpPost()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  create(@Body() dto: any) { return this.svc.create(dto); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
