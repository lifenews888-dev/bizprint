import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaperStock } from './entities/paper-stock.entity';
import { InkProfile } from './entities/ink-profile.entity';
import { FinishingOption, FinishingType } from './entities/finishing-option.entity';

export interface MaterialCostResult {
  paperCost: number;
  inkCost: number;
  finishingCost: number;
  subtotal: number;
  breakdown: {
    paper: { name: string; pricePerSheet: number; sheets: number; total: number };
    ink: { type: string; areM2: number; mlUsed: number; total: number };
    finishing: Array<{ name: string; setup: number; unit: number; qty: number; total: number }>;
  };
}

export interface CalcMaterialCostDto {
  paperStockId: string;
  inkProfileId: string;
  finishingOptionIds: string[];
  quantity: number;
  widthMm: number;
  heightMm: number;
  colorMode: 'CMYK' | '1C' | '2C' | 'BW';
  pagesPerSheet?: number;
}

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(PaperStock)
    private paperRepo: Repository<PaperStock>,
    @InjectRepository(InkProfile)
    private inkRepo: Repository<InkProfile>,
    @InjectRepository(FinishingOption)
    private finishingRepo: Repository<FinishingOption>,
  ) {}

  // ── PaperStock CRUD ──────────────────────────────────────
  async findAllPaper(): Promise<PaperStock[]> {
    return this.paperRepo.find({ where: { isActive: true }, order: { weightGsm: 'ASC' } });
  }

  async findPaperById(id: string): Promise<PaperStock> {
    const p = await this.paperRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException(`PaperStock ${id} олдсонгүй`);
    return p;
  }

  async findPaperBySpec(size: string, weightGsm: number): Promise<PaperStock | null> {
    return this.paperRepo.findOne({ where: { size, weightGsm, isActive: true } });
  }

  async createPaper(dto: Partial<PaperStock>): Promise<PaperStock> {
    return this.paperRepo.save(this.paperRepo.create(dto));
  }

  async updatePaper(id: string, dto: Partial<PaperStock>): Promise<PaperStock> {
    await this.paperRepo.update(id, dto);
    return this.findPaperById(id);
  }

  async updateStock(id: string, delta: number): Promise<void> {
    await this.paperRepo.increment({ id }, 'stockQty', delta);
    const paper = await this.findPaperById(id);
    if (paper.stockQty <= paper.reorderLevel) {
      // TODO: emit reorder alert event
    }
  }

  // ── InkProfile CRUD ──────────────────────────────────────
  async findAllInk(): Promise<InkProfile[]> {
    return this.inkRepo.find({ where: { isActive: true } });
  }

  async findInkById(id: string): Promise<InkProfile> {
    const i = await this.inkRepo.findOne({ where: { id } });
    if (!i) throw new NotFoundException(`InkProfile ${id} олдсонгүй`);
    return i;
  }

  async createInk(dto: Partial<InkProfile>): Promise<InkProfile> {
    return this.inkRepo.save(this.inkRepo.create(dto));
  }

  // ── FinishingOption CRUD ─────────────────────────────────
  async findAllFinishing(): Promise<FinishingOption[]> {
    return this.finishingRepo.find({ where: { isActive: true } });
  }

  async findFinishingByIds(ids: string[]): Promise<FinishingOption[]> {
    return this.finishingRepo
      .createQueryBuilder('f')
      .where('f.id IN (:...ids)', { ids })
      .getMany();
  }

  async createFinishing(dto: Partial<FinishingOption>): Promise<FinishingOption> {
    return this.finishingRepo.save(this.finishingRepo.create(dto));
  }

  // ── Cost Calculation ─────────────────────────────────────
  async calcMaterialCost(dto: CalcMaterialCostDto): Promise<MaterialCostResult> {
    const paper     = await this.findPaperById(dto.paperStockId);
    const ink       = await this.findInkById(dto.inkProfileId);
    const finishing = dto.finishingOptionIds.length
      ? await this.findFinishingByIds(dto.finishingOptionIds)
      : [];

    const pagesPerSheet = dto.pagesPerSheet ?? 1;
    const sheets = Math.ceil(dto.quantity / pagesPerSheet);

    // Цаасны зардал
    const paperCost = Number(paper.pricePerSheet) * sheets;

    // Бүрний зардал — m² × coverage × price/liter
    const areaM2 = (dto.widthMm / 1000) * (dto.heightMm / 1000) * sheets;
    const colorChannels = dto.colorMode === 'CMYK' ? 4
      : dto.colorMode === '2C' ? 2
      : dto.colorMode === '1C' ? 1 : 1;
    const mlUsed = areaM2 * Number(ink.coverageRateMlPerM2) * colorChannels;
    const inkCost = (mlUsed / 1000) * Number(ink.pricePerLiter);

    // Боловсруулалтын зардал
    const finishingBreakdown = finishing.map(f => ({
      name: f.name,
      setup: Number(f.setupCost),
      unit: Number(f.unitPrice),
      qty: dto.quantity,
      total: Number(f.setupCost) + Number(f.unitPrice) * dto.quantity,
    }));
    const finishingCost = finishingBreakdown.reduce((s, f) => s + f.total, 0);

    const subtotal = paperCost + inkCost + finishingCost;

    return {
      paperCost,
      inkCost,
      finishingCost,
      subtotal,
      breakdown: {
        paper: { name: paper.name, pricePerSheet: Number(paper.pricePerSheet), sheets, total: paperCost },
        ink: { type: ink.type, areM2: areaM2, mlUsed, total: inkCost },
        finishing: finishingBreakdown,
      },
    };
  }

  // ── Seed default materials ───────────────────────────────
  async seedDefaults(): Promise<void> {
    const paperCount = await this.paperRepo.count();
    if (paperCount === 0) {
      await this.paperRepo.save([
        { name: 'Энгийн цагаан 80gsm', size: 'A4', weightGsm: 80, pricePerSheet: 50, supplier: 'Монпринт', stockQty: 10000, reorderLevel: 1000 },
        { name: 'Glossy 130gsm', size: 'A4', weightGsm: 130, pricePerSheet: 120, supplier: 'Монпринт', stockQty: 5000, reorderLevel: 500 },
        { name: 'Matte 170gsm', size: 'A4', weightGsm: 170, pricePerSheet: 180, supplier: 'Монпринт', stockQty: 3000, reorderLevel: 300 },
        { name: 'Art card 250gsm', size: 'A4', weightGsm: 250, pricePerSheet: 280, supplier: 'Монпринт', stockQty: 2000, reorderLevel: 200 },
        { name: 'Art card 300gsm', size: 'A4', weightGsm: 300, pricePerSheet: 340, supplier: 'Монпринт', stockQty: 1000, reorderLevel: 100 },
        { name: 'SRA3 130gsm', size: 'SRA3', weightGsm: 130, pricePerSheet: 350, supplier: 'Монпринт', stockQty: 2000, reorderLevel: 200 },
        { name: 'Banner vinyl 510gsm', size: 'custom', weightGsm: 510, pricePerSheet: 1200, supplier: 'Баннер Молл', stockQty: 500, reorderLevel: 50 },
      ].map(p => this.paperRepo.create(p)));
    }

    const inkCount = await this.inkRepo.count();
    if (inkCount === 0) {
      await this.inkRepo.save([
        { name: 'Стандарт CMYK', type: 'CMYK' as any, coverageRateMlPerM2: 2.5, pricePerLiter: 45000, supplier: 'Молл бүр' },
        { name: 'УВ лак', type: 'UV' as any, coverageRateMlPerM2: 1.8, pricePerLiter: 85000, supplier: 'Молл бүр' },
        { name: 'Дижитал тонер', type: 'digital_toner' as any, coverageRateMlPerM2: 0.8, pricePerLiter: 120000, supplier: 'HP' },
      ].map(i => this.inkRepo.create(i)));
    }

    const finCount = await this.finishingRepo.count();
    if (finCount === 0) {
      await this.finishingRepo.save([
        { name: 'Матт ламинат', type: FinishingType.LAMINATE, setupCost: 5000, unitPrice: 80, timePerUnitMinutes: 0.1 },
        { name: 'Глосс ламинат', type: FinishingType.LAMINATE, setupCost: 5000, unitPrice: 90, timePerUnitMinutes: 0.1 },
        { name: 'УВ лак бүлэг', type: FinishingType.UV_COAT, setupCost: 8000, unitPrice: 120, timePerUnitMinutes: 0.15 },
        { name: 'Нугалах (энгийн)', type: FinishingType.FOLD, setupCost: 3000, unitPrice: 30, timePerUnitMinutes: 0.05 },
        { name: 'Бүрэх', type: FinishingType.CUT, setupCost: 2000, unitPrice: 15, timePerUnitMinutes: 0.02 },
        { name: 'Цоолох', type: FinishingType.PERFORATE, setupCost: 4000, unitPrice: 40, timePerUnitMinutes: 0.06 },
        { name: 'Хавтаслах (зүүгдэл)', type: FinishingType.BIND, setupCost: 6000, unitPrice: 200, timePerUnitMinutes: 0.5 },
      ].map(f => this.finishingRepo.create(f)));
    }
  }
}
