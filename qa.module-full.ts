// ============================================================
// qa-checkpoint.entity.ts
// ============================================================
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, JoinColumn
} from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';

export enum QaStage {
  PREPRESS   = 'prepress',
  PRINTING   = 'printing',
  FINISHING  = 'finishing',
  PACKAGING  = 'packaging',
  DELIVERY   = 'delivery',
}

export enum QaStatus {
  PASSED        = 'passed',
  FAILED        = 'failed',
  NEEDS_REWORK  = 'needs_rework',
  PENDING       = 'pending',
}

@Entity('qa_checkpoints')
export class QaCheckpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'enum', enum: QaStage })
  stage: QaStage;

  @Column({ type: 'enum', enum: QaStatus, default: QaStatus.PENDING })
  status: QaStatus;

  @Column({ nullable: true })
  checkedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'checkedById' })
  checkedBy: User;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: [] })
  photos: string[]; // Cloudinary URLs

  @Column({ type: 'jsonb', default: [] })
  issues: string[];

  @CreateDateColumn()
  createdAt: Date;
}


// ============================================================
// print-passport.entity.ts
// ============================================================
@Entity('print_passports')
export class PrintPassport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'jsonb', nullable: true })
  paperSpec: {
    paperStockId: string;
    name: string;
    size: string;
    weightGsm: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  inkSpec: {
    inkProfileId: string;
    type: string;
    colorMode: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  machineSpec: {
    machineId: string;
    machineName: string;
    assignedAt: Date;
  };

  @Column({ type: 'jsonb', default: [] })
  finishingSpecs: Array<{
    finishingOptionId: string;
    name: string;
    type: string;
  }>;

  @Column({ type: 'jsonb', default: [] })
  qaCheckpointIds: string[];

  @Column({ default: false })
  finalApproval: boolean;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  approvedById: string;

  @CreateDateColumn()
  createdAt: Date;
}


// ============================================================
// non-conformance-log.entity.ts
// ============================================================
@Entity('non_conformance_logs')
export class NonConformanceLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  stage: string;

  @Column()
  description: string;

  @Column({ type: 'enum', enum: ['minor', 'major', 'critical'], default: 'minor' })
  severity: string;

  @Column({ type: 'enum', enum: ['open', 'in_review', 'resolved', 'rejected'], default: 'open' })
  status: string;

  @Column({ type: 'jsonb', default: [] })
  photos: string[];

  @Column({ nullable: true })
  resolution: string;

  @Column({ nullable: true })
  reportedById: string;

  @Column({ nullable: true })
  resolvedById: string;

  @Column({ nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}


// ============================================================
// qa.service.ts
// ============================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class QaService {
  constructor(
    @InjectRepository(QaCheckpoint)
    private checkpointRepo: Repository<QaCheckpoint>,
    @InjectRepository(PrintPassport)
    private passportRepo: Repository<PrintPassport>,
    @InjectRepository(NonConformanceLog)
    private nclRepo: Repository<NonConformanceLog>,
  ) {}

  // ── Checkpoint ──────────────────────────────────────────
  async createCheckpoint(dto: {
    orderId: string;
    stage: QaStage;
    checkedById: string;
    status: QaStatus;
    notes?: string;
    photos?: string[];
    issues?: string[];
  }): Promise<QaCheckpoint> {
    const checkpoint = this.checkpointRepo.create(dto);
    const saved = await this.checkpointRepo.save(checkpoint);

    // PrintPassport-д бүртгэх
    await this.passportRepo
      .createQueryBuilder()
      .update(PrintPassport)
      .set({
        qaCheckpointIds: () => `"qaCheckpointIds" || '["${saved.id}"]'::jsonb`,
      })
      .where('orderId = :orderId', { orderId: dto.orderId })
      .execute();

    return saved;
  }

  async getCheckpointsByOrder(orderId: string): Promise<QaCheckpoint[]> {
    return this.checkpointRepo.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateCheckpoint(id: string, dto: Partial<QaCheckpoint>): Promise<QaCheckpoint> {
    await this.checkpointRepo.update(id, dto);
    return this.checkpointRepo.findOne({ where: { id } });
  }

  // ── PrintPassport ───────────────────────────────────────
  async createPassport(orderId: string, specs: Partial<PrintPassport>): Promise<PrintPassport> {
    const existing = await this.passportRepo.findOne({ where: { orderId } });
    if (existing) {
      await this.passportRepo.update(existing.id, specs);
      return this.passportRepo.findOne({ where: { orderId } });
    }
    return this.passportRepo.save(this.passportRepo.create({ orderId, ...specs }));
  }

  async getPassport(orderId: string): Promise<PrintPassport> {
    return this.passportRepo.findOne({ where: { orderId } });
  }

  async approvePassport(orderId: string, approvedById: string): Promise<PrintPassport> {
    await this.passportRepo.update(
      { orderId },
      { finalApproval: true, approvedAt: new Date(), approvedById }
    );
    return this.getPassport(orderId);
  }

  // ── Non-Conformance Log ─────────────────────────────────
  async createNcl(dto: Partial<NonConformanceLog>): Promise<NonConformanceLog> {
    return this.nclRepo.save(this.nclRepo.create(dto));
  }

  async getNclByOrder(orderId: string): Promise<NonConformanceLog[]> {
    return this.nclRepo.find({ where: { orderId }, order: { createdAt: 'DESC' } });
  }

  async resolveNcl(id: string, resolution: string, resolvedById: string): Promise<NonConformanceLog> {
    await this.nclRepo.update(id, {
      resolution,
      resolvedById,
      resolvedAt: new Date(),
      status: 'resolved',
    });
    return this.nclRepo.findOne({ where: { id } });
  }

  // ── QA Summary (dashboard-д) ────────────────────────────
  async getQaSummary(shopId?: string): Promise<{
    totalChecks: number;
    passedRate: number;
    openNcls: number;
    criticalNcls: number;
  }> {
    const [total, passed, openNcls, critical] = await Promise.all([
      this.checkpointRepo.count(),
      this.checkpointRepo.count({ where: { status: QaStatus.PASSED } }),
      this.nclRepo.count({ where: { status: 'open' } }),
      this.nclRepo.count({ where: { severity: 'critical', status: 'open' } }),
    ]);

    return {
      totalChecks: total,
      passedRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      openNcls,
      criticalNcls: critical,
    };
  }
}


// ============================================================
// qa.controller.ts
// ============================================================
import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('QA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('qa')
export class QaController {
  constructor(private readonly svc: QaService) {}

  @Post('checkpoints')
  createCheckpoint(@Body() dto: any) {
    return this.svc.createCheckpoint(dto);
  }

  @Get('checkpoints/order/:orderId')
  getCheckpoints(@Param('orderId') orderId: string) {
    return this.svc.getCheckpointsByOrder(orderId);
  }

  @Put('checkpoints/:id')
  updateCheckpoint(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateCheckpoint(id, dto);
  }

  @Post('passport/:orderId')
  createPassport(@Param('orderId') orderId: string, @Body() dto: any) {
    return this.svc.createPassport(orderId, dto);
  }

  @Get('passport/:orderId')
  getPassport(@Param('orderId') orderId: string) {
    return this.svc.getPassport(orderId);
  }

  @Patch('passport/:orderId/approve')
  approvePassport(@Param('orderId') orderId: string, @Body('approvedById') approvedById: string) {
    return this.svc.approvePassport(orderId, approvedById);
  }

  @Post('ncl')
  createNcl(@Body() dto: any) {
    return this.svc.createNcl(dto);
  }

  @Get('ncl/order/:orderId')
  getNclByOrder(@Param('orderId') orderId: string) {
    return this.svc.getNclByOrder(orderId);
  }

  @Patch('ncl/:id/resolve')
  resolveNcl(
    @Param('id') id: string,
    @Body('resolution') resolution: string,
    @Body('resolvedById') resolvedById: string,
  ) {
    return this.svc.resolveNcl(id, resolution, resolvedById);
  }

  @Get('summary')
  getSummary() {
    return this.svc.getQaSummary();
  }
}


// ============================================================
// qa.module.ts
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([QaCheckpoint, PrintPassport, NonConformanceLog])],
  controllers: [QaController],
  providers: [QaService],
  exports: [QaService],
})
export class QaModule {}
