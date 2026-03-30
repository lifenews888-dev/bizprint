import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private svc: CategoriesService) {}

  @Get()
  findAll() { return this.svc.findAll(); }

  @Get('tree')
  findTree() { return this.svc.findTree(); }

  @Get('navigation')
  navigation() { return this.svc.getNavigation(); }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: any) { return this.svc.create(dto); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }

  @Patch(':id/menu')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  toggleMenu(@Param('id') id: string, @Body() body: { show_in_menu: boolean }) {
    return this.svc.update(id, { show_in_menu: body.show_in_menu } as any);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
