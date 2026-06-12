import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body,
  UseGuards, Request, UseInterceptors, UploadedFile, UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { BusinessCardsService } from './business-cards.service';
import { JwtAuthGuard } from '../auth/guards';

/* ═══ Admin Controller ═══ */
@Controller('admin/business-cards')
@UseGuards(JwtAuthGuard)
export class AdminBcController {
  constructor(private readonly svc: BusinessCardsService) {}

  @Get()
  findAll() { return this.svc.findAllProducts(); }

  @Post()
  create(@Body() body: any) { return this.svc.createProduct(body); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findProduct(id); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.svc.updateProduct(id, body); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.deleteProduct(id); }

  @Patch(':id/publish')
  publish(@Param('id') id: string) { return this.svc.publishProduct(id); }

  /* Layouts */
  @Post(':id/layouts')
  createLayout(@Param('id') id: string, @Body() body: any) { return this.svc.createLayout(id, body); }

  @Patch(':id/layouts/:layoutId')
  updateLayout(@Param('id') id: string, @Param('layoutId') lid: string, @Body() body: any) {
    return this.svc.updateLayout(id, lid, body);
  }

  @Delete(':id/layouts/:layoutId')
  deleteLayout(@Param('id') id: string, @Param('layoutId') lid: string) {
    return this.svc.deleteLayout(id, lid);
  }

  /* ─── Background зураг upload ─── */

  // Нэг зураг upload
  @Post(':id/layouts/:layoutId/backgrounds')
  @UseInterceptors(FileInterceptor('file'))
  uploadBackground(
    @Param('id') id: string,
    @Param('layoutId') layoutId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { name?: string; side?: string },
  ) {
    return this.svc.addBackground(layoutId, file, body.name, body.side);
  }

  // Олон зураг нэг дор upload (bulk)
  @Post(':id/layouts/:layoutId/backgrounds/bulk')
  @UseInterceptors(FilesInterceptor('files', 50))
  uploadBackgroundsBulk(
    @Param('id') id: string,
    @Param('layoutId') layoutId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.svc.addBackgroundsBulk(layoutId, files);
  }

  // Жагсаалт
  @Get(':id/layouts/:layoutId/backgrounds')
  getBackgrounds(@Param('layoutId') layoutId: string) {
    return this.svc.getBackgrounds(layoutId);
  }

  // Нэр болон sort_order засах
  @Patch(':id/layouts/:layoutId/backgrounds/:bgId')
  updateBackground(
    @Param('bgId') bgId: string,
    @Body() body: { name?: string; sort_order?: number; is_active?: boolean },
  ) {
    return this.svc.updateBackground(bgId, body);
  }

  // Устгах
  @Delete(':id/layouts/:layoutId/backgrounds/:bgId')
  deleteBackground(@Param('bgId') bgId: string) {
    return this.svc.deleteBackground(bgId);
  }

  /* Pricing */
  @Post(':id/pricing')
  setPricing(@Param('id') id: string, @Body() body: { tiers: { quantity: number; unit_price: number }[] }) {
    return this.svc.setPricingTiers(id, body.tiers);
  }

  @Get(':id/calculate-price')
  calcPrice(@Param('id') id: string, @Query('quantity') qty: string) {
    return this.svc.calculatePrice(id, Number(qty) || 100);
  }
}

/* ═══ Public Controller ═══ */
@Controller('business-cards')
export class PublicBcController {
  constructor(private readonly svc: BusinessCardsService) {}

  @Get()
  findAll() { return this.svc.findAllPublished(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findPublishedProduct(id); }

  @Get(':id/price')
  calcPrice(@Param('id') id: string, @Query('quantity') qty: string) {
    return this.svc.calculatePrice(id, Number(qty) || 100);
  }

  @Post(':id/order')
  @UseGuards(JwtAuthGuard)
  createOrder(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return { message: 'Order received', productId: id, userId: req.user?.id, ...body };
  }
}
