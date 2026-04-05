import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InventoryTransaction, TransactionType } from './entities/inventory-transaction.entity';
import { PaperStock } from '../materials/entities/paper-stock.entity';

export interface ReorderSuggestion {
  materialId: string;
  materialName: string;
  currentQty: number;
  reorderLevel: number;
  suggestedQty: number;
  supplier: string;
  estimatedCost: number;
  urgency: 'critical' | 'low' | 'normal';
}

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);

  constructor(
    @InjectRepository(InventoryTransaction)
    private txRepo: Repository<InventoryTransaction>,
    @InjectRepository(PaperStock)
    private paperRepo: Repository<PaperStock>,
    private eventEmitter: EventEmitter2,
  ) {}

  // ── Stock IN (нийлүүлэгчээс ирсэн) ─────────────────────
  async stockIn(dto: {
    materialId: string;
    qty: number;
    unitCost?: number;
    supplier?: string;
    invoiceNo?: string;
    createdById: string;
  }): Promise<InventoryTransaction> {
    const paper = await this.paperRepo.findOne({ where: { id: dto.materialId } });
    if (!paper) throw new BadRequestException('Материал олдсонгүй');

    const newQty = paper.stockQty + dto.qty;
    await this.paperRepo.update(dto.materialId, { stockQty: newQty });

    const tx = this.txRepo.create({
      ...dto,
      type: TransactionType.IN,
      balanceAfter: newQty,
    });
    return this.txRepo.save(tx);
  }

  // ── Stock OUT (захиалгад зарцуулсан) ────────────────────
  async stockOut(dto: {
    materialId: string;
    qty: number;
    orderId?: string;
    reason?: string;
    createdById: string;
  }): Promise<InventoryTransaction> {
    const paper = await this.paperRepo.findOne({ where: { id: dto.materialId } });
    if (!paper) throw new BadRequestException('Материал олдсонгүй');
    if (paper.stockQty < dto.qty) throw new BadRequestException('Нөөц хүрэлцэхгүй байна');

    const newQty = paper.stockQty - dto.qty;
    await this.paperRepo.update(dto.materialId, { stockQty: newQty });

    const tx = this.txRepo.create({
      ...dto,
      type: TransactionType.OUT,
      balanceAfter: newQty,
    });
    const saved = await this.txRepo.save(tx);

    // Reorder level шалгах
    if (newQty <= paper.reorderLevel) {
      this.eventEmitter.emit('inventory.reorder.needed', {
        materialId: paper.id,
        materialName: paper.name,
        currentQty: newQty,
        reorderLevel: paper.reorderLevel,
      });
    }

    return saved;
  }

  // ── Adjustment (тооллогоор засвар) ───────────────────────
  async adjust(dto: {
    materialId: string;
    actualQty: number;
    reason: string;
    createdById: string;
  }): Promise<InventoryTransaction> {
    const paper = await this.paperRepo.findOne({ where: { id: dto.materialId } });
    const diff = dto.actualQty - paper.stockQty;

    await this.paperRepo.update(dto.materialId, { stockQty: dto.actualQty });

    return this.txRepo.save(this.txRepo.create({
      materialId: dto.materialId,
      qty: Math.abs(diff),
      type: TransactionType.ADJUSTMENT,
      reason: `${dto.reason} (${diff > 0 ? '+' : ''}${diff})`,
      createdById: dto.createdById,
      balanceAfter: dto.actualQty,
    }));
  }

  // ── Transaction history ──────────────────────────────────
  async getTransactions(filters: {
    materialId?: string;
    type?: TransactionType;
    from?: Date;
    to?: Date;
    limit?: number;
  }): Promise<InventoryTransaction[]> {
    const qb = this.txRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.material', 'material')
      .leftJoinAndSelect('tx.createdBy', 'createdBy')
      .orderBy('tx.createdAt', 'DESC')
      .take(filters.limit ?? 50);

    if (filters.materialId) qb.andWhere('tx.materialId = :mid', { mid: filters.materialId });
    if (filters.type) qb.andWhere('tx.type = :type', { type: filters.type });
    if (filters.from && filters.to) {
      qb.andWhere('tx.createdAt BETWEEN :from AND :to', { from: filters.from, to: filters.to });
    }

    return qb.getMany();
  }

  // ── Low stock alert list ─────────────────────────────────
  async getLowStockItems(): Promise<PaperStock[]> {
    return this.paperRepo
      .createQueryBuilder('p')
      .where('p.stockQty <= p.reorderLevel')
      .andWhere('p.isActive = true')
      .orderBy('p.stockQty', 'ASC')
      .getMany();
  }

  // ── Warehouse summary ────────────────────────────────────
  async getSummary(): Promise<{
    totalItems: number;
    lowStockCount: number;
    totalValue: number;
    recentMovements: number;
  }> {
    const [papers, lowStock, recentTx] = await Promise.all([
      this.paperRepo.find({ where: { isActive: true } }),
      this.getLowStockItems(),
      this.txRepo.count({
        where: {
          createdAt: Between(
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            new Date(),
          ),
        },
      }),
    ]);

    const totalValue = papers.reduce((sum, p) => sum + p.stockQty * Number(p.pricePerSheet), 0);

    return {
      totalItems: papers.length,
      lowStockCount: lowStock.length,
      totalValue,
      recentMovements: recentTx,
    };
  }

  // ── Auto-reorder suggestions ────────────────────────────
  async getReorderSuggestions(): Promise<ReorderSuggestion[]> {
    const lowStock = await this.getLowStockItems();

    return lowStock.map(p => {
      const deficit = p.reorderLevel - p.stockQty;
      // Order 2x reorder level to avoid frequent reorders
      const suggestedQty = Math.max(deficit, p.reorderLevel) * 2;
      const urgency: ReorderSuggestion['urgency'] =
        p.stockQty === 0 ? 'critical' :
        p.stockQty <= p.reorderLevel * 0.5 ? 'low' : 'normal';

      return {
        materialId: p.id,
        materialName: p.name,
        currentQty: p.stockQty,
        reorderLevel: p.reorderLevel,
        suggestedQty,
        supplier: p.supplier ?? 'Тодорхойгүй',
        estimatedCost: suggestedQty * Number(p.pricePerSheet),
        urgency,
      };
    }).sort((a, b) => {
      const order = { critical: 0, low: 1, normal: 2 };
      return order[a.urgency] - order[b.urgency];
    });
  }

  // ── Bulk stock-in (нийлүүлэгчийн захиалга ирсэн) ───────
  async bulkStockIn(items: Array<{
    materialId: string;
    qty: number;
    unitCost?: number;
  }>, supplier: string, invoiceNo: string, createdById: string): Promise<InventoryTransaction[]> {
    const results: InventoryTransaction[] = [];
    for (const item of items) {
      const tx = await this.stockIn({
        materialId: item.materialId,
        qty: item.qty,
        unitCost: item.unitCost,
        supplier,
        invoiceNo,
        createdById,
      });
      results.push(tx);
    }
    this.logger.log(`Bulk stock-in: ${items.length} items from ${supplier} (invoice: ${invoiceNo})`);
    return results;
  }

  // ── Usage report (материалын зарцуулалтын тайлан) ────────
  async getUsageReport(days = 30): Promise<Array<{
    materialId: string;
    materialName: string;
    totalOut: number;
    totalIn: number;
    avgDailyUsage: number;
    daysUntilEmpty: number | null;
  }>> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const papers = await this.paperRepo.find({ where: { isActive: true } });

    const report = [];
    for (const paper of papers) {
      const [outTxs, inTxs] = await Promise.all([
        this.txRepo.find({ where: { materialId: paper.id, type: TransactionType.OUT, createdAt: Between(since, new Date()) } }),
        this.txRepo.find({ where: { materialId: paper.id, type: TransactionType.IN, createdAt: Between(since, new Date()) } }),
      ]);

      const totalOut = outTxs.reduce((s, t) => s + Number(t.qty), 0);
      const totalIn = inTxs.reduce((s, t) => s + Number(t.qty), 0);
      const avgDailyUsage = totalOut / days;
      const daysUntilEmpty = avgDailyUsage > 0 ? Math.round(paper.stockQty / avgDailyUsage) : null;

      report.push({
        materialId: paper.id,
        materialName: paper.name,
        totalOut,
        totalIn,
        avgDailyUsage: Math.round(avgDailyUsage * 10) / 10,
        daysUntilEmpty,
      });
    }

    return report.sort((a, b) => (a.daysUntilEmpty ?? 999) - (b.daysUntilEmpty ?? 999));
  }
}
