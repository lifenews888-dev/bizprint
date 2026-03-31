import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { MegaMenuService } from './mega-menu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class MegaMenuController {
  constructor(private readonly svc: MegaMenuService) {}

  // ═══ PUBLIC ═══
  @Get('mega-menu/public')
  getPublic(@Query('role') role?: string) {
    return this.svc.getPublicMenu(role);
  }

  // ═══ ADMIN — Menu CRUD ═══
  @Get('admin/mega-menu')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  findAll() { return this.svc.findAll(); }

  @Get('admin/mega-menu/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post('admin/mega-menu')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  create(@Body() dto: any) { return this.svc.create(dto); }

  @Put('admin/mega-menu/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }

  @Delete('admin/mega-menu/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  remove(@Param('id') id: string) { return this.svc.remove(id); }

  // ═══ ADMIN — Column ═══
  @Post('admin/mega-menu/:menuId/columns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  addColumn(@Param('menuId') menuId: string, @Body() dto: any) { return this.svc.addColumn(menuId, dto); }

  @Patch('admin/mega-menu/columns/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  updateColumn(@Param('id') id: string, @Body() dto: any) { return this.svc.updateColumn(id, dto); }

  @Delete('admin/mega-menu/columns/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  removeColumn(@Param('id') id: string) { return this.svc.removeColumn(id); }

  // ═══ ADMIN — Category ═══
  @Post('admin/mega-menu/columns/:columnId/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  addCategory(@Param('columnId') colId: string, @Body() dto: any) { return this.svc.addCategory(colId, dto); }

  @Patch('admin/mega-menu/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  updateCategory(@Param('id') id: string, @Body() dto: any) { return this.svc.updateCategory(id, dto); }

  @Delete('admin/mega-menu/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  removeCategory(@Param('id') id: string) { return this.svc.removeCategory(id); }

  // ═══ ADMIN — Item ═══
  @Post('admin/mega-menu/categories/:categoryId/items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  addItem(@Param('categoryId') catId: string, @Body() dto: any) { return this.svc.addItem(catId, dto); }

  @Patch('admin/mega-menu/items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  updateItem(@Param('id') id: string, @Body() dto: any) { return this.svc.updateItem(id, dto); }

  @Delete('admin/mega-menu/items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  removeItem(@Param('id') id: string) { return this.svc.removeItem(id); }

  // ═══ ADMIN — Promo ═══
  @Post('admin/mega-menu/:menuId/promos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  addPromo(@Param('menuId') menuId: string, @Body() dto: any) { return this.svc.addPromo(menuId, dto); }

  @Patch('admin/mega-menu/promos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  updatePromo(@Param('id') id: string, @Body() dto: any) { return this.svc.updatePromo(id, dto); }

  @Delete('admin/mega-menu/promos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  removePromo(@Param('id') id: string) { return this.svc.removePromo(id); }

  // ═══ ADMIN — Reorder ═══
  @Patch('admin/mega-menu/reorder/columns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  reorderColumns(@Body() body: { items: { id: string; order: number }[] }) {
    return this.svc.reorderColumns(body.items);
  }

  @Patch('admin/mega-menu/reorder/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  reorderCategories(@Body() body: { items: { id: string; order: number }[] }) {
    return this.svc.reorderCategories(body.items);
  }

  @Patch('admin/mega-menu/reorder/items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  reorderItems(@Body() body: { items: { id: string; order: number }[] }) {
    return this.svc.reorderItems(body.items);
  }
}
