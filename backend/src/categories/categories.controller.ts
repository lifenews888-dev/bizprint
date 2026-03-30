import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
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

  // ── Parameters (public) ──
  @Get('parameters')
  getParameters(@Query('category_id') categoryId?: string) {
    return this.svc.getParameters(categoryId);
  }

  @Get(':slug/parameters')
  getParametersBySlug(@Param('slug') slug: string) {
    return this.svc.getParametersByCategorySlug(slug);
  }

  // ── Price calculation ──
  @Post('calculate-price')
  calculatePrice(@Body() body: { base_price: number; quantity: number; category_id: string; options: { paramId: string; value: string }[] }) {
    return this.svc.getParameters(body.category_id).then(params =>
      this.svc.calculateWithParameters(body.base_price, body.quantity, body.options, params)
    );
  }

  // ── CRUD ──
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

  // ── Parameter CRUD (admin) ──
  @Post('parameters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  createParameter(@Body() dto: any) { return this.svc.createParameter(dto); }

  @Patch('parameters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  updateParameter(@Param('id') id: string, @Body() dto: any) { return this.svc.updateParameter(id, dto); }

  @Delete('parameters/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  removeParameter(@Param('id') id: string) { return this.svc.removeParameter(id); }
}
