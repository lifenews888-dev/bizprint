import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { ProductQrService } from './product-qr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class ProductQrController {
  constructor(private readonly svc: ProductQrService) {}

  // ── Public ──
  @Get('p/:slug')
  viewBySlug(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }

  @Post('p/:id/scan')
  trackScan(@Param('id') id: string) {
    return this.svc.trackScan(id);
  }

  @Post('p/:id/reorder')
  trackReorder(@Param('id') id: string) {
    return this.svc.trackReorder(id);
  }

  @Get('p/:id/reviews')
  getReviews(@Param('id') id: string) {
    return this.svc.getReviews(id);
  }

  @Get('p/:id/reviews/stats')
  getReviewStats(@Param('id') id: string) {
    return this.svc.getReviewStats(id);
  }

  @Post('p/:id/reviews')
  addReview(@Param('id') id: string, @Body() dto: any) {
    return this.svc.addReview(id, dto);
  }

  // ── Customer ──
  @UseGuards(JwtAuthGuard)
  @Get('product-qr/my')
  myProductQrs(@Req() req) {
    return this.svc.findByUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('product-qr')
  create(@Req() req, @Body() dto: any) {
    return this.svc.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('product-qr/:id')
  update(@Param('id') id: string, @Req() req, @Body() dto: any) {
    return this.svc.update(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('product-qr/:id')
  remove(@Param('id') id: string, @Req() req) {
    return this.svc.remove(id, req.user.id);
  }

  // ── Admin ──
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/product-qr')
  adminList(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.svc.adminList(page, limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/product-qr/stats')
  adminStats() {
    return this.svc.getStats();
  }
}
