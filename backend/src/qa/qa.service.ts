import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QaCheckpoint, QaStage, QaStatus } from './entities/qa-checkpoint.entity';
import { PrintPassport } from './entities/print-passport.entity';
import { NonConformanceLog } from './entities/non-conformance-log.entity';

@Injectable()
export class QaService {
  private readonly logger = new Logger(QaService.name);

  constructor(
    @InjectRepository(QaCheckpoint)
    private checkpointRepo: Repository<QaCheckpoint>,
    @InjectRepository(PrintPassport)
    private passportRepo: Repository<PrintPassport>,
    @InjectRepository(NonConformanceLog)
    private nclRepo: Repository<NonConformanceLog>,
  ) {}

  // ── Checkpoint ────────────────────────────────────────────
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

  // ── PrintPassport ─────────────────────────────────────────
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
      { finalApproval: true, approvedAt: new Date(), approvedById },
    );
    return this.getPassport(orderId);
  }

  // ── Non-Conformance Log ───────────────────────────────────
  async createNcl(dto: Partial<NonConformanceLog>): Promise<NonConformanceLog> {
    return this.nclRepo.save(this.nclRepo.create(dto));
  }

  async getAllNcl(): Promise<NonConformanceLog[]> {
    return this.nclRepo.find({ order: { createdAt: 'DESC' }, take: 100 });
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

  // ── Operator Sign-Off ──────────────────────────────────────
  async operatorSignOff(checkpointId: string, operatorId: string, signOffNote?: string): Promise<QaCheckpoint> {
    const checkpoint = await this.checkpointRepo.findOne({ where: { id: checkpointId } });
    if (!checkpoint) throw new Error('Checkpoint олдсонгүй');

    this.logger.log(`Operator sign-off: checkpoint=${checkpointId}, operator=${operatorId}`);

    await this.checkpointRepo.update(checkpointId, {
      checkedById: operatorId,
      notes: signOffNote
        ? `${checkpoint.notes ?? ''}\n[Sign-off] ${signOffNote}`.trim()
        : checkpoint.notes,
    });
    return this.checkpointRepo.findOne({ where: { id: checkpointId } });
  }

  // ── Order QA report (бүх шалгалтууд нэг дор) ─────────────
  async getOrderQaReport(orderId: string): Promise<{
    passport: PrintPassport | null;
    checkpoints: QaCheckpoint[];
    ncls: NonConformanceLog[];
    allPassed: boolean;
    hasOpenNcls: boolean;
  }> {
    const [passport, checkpoints, ncls] = await Promise.all([
      this.getPassport(orderId),
      this.getCheckpointsByOrder(orderId),
      this.getNclByOrder(orderId),
    ]);

    const allPassed = checkpoints.length > 0 && checkpoints.every(c => c.status === QaStatus.PASSED);
    const hasOpenNcls = ncls.some(n => n.status === 'open' || n.status === 'in_review');

    return { passport, checkpoints, ncls, allPassed, hasOpenNcls };
  }

  // ── NCL-г review горимд шилжүүлэх ────────────────────────
  async reviewNcl(id: string, _reviewedById: string): Promise<NonConformanceLog> {
    await this.nclRepo.update(id, { status: 'in_review' });
    return this.nclRepo.findOne({ where: { id } });
  }

  // ── NCL reject ────────────────────────────────────────────
  async rejectNcl(id: string, reason: string, rejectedById: string): Promise<NonConformanceLog> {
    await this.nclRepo.update(id, {
      status: 'rejected',
      resolution: `[Rejected] ${reason}`,
      resolvedById: rejectedById,
      resolvedAt: new Date(),
    });
    return this.nclRepo.findOne({ where: { id } });
  }

  // ── QA Summary ────────────────────────────────────────────
  async getQaSummary(): Promise<{
    totalChecks: number;
    passedRate: number;
    failedRate: number;
    openNcls: number;
    criticalNcls: number;
    reworkCount: number;
  }> {
    const [total, passed, failed, rework, openNcls, critical] = await Promise.all([
      this.checkpointRepo.count(),
      this.checkpointRepo.count({ where: { status: QaStatus.PASSED } }),
      this.checkpointRepo.count({ where: { status: QaStatus.FAILED } }),
      this.checkpointRepo.count({ where: { status: QaStatus.NEEDS_REWORK } }),
      this.nclRepo.count({ where: { status: 'open' } }),
      this.nclRepo.count({ where: { severity: 'critical', status: 'open' } }),
    ]);

    return {
      totalChecks: total,
      passedRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      failedRate: total > 0 ? Math.round((failed / total) * 100) : 0,
      openNcls,
      criticalNcls: critical,
      reworkCount: rework,
    };
  }
}
