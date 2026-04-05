import { Injectable, NotFoundException, Logger } from '@nestjs/common';
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

export interface MaterialSummary {
  paperCount: number;
  inkCount: number;
  finishingCount: number;
  lowStockPapers: PaperStock[];
  totalStockValue: number;
}

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);

  constructor(
    @InjectRepository(PaperStock)
    private paperRepo: Repository<PaperStock>,
    @InjectRepository(InkProfile)
    private inkRepo: Repository<InkProfile>,
    @InjectRepository(FinishingOption)
    private finishingRepo: Repository<FinishingOption>,
  ) {}

  // ── PaperStock CRUD ──────────────────────────────────────
  async findAllPaper(includeInactive = false): Promise<PaperStock[]> {
    const where = includeInactive ? {} : { isActive: true };
    return this.paperRepo.find({ where, order: { size: 'ASC', weightGsm: 'ASC' } });
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

  async deletePaper(id: string): Promise<void> {
    await this.paperRepo.update(id, { isActive: false });
  }

  async updateStock(id: string, delta: number): Promise<PaperStock> {
    await this.paperRepo.increment({ id }, 'stockQty', delta);
    const paper = await this.findPaperById(id);
    if (paper.stockQty <= paper.reorderLevel) {
      this.logger.warn(`Нөөц бага: ${paper.name} — ${paper.stockQty} ш (reorder: ${paper.reorderLevel})`);
    }
    return paper;
  }

  // ── InkProfile CRUD ──────────────────────────────────────
  async findAllInk(includeInactive = false): Promise<InkProfile[]> {
    const where = includeInactive ? {} : { isActive: true };
    return this.inkRepo.find({ where, order: { name: 'ASC' } });
  }

  async findInkById(id: string): Promise<InkProfile> {
    const i = await this.inkRepo.findOne({ where: { id } });
    if (!i) throw new NotFoundException(`InkProfile ${id} олдсонгүй`);
    return i;
  }

  async createInk(dto: Partial<InkProfile>): Promise<InkProfile> {
    return this.inkRepo.save(this.inkRepo.create(dto));
  }

  async updateInk(id: string, dto: Partial<InkProfile>): Promise<InkProfile> {
    await this.inkRepo.update(id, dto);
    return this.findInkById(id);
  }

  async deleteInk(id: string): Promise<void> {
    await this.inkRepo.update(id, { isActive: false });
  }

  // ── FinishingOption CRUD ─────────────────────────────────
  async findAllFinishing(includeInactive = false): Promise<FinishingOption[]> {
    const where = includeInactive ? {} : { isActive: true };
    return this.finishingRepo.find({ where, order: { type: 'ASC', name: 'ASC' } });
  }

  async findFinishingById(id: string): Promise<FinishingOption> {
    const f = await this.finishingRepo.findOne({ where: { id } });
    if (!f) throw new NotFoundException(`FinishingOption ${id} олдсонгүй`);
    return f;
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

  async updateFinishing(id: string, dto: Partial<FinishingOption>): Promise<FinishingOption> {
    await this.finishingRepo.update(id, dto);
    return this.findFinishingById(id);
  }

  async deleteFinishing(id: string): Promise<void> {
    await this.finishingRepo.update(id, { isActive: false });
  }

  // ── Summary & Low Stock ──────────────────────────────────
  async getSummary(): Promise<MaterialSummary> {
    const [papers, inkCount, finishingCount] = await Promise.all([
      this.paperRepo.find({ where: { isActive: true } }),
      this.inkRepo.count({ where: { isActive: true } }),
      this.finishingRepo.count({ where: { isActive: true } }),
    ]);

    const lowStockPapers = papers.filter(p => p.stockQty <= p.reorderLevel);
    const totalStockValue = papers.reduce(
      (sum, p) => sum + p.stockQty * Number(p.pricePerSheet), 0,
    );

    return {
      paperCount: papers.length,
      inkCount,
      finishingCount,
      lowStockPapers,
      totalStockValue,
    };
  }

  async getLowStockPapers(): Promise<PaperStock[]> {
    const papers = await this.paperRepo.find({ where: { isActive: true } });
    return papers.filter(p => p.stockQty <= p.reorderLevel);
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

    const paperCost = Number(paper.pricePerSheet) * sheets;

    const areaM2 = (dto.widthMm / 1000) * (dto.heightMm / 1000) * sheets;
    const colorChannels = dto.colorMode === 'CMYK' ? 4
      : dto.colorMode === '2C' ? 2
      : dto.colorMode === '1C' ? 1 : 1;
    const mlUsed = areaM2 * Number(ink.coverageRateMlPerM2) * colorChannels;
    const inkCost = (mlUsed / 1000) * Number(ink.pricePerLiter);

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

  // ── Deduct stock when order goes to production ───────────
  async deductPaperStock(paperId: string, sheetsUsed: number): Promise<PaperStock> {
    return this.updateStock(paperId, -sheetsUsed);
  }

  // ── Seed default materials ───────────────────────────────
  async seedDefaults(): Promise<{ paper: number; ink: number; finishing: number }> {
    let paperAdded = 0, inkAdded = 0, finAdded = 0;

    const paperCount = await this.paperRepo.count();
    if (paperCount === 0) {
      const papers = await this.paperRepo.save([
        // A4 хэмжээ
        { name: 'Энгийн цагаан 80gsm', size: 'A4', weightGsm: 80, pricePerSheet: 50, supplier: 'Монпринт', stockQty: 10000, reorderLevel: 1000 },
        { name: 'Glossy 130gsm A4', size: 'A4', weightGsm: 130, pricePerSheet: 120, supplier: 'Монпринт', stockQty: 5000, reorderLevel: 500 },
        { name: 'Matte 170gsm A4', size: 'A4', weightGsm: 170, pricePerSheet: 180, supplier: 'Монпринт', stockQty: 3000, reorderLevel: 300 },
        { name: 'Art card 250gsm A4', size: 'A4', weightGsm: 250, pricePerSheet: 280, supplier: 'Монпринт', stockQty: 2000, reorderLevel: 200 },
        { name: 'Art card 300gsm A4', size: 'A4', weightGsm: 300, pricePerSheet: 340, supplier: 'Монпринт', stockQty: 1000, reorderLevel: 100 },
        { name: 'Art card 350gsm A4', size: 'A4', weightGsm: 350, pricePerSheet: 420, supplier: 'Монпринт', stockQty: 800, reorderLevel: 80 },
        // A3 хэмжээ
        { name: 'Glossy 130gsm A3', size: 'A3', weightGsm: 130, pricePerSheet: 220, supplier: 'Монпринт', stockQty: 3000, reorderLevel: 300 },
        { name: 'Matte 170gsm A3', size: 'A3', weightGsm: 170, pricePerSheet: 340, supplier: 'Монпринт', stockQty: 2000, reorderLevel: 200 },
        { name: 'Art card 250gsm A3', size: 'A3', weightGsm: 250, pricePerSheet: 520, supplier: 'Монпринт', stockQty: 1500, reorderLevel: 150 },
        { name: 'Art card 300gsm A3', size: 'A3', weightGsm: 300, pricePerSheet: 640, supplier: 'Монпринт', stockQty: 1000, reorderLevel: 100 },
        // SRA3 хэмжээ (offset)
        { name: 'Coated 90gsm SRA3', size: 'SRA3', weightGsm: 90, pricePerSheet: 120, supplier: 'Монпринт', stockQty: 5000, reorderLevel: 500 },
        { name: 'Coated 130gsm SRA3', size: 'SRA3', weightGsm: 130, pricePerSheet: 165, supplier: 'Монпринт', stockQty: 4000, reorderLevel: 400 },
        { name: 'Coated 170gsm SRA3', size: 'SRA3', weightGsm: 170, pricePerSheet: 210, supplier: 'Монпринт', stockQty: 3000, reorderLevel: 300 },
        { name: 'Coated 250gsm SRA3', size: 'SRA3', weightGsm: 250, pricePerSheet: 340, supplier: 'Монпринт', stockQty: 2000, reorderLevel: 200 },
        { name: 'Coated 300gsm SRA3', size: 'SRA3', weightGsm: 300, pricePerSheet: 410, supplier: 'Монпринт', stockQty: 1500, reorderLevel: 150 },
        { name: 'Coated 350gsm SRA3', size: 'SRA3', weightGsm: 350, pricePerSheet: 480, supplier: 'Монпринт', stockQty: 1000, reorderLevel: 100 },
        // Тусгай
        { name: 'Uncoated 80gsm A4', size: 'A4', weightGsm: 80, pricePerSheet: 40, supplier: 'Монпринт', stockQty: 15000, reorderLevel: 2000 },
        { name: 'Uncoated 120gsm A4', size: 'A4', weightGsm: 120, pricePerSheet: 90, supplier: 'Монпринт', stockQty: 5000, reorderLevel: 500 },
        { name: 'Synthetic 100gsm', size: 'A4', weightGsm: 100, pricePerSheet: 580, supplier: 'Импорт', stockQty: 500, reorderLevel: 50 },
        { name: 'Canvas A3+', size: 'A3', weightGsm: 400, pricePerSheet: 1800, supplier: 'Импорт', stockQty: 300, reorderLevel: 30 },
        { name: 'Banner vinyl 510gsm', size: 'custom', widthMm: 1520, heightMm: 1000, weightGsm: 510, pricePerSheet: 1200, supplier: 'Баннер Молл', stockQty: 500, reorderLevel: 50 },
        { name: 'Self-adhesive vinyl', size: 'custom', widthMm: 1370, heightMm: 1000, weightGsm: 120, pricePerSheet: 950, supplier: 'Баннер Молл', stockQty: 400, reorderLevel: 40 },
      ].map(p => this.paperRepo.create(p)));
      paperAdded = papers.length;
    }

    const inkCount = await this.inkRepo.count();
    if (inkCount === 0) {
      const inks = await this.inkRepo.save([
        { name: 'Стандарт CMYK', type: 'CMYK' as any, coverageRateMlPerM2: 2.5, pricePerLiter: 45000, supplier: 'Молл бүр' },
        { name: 'Pantone spot', type: 'Pantone' as any, coverageRateMlPerM2: 3.0, pricePerLiter: 65000, supplier: 'Молл бүр' },
        { name: 'УВ лак', type: 'UV' as any, coverageRateMlPerM2: 1.8, pricePerLiter: 85000, supplier: 'Молл бүр' },
        { name: 'Усан суурьтай бэх', type: 'water_based' as any, coverageRateMlPerM2: 3.2, pricePerLiter: 38000, supplier: 'Молл бүр' },
        { name: 'Дижитал тонер (Xerox)', type: 'digital_toner' as any, coverageRateMlPerM2: 0.8, pricePerLiter: 120000, supplier: 'Xerox Mongolia' },
        { name: 'Дижитал тонер (HP Indigo)', type: 'digital_toner' as any, coverageRateMlPerM2: 0.6, pricePerLiter: 180000, supplier: 'HP Mongolia' },
        { name: 'Eco-solvent (wide format)', type: 'CMYK' as any, coverageRateMlPerM2: 4.0, pricePerLiter: 55000, supplier: 'Баннер Молл' },
      ].map(i => this.inkRepo.create(i)));
      inkAdded = inks.length;
    }

    const finCount = await this.finishingRepo.count();
    if (finCount === 0) {
      const fins = await this.finishingRepo.save([
        { name: 'Матт ламинат', type: FinishingType.LAMINATE, setupCost: 5000, unitPrice: 80, timePerUnitMinutes: 0.1 },
        { name: 'Глосс ламинат', type: FinishingType.LAMINATE, setupCost: 5000, unitPrice: 90, timePerUnitMinutes: 0.1 },
        { name: 'Soft-touch ламинат', type: FinishingType.LAMINATE, setupCost: 8000, unitPrice: 150, timePerUnitMinutes: 0.12 },
        { name: 'УВ лак (бүтэн)', type: FinishingType.UV_COAT, setupCost: 8000, unitPrice: 120, timePerUnitMinutes: 0.15 },
        { name: 'УВ лак (хэсэгчилсэн)', type: FinishingType.UV_COAT, setupCost: 15000, unitPrice: 200, timePerUnitMinutes: 0.2 },
        { name: 'Фольг тамга (алт)', type: FinishingType.FOIL, setupCost: 35000, unitPrice: 250, timePerUnitMinutes: 0.3 },
        { name: 'Фольг тамга (мөнгө)', type: FinishingType.FOIL, setupCost: 35000, unitPrice: 240, timePerUnitMinutes: 0.3 },
        { name: 'Тэгш бус хэвлэлт (emboss)', type: FinishingType.EMBOSS, setupCost: 60000, unitPrice: 180, timePerUnitMinutes: 0.25 },
        { name: 'Нугалах (энгийн)', type: FinishingType.FOLD, setupCost: 3000, unitPrice: 30, timePerUnitMinutes: 0.05 },
        { name: 'Нугалах (Z-fold)', type: FinishingType.FOLD, setupCost: 4000, unitPrice: 45, timePerUnitMinutes: 0.07 },
        { name: 'Нугалах (gate-fold)', type: FinishingType.FOLD, setupCost: 5000, unitPrice: 60, timePerUnitMinutes: 0.08 },
        { name: 'Бүрэх (энгийн)', type: FinishingType.CUT, setupCost: 2000, unitPrice: 15, timePerUnitMinutes: 0.02 },
        { name: 'Die-cut (тусгай хэлбэр)', type: FinishingType.CUT, setupCost: 45000, unitPrice: 50, timePerUnitMinutes: 0.1 },
        { name: 'Цоолох', type: FinishingType.PERFORATE, setupCost: 4000, unitPrice: 40, timePerUnitMinutes: 0.06 },
        { name: 'Хэмлэлт (crease)', type: FinishingType.CREASE, setupCost: 3000, unitPrice: 25, timePerUnitMinutes: 0.04 },
        { name: 'Хавтаслах (зүүгдэл)', type: FinishingType.BIND, setupCost: 6000, unitPrice: 200, timePerUnitMinutes: 0.5 },
        { name: 'Хавтаслах (perfect bind)', type: FinishingType.BIND, setupCost: 12000, unitPrice: 350, timePerUnitMinutes: 0.8 },
        { name: 'Хавтаслах (спираль)', type: FinishingType.BIND, setupCost: 8000, unitPrice: 500, timePerUnitMinutes: 0.6 },
        { name: 'Зүүгдэл (staple)', type: FinishingType.STAPLE, setupCost: 2000, unitPrice: 50, timePerUnitMinutes: 0.1 },
      ].map(f => this.finishingRepo.create(f)));
      finAdded = fins.length;
    }

    return { paper: paperAdded, ink: inkAdded, finishing: finAdded };
  }
}
