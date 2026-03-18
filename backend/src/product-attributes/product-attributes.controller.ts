import { Controller, Get, Post, Patch, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { ProductAttributesService } from './product-attributes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('product-attributes')
export class ProductAttributesController {
  constructor(private svc: ProductAttributesService) {}

  @Get()
  find(@Query('product_id') productId: string) {
    if (!productId) return [];
    return this.svc.findByProduct(productId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: any) { return this.svc.create(body); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}