import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QaCheckpoint, QaStage, QaStatus } from './entities/qa-checkpoint.entity';
import { PrintPassport } from './entities/print-passport.entity';
import { NonConformanceLog } from './entities/non-conformance-log.entity';

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

  // ── QA Summary ────────────────────────────────────────────
  async getQaSummary(): Promise<{
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
