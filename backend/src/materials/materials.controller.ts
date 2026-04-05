import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MaterialsService, CalcMaterialCostDto } from './materials.service';

@ApiTags('Materials')
@ApiBearerAuth()
@Controller('materials')
export class MaterialsController {
  constructor(private readonly svc: MaterialsService) {}

  // ── Summary ─────────────────────────────────────────────
  @Get('summary')
  @ApiOperation({ summary: 'Материалын ерөнхий мэдээлэл + low stock' })
  getSummary() {
    return this.svc.getSummary();
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Нөөц багатай цаасууд' })
  getLowStock() {
    return this.svc.getLowStockPapers();
  }

  // ── Paper ────────────────────────────────────────────────
  @Get('paper')
  @ApiOperation({ summary: 'Бүх цаасны төрлүүд' })
  findAllPaper() {
    return this.svc.findAllPaper();
  }

  @Get('paper/:id')
  findPaper(@Param('id') id: string) {
    return this.svc.findPaperById(id);
  }

  @Post('paper')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin', 'factory')
  createPaper(@Body() dto: any) {
    return this.svc.createPaper(dto);
  }

  @Put('paper/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin', 'factory')
  updatePaper(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updatePaper(id, dto);
  }

  @Delete('paper/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  deletePaper(@Param('id') id: string) {
    return this.svc.deletePaper(id);
  }

  @Patch('paper/:id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin', 'factory')
  updateStock(@Param('id') id: string, @Body('delta') delta: number) {
    return this.svc.updateStock(id, delta);
  }

  // ── Ink ──────────────────────────────────────────────────
  @Get('ink')
  @ApiOperation({ summary: 'Бүх бүрний профайлууд' })
  findAllInk() {
    return this.svc.findAllInk();
  }

  @Post('ink')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  createInk(@Body() dto: any) {
    return this.svc.createInk(dto);
  }

  @Put('ink/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  updateInk(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateInk(id, dto);
  }

  @Delete('ink/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  deleteInk(@Param('id') id: string) {
    return this.svc.deleteInk(id);
  }

  // ── Finishing ────────────────────────────────────────────
  @Get('finishing')
  @ApiOperation({ summary: 'Боловсруулалтын сонголтууд' })
  findAllFinishing() {
    return this.svc.findAllFinishing();
  }

  @Post('finishing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  createFinishing(@Body() dto: any) {
    return this.svc.createFinishing(dto);
  }

  @Put('finishing/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  updateFinishing(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateFinishing(id, dto);
  }

  @Delete('finishing/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  deleteFinishing(@Param('id') id: string) {
    return this.svc.deleteFinishing(id);
  }

  // ── Cost Calculator ──────────────────────────────────────
  @Post('calc')
  @ApiOperation({ summary: 'Материалын өртөг тооцоолох' })
  calcCost(@Body() dto: CalcMaterialCostDto) {
    return this.svc.calcMaterialCost(dto);
  }

  // ── Seed ─────────────────────────────────────────────────
  @Post('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  seed() {
    return this.svc.seedDefaults();
  }
}
