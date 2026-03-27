import { Controller, Post, Body, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { AssignmentEngineService } from './services/assignment-engine.service';
import { VendorTierService } from './services/vendor-tier.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vendors')
export class VendorsController {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly assignmentEngine: AssignmentEngineService,
    private readonly vendorTier: VendorTierService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: any) {
    return this.vendorsService.create(body);
  }

  @Get()
  findAll() {
    return this.vendorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.vendorsService.update(id, body);
  }

  // ─── Assignment Engine ───

  /** Бүтээгдэхүүнд тохирох vendor жагсаалт + оноо */
  @Get('assign/candidates/:productId')
  @UseGuards(JwtAuthGuard)
  getCandidates(
    @Param('productId') productId: string,
    @Query('quantity') quantity: string,
  ) {
    return this.assignmentEngine.getCandidates(productId, Number(quantity) || 1);
  }

  /** Автомат vendor assign */
  @Post('assign/auto')
  @UseGuards(JwtAuthGuard)
  autoAssign(@Body() body: { product_id: string; quantity?: number }) {
    return this.assignmentEngine.assignVendor(body.product_id, body.quantity || 1);
  }

  /** Manual vendor assign (admin override) */
  @Post('assign/manual')
  @UseGuards(JwtAuthGuard)
  manualAssign(@Body() body: { product_id: string; vendor_id: string }) {
    return this.assignmentEngine.manualAssign(body.product_id, body.vendor_id);
  }

  // ─── Vendor Tier & Metrics ───

  /** Нэг vendor-ийн tier шинэчлэх */
  @Post(':id/refresh-tier')
  @UseGuards(JwtAuthGuard)
  refreshTier(@Param('id') id: string) {
    return this.vendorTier.updateVendorTier(id);
  }

  /** Бүх vendor-ийн tier шинэчлэх (cron / admin) */
  @Post('tiers/refresh-all')
  @UseGuards(JwtAuthGuard)
  refreshAllTiers() {
    return this.vendorTier.updateAllTiers();
  }

  /** Daily capacity reset */
  @Post('capacity/reset-daily')
  @UseGuards(JwtAuthGuard)
  resetDailyCapacity() {
    return this.vendorTier.resetDailyCapacity();
  }

  // ─── Product-Vendor Pricing ───

  /** Бүтээгдэхүүн-vendor холбоос CRUD */
  @Get(':vendorId/products')
  @UseGuards(JwtAuthGuard)
  getVendorProducts(@Param('vendorId') vendorId: string) {
    return this.vendorsService.getVendorProducts(vendorId);
  }

  @Post(':vendorId/products')
  @UseGuards(JwtAuthGuard)
  addVendorProduct(@Param('vendorId') vendorId: string, @Body() body: any) {
    return this.vendorsService.addVendorProduct(vendorId, body);
  }

  @Patch(':vendorId/products/:productId')
  @UseGuards(JwtAuthGuard)
  updateVendorProduct(
    @Param('vendorId') vendorId: string,
    @Param('productId') productId: string,
    @Body() body: any,
  ) {
    return this.vendorsService.updateVendorProduct(vendorId, productId, body);
  }

  /** Bulk save vendor product capabilities */
  @Post(':vendorId/products/bulk')
  @UseGuards(JwtAuthGuard)
  saveVendorProducts(@Param('vendorId') vendorId: string, @Body() body: { products: any[] }) {
    return this.vendorsService.saveVendorProducts(vendorId, body.products || []);
  }
}