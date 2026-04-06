// ============================================================
// inventory-transaction.entity.ts
// ============================================================
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, JoinColumn
} from 'typeorm';
import { PaperStock } from '../materials/entities/paper-stock.entity';
import { User } from '../users/entities/user.entity';

export enum TransactionType {
  IN          = 'in',         // Нийлүүлэгчээс ирсэн
  OUT         = 'out',        // Үйлдвэрлэлд зарцуулсан
  ADJUSTMENT  = 'adjustment', // Тооллогоор засвар
  DAMAGED     = 'damaged',    // Гэмтэл/хаягдал
  RETURN      = 'return',     // Буцаагдсан
}

@Entity('inventory_transactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  materialId: string;

  @ManyToOne(() => PaperStock)
  @JoinColumn({ name: 'materialId' })
  material: PaperStock;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column('decimal', { precision: 10, scale: 2 })
  qty: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitCost: number; // Нэгжийн зардал (IN үед)

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true })
  orderId: string; // OUT үед холбогдох захиалга

  @Column({ nullable: true })
  supplier: string;

  @Column({ nullable: true })
  invoiceNo: string;

  @Column()
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  balanceAfter: number; // Гүйлгээний дараах үлдэгдэл

  @CreateDateColumn()
  createdAt: Date;
}


// ============================================================
// warehouse.service.ts
// ============================================================
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WarehouseService {
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

  // ── Adjustment (тооллогоор засвар) ──────────────────────
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

  // ── Transaction history ─────────────────────────────────
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

  // ── Low stock alert list ────────────────────────────────
  async getLowStockItems(): Promise<PaperStock[]> {
    return this.paperRepo
      .createQueryBuilder('p')
      .where('p.stockQty <= p.reorderLevel')
      .andWhere('p.isActive = true')
      .orderBy('p.stockQty', 'ASC')
      .getMany();
  }

  // ── Warehouse summary ───────────────────────────────────
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
            new Date()
          )
        }
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
}


// ============================================================
// warehouse.controller.ts
// ============================================================
import {
  Controller, Get, Post, Body, Query, UseGuards, Param
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Warehouse')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly svc: WarehouseService) {}

  @Post('stock-in')
  @Roles('admin', 'superadmin', 'factory')
  stockIn(@Body() dto: any) {
    return this.svc.stockIn(dto);
  }

  @Post('stock-out')
  @Roles('admin', 'superadmin', 'factory')
  stockOut(@Body() dto: any) {
    return this.svc.stockOut(dto);
  }

  @Post('adjust')
  @Roles('admin', 'superadmin', 'factory')
  adjust(@Body() dto: any) {
    return this.svc.adjust(dto);
  }

  @Get('transactions')
  getTransactions(@Query() query: any) {
    return this.svc.getTransactions(query);
  }

  @Get('low-stock')
  getLowStock() {
    return this.svc.getLowStockItems();
  }

  @Get('summary')
  getSummary() {
    return this.svc.getSummary();
  }
}


// ============================================================
// warehouse.module.ts
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryTransaction, PaperStock])],
  controllers: [WarehouseController],
  providers: [WarehouseService],
  exports: [WarehouseService],
})
export class WarehouseModule {}
