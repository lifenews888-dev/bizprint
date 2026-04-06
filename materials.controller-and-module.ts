// ============================================================
// materials.controller.ts
// ============================================================
import {
  Controller, Get, Post, Put, Patch, Body, Param,
  UseGuards, Query
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

  // ── Paper ──────────────────────────────────────────────
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

  @Patch('paper/:id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin', 'factory')
  updateStock(@Param('id') id: string, @Body('delta') delta: number) {
    return this.svc.updateStock(id, delta);
  }

  // ── Ink ────────────────────────────────────────────────
  @Get('ink')
  @ApiOperation({ summary: 'Бүх бэхний профайлууд' })
  findAllInk() {
    return this.svc.findAllInk();
  }

  @Post('ink')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  createInk(@Body() dto: any) {
    return this.svc.createInk(dto);
  }

  // ── Finishing ──────────────────────────────────────────
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

  // ── Cost Calculator ────────────────────────────────────
  @Post('calc')
  @ApiOperation({ summary: 'Материалын өртөг тооцоолох' })
  calcCost(@Body() dto: CalcMaterialCostDto) {
    return this.svc.calcMaterialCost(dto);
  }

  // ── Seed ───────────────────────────────────────────────
  @Post('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  seed() {
    return this.svc.seedDefaults();
  }
}


// ============================================================
// materials.module.ts
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaperStock } from './entities/paper-stock.entity';
import { InkProfile } from './entities/ink-profile.entity';
import { FinishingOption } from './entities/finishing-option.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaperStock, InkProfile, FinishingOption])],
  controllers: [MaterialsController],
  providers: [MaterialsService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
