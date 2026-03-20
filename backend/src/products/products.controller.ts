import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsMasterService } from '../products-master/products-master.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly masterService: ProductsMasterService,
  ) {}

  @Get()
  findAll(@Query('category_id') categoryId?: string) {
    return this.productsService.findAll(categoryId);
  }

  @Get('catalog')
  getCatalog() {
    return this.masterService.getCatalog();
  }

  @Get('catalog/:code')
  getCatalogByCode(@Param('code') code: string) {
    return this.masterService.getCatalogByCode(code);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: any) {
    return this.productsService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}

@Controller('vendor-store')
export class VendorStoreController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('products')
  getMyProducts(@Request() req: any) {
    return this.productsService.findByVendor(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('products')
  createProduct(@Request() req: any, @Body() body: any) {
    return this.productsService.createForVendor(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('products/:id')
  updateProduct(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.productsService.updateForVendor(req.user.id, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('products/:id')
  removeProduct(@Request() req: any, @Param('id') id: string) {
    return this.productsService.removeForVendor(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  getStats(@Request() req: any) {
    return this.productsService.getVendorOrderStats(req.user.id);
  }
}
