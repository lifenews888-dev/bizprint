import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsMasterService } from '../products-master/products-master.service';
import { ProductPriceCalculatorService } from './product-price-calculator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly masterService: ProductsMasterService,
    private readonly priceCalc: ProductPriceCalculatorService,
  ) {}

  @Get()
  findAll(
    @Query('category_id') categoryId?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: string,
  ) {
    const cat = categoryId || category;
    const limitN = limit ? Math.min(Math.max(parseInt(limit, 10) || 0, 1), 100) : undefined;
    return this.productsService.findAll(cat, limitN);
  }

  @Get('search')
  search(@Query('q') q: string, @Query('category') category?: string) {
    if (!q || q.length < 2) return [];
    return this.productsService.search(q, category);
  }

  @Post(':id/calculate')
  async calculatePrice(@Param('id') id: string, @Body() input: any) {
    const product = await this.productsService.findOne(id);
    if (!product) return { error: 'Product not found' };
    return this.priceCalc.calculate(product, input);
  }

  @Get(':id/estimate-lead-time')
  async estimateLeadTime(@Param('id') id: string, @Query('quantity') qtyStr?: string, @Query('pages') pagesStr?: string) {
    const product = await this.productsService.findOne(id);
    if (!product) return { error: 'Product not found' };
    return this.productsService.estimateLeadTime(product, Number(qtyStr) || 1, Number(pagesStr) || 0);
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() body: any) {
    return this.productsService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}

@Controller('admin/shop-products')
export class AdminShopProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll(@Query() query: any) {
    return this.productsService.findAllAdmin(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() body: any) {
    return this.productsService.createAdmin(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.productsService.updateAdmin(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.productsService.removeAdmin(id);
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

  @Get(':id/variants')
  async getProductVariants(@Param('id') id: string) {
    return this.productsService.getVariants(id);
  }
}