import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ProductsMasterService } from './products-master.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGuard } from '../admin/admin.guard'

@Controller()
export class ProductsMasterController {
  constructor(private service: ProductsMasterService) {}

  // Admin endpoints
  @Post('admin/products-master')
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Get('admin/products-master')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll(@Query() query: any) {
    return this.service.findAll(query)
  }

  @Get('admin/products-master/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Put('admin/products-master/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body)
  }

  @Delete('admin/products-master/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id)
  }

  @Post('admin/products-master/:id/materials')
  @UseGuards(JwtAuthGuard, AdminGuard)
  addMaterial(@Param('id') id: string, @Body() body: any) {
    return this.service.addMaterial(id, body)
  }

  @Put('admin/products-master/materials/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateMaterial(@Param('id') id: string, @Body() body: any) {
    return this.service.updateMaterial(id, body)
  }

  @Post('admin/products-master/:id/sizes')
  @UseGuards(JwtAuthGuard, AdminGuard)
  addSize(@Param('id') id: string, @Body() body: any) {
    return this.service.addSize(id, body)
  }

  @Put('admin/products-master/sizes/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateSize(@Param('id') id: string, @Body() body: any) {
    return this.service.updateSize(id, body)
  }

  // Finishing & Addon admin
  @Get('admin/products-master/finishings/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getFinishings() {
    return this.service.findAllFinishings()
  }

  @Post('admin/products-master/finishings')
  @UseGuards(JwtAuthGuard, AdminGuard)
  createFinishing(@Body() body: any) {
    return this.service.createFinishing(body)
  }

  @Get('admin/products-master/addons/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getAddons() {
    return this.service.findAllAddons()
  }

  @Post('admin/products-master/addons')
  @UseGuards(JwtAuthGuard, AdminGuard)
  createAddon(@Body() body: any) {
    return this.service.createAddon(body)
  }

  // Public catalog
  @Get('products/catalog')
  getCatalog() {
    return this.service.getCatalog()
  }

  @Get('products/catalog/:code')
  getCatalogByCode(@Param('code') code: string) {
    return this.service.getCatalogByCode(code)
  }

  // Seed
  @Post('admin/products-master/seed')
  @UseGuards(JwtAuthGuard, AdminGuard)
  seed() {
    return this.service.seed()
  }
}
