import { Controller, Get, Post, Delete, Patch, Param, Body, UseGuards, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductImagesService } from './product-images.service';
import { UploadService } from '../upload/upload.service';

@Controller('product-images')
export class ProductImagesController {
  constructor(
    private svc: ProductImagesService,
    private uploadSvc: UploadService,
  ) {}

  @Get()
  findAll(@Query('product_id') productId: string) {
    if (!productId) return [];
    return this.svc.findByProduct(productId);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('product_id') productId: string,
    @Body('alt') alt: string,
    @Body('sort_order') sortOrder: string,
  ) {
    const uploaded = this.uploadSvc.processFile(file);
    if (!uploaded.success) return uploaded;
    return this.svc.create({
      product_id: productId,
      url: 'http://localhost:4000' + uploaded.file_url,
      alt: alt || '',
      sort_order: Number(sortOrder) || 0,
      is_primary: false,
    });
  }

  @Patch(':id/primary')
  @UseGuards(JwtAuthGuard)
  setPrimary(@Param('id') id: string, @Body('product_id') productId: string) {
    return this.svc.setPrimary(id, productId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}