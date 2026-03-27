import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PricingCatalogService } from './pricing-catalog.service';

@Controller('pricing-catalog')
export class PricingCatalogController {
  constructor(private readonly catalog: PricingCatalogService) {}

  /* ═══════════════════════════════════════
   *  PUBLIC — frontend dropdowns
   * ═══════════════════════════════════════ */

  @Get('materials')
  getMaterials(@Query('active') active?: string) {
    return this.catalog.getMaterials(active === 'true');
  }

  @Get('machines')
  getMachines(@Query('active') active?: string) {
    return this.catalog.getMachines(active === 'true');
  }

  @Get('finishings')
  getFinishings(@Query('active') active?: string) {
    return this.catalog.getFinishings(active === 'true');
  }

  @Get('margins')
  getMargins(@Query('active') active?: string) {
    return this.catalog.getMarginRules(active === 'true');
  }

  @Get('mappings')
  getMappings() {
    return this.catalog.getMappings();
  }

  @Get('letter-prices')
  getLetterPrices() {
    return this.catalog.getLetterPrices();
  }

  /* ═══════════════════════════════════════
   *  ADMIN — Material CRUD
   * ═══════════════════════════════════════ */

  @UseGuards(JwtAuthGuard)
  @Post('materials')
  createMaterial(@Body() body: any) {
    return this.catalog.createMaterial(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('materials/:id')
  updateMaterial(@Param('id') id: string, @Body() body: any) {
    return this.catalog.updateMaterial(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('materials/:id')
  deleteMaterial(@Param('id') id: string) {
    return this.catalog.deleteMaterial(id);
  }

  /* ═══════════════════════════════════════
   *  ADMIN — Machine CRUD
   * ═══════════════════════════════════════ */

  @UseGuards(JwtAuthGuard)
  @Post('machines')
  createMachine(@Body() body: any) {
    return this.catalog.createMachine(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('machines/:id')
  updateMachine(@Param('id') id: string, @Body() body: any) {
    return this.catalog.updateMachine(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('machines/:id')
  deleteMachine(@Param('id') id: string) {
    return this.catalog.deleteMachine(id);
  }

  /* ═══════════════════════════════════════
   *  ADMIN — Finishing CRUD
   * ═══════════════════════════════════════ */

  @UseGuards(JwtAuthGuard)
  @Post('finishings')
  createFinishing(@Body() body: any) {
    return this.catalog.createFinishing(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('finishings/:id')
  updateFinishing(@Param('id') id: string, @Body() body: any) {
    return this.catalog.updateFinishing(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('finishings/:id')
  deleteFinishing(@Param('id') id: string) {
    return this.catalog.deleteFinishing(id);
  }

  /* ═══════════════════════════════════════
   *  ADMIN — Margin Rule CRUD
   * ═══════════════════════════════════════ */

  @UseGuards(JwtAuthGuard)
  @Post('margins')
  createMarginRule(@Body() body: any) {
    return this.catalog.createMarginRule(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('margins/:id')
  updateMarginRule(@Param('id') id: string, @Body() body: any) {
    return this.catalog.updateMarginRule(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('margins/:id')
  deleteMarginRule(@Param('id') id: string) {
    return this.catalog.deleteMarginRule(id);
  }

  /* ═══════════════════════════════════════
   *  ADMIN — Material → Machine Mapping CRUD
   * ═══════════════════════════════════════ */

  @UseGuards(JwtAuthGuard)
  @Post('mappings')
  createMapping(@Body() body: any) {
    return this.catalog.createMapping(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('mappings/:id')
  updateMapping(@Param('id') id: string, @Body() body: any) {
    return this.catalog.updateMapping(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('mappings/:id')
  deleteMapping(@Param('id') id: string) {
    return this.catalog.deleteMapping(id);
  }

  /* ═══════════════════════════════════════
   *  ADMIN — Letter Price CRUD
   * ═══════════════════════════════════════ */

  @UseGuards(JwtAuthGuard)
  @Post('letter-prices')
  createLetterPrice(@Body() body: any) {
    return this.catalog.createLetterPrice(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('letter-prices/:id')
  updateLetterPrice(@Param('id') id: string, @Body() body: any) {
    return this.catalog.updateLetterPrice(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('letter-prices/:id')
  deleteLetterPrice(@Param('id') id: string) {
    return this.catalog.deleteLetterPrice(id);
  }
}
