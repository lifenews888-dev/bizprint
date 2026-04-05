import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductionJob, ProductionStatus } from './entities/production-job.entity';

const VALID_TRANSITIONS: Record<string, string[]> = {
  QUEUED:    ['ASSIGNED', 'CANCELLED'],
  ASSIGNED:  ['PRINTING', 'QUEUED', 'CANCELLED'],
  PRINTING:  ['FINISHING', 'ASSIGNED'],
  FINISHING: ['COMPLETED', 'PRINTING'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(ProductionJob)
    private jobRepo: Repository<ProductionJob>,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(filters: { status?: string; shopId?: string }): Promise<ProductionJob[]> {
    const qb = this.jobRepo
      .createQueryBuilder('job')
      .orderBy(
        "CASE job.priority WHEN 'rush' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END",
        'ASC',
      )
      .addOrderBy('job.createdAt', 'ASC');

    if (filters.status) qb.andWhere('job.status = :status', { status: filters.status });
    if (filters.shopId) qb.andWhere('job.shopId = :shopId', { shopId: filters.shopId });

    return qb.getMany();
  }

  async findOne(id: string): Promise<ProductionJob> {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) throw new NotFoundException(`Production job ${id} олдсонгүй`);
    return job;
  }

  async createJob(dto: Partial<ProductionJob> & { createdById?: string }): Promise<ProductionJob> {
    const job = this.jobRepo.create({
      status: ProductionStatus.QUEUED,
      priority: 'normal',
      ...dto,
    });
    const saved = await this.jobRepo.save(job);
    this.eventEmitter.emit('production.job.created', saved);
    return saved;
  }

  // ── Drag & drop status update ────────────────────
  async updateStatus(id: string, newStatus: string, updatedById: string): Promise<ProductionJob> {
    const job = await this.findOne(id);

    const allowed = VALID_TRANSITIONS[job.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `${job.status} → ${newStatus} шилжилт зөвшөөрөгдөхгүй. Зөвшөөрөгдөх: ${allowed.join(', ')}`,
      );
    }

    const updates: Partial<ProductionJob> = { status: newStatus as ProductionStatus };

    if (newStatus === ProductionStatus.PRINTING && !job.startedAt) {
      updates.startedAt = new Date();
    }
    if (newStatus === ProductionStatus.COMPLETED) {
      updates.completedAt = new Date();
      this.eventEmitter.emit('production.job.completed', job);
    }

    await this.jobRepo.update(id, updates);
    const updated = await this.findOne(id);

    this.eventEmitter.emit('production.status.changed', {
      jobId: id,
      orderId: job.orderId,
      oldStatus: job.status,
      newStatus,
      updatedById,
    });

    return updated;
  }

  async assignMachine(id: string, machineId: string, assignedById: string): Promise<ProductionJob> {
    await this.jobRepo.update(id, {
      machineId,
      status: ProductionStatus.ASSIGNED,
    });
    return this.findOne(id);
  }

  async startJob(id: string, startedById: string): Promise<ProductionJob> {
    return this.updateStatus(id, ProductionStatus.PRINTING, startedById);
  }

  async completeJob(id: string, completedById: string): Promise<ProductionJob> {
    return this.updateStatus(id, ProductionStatus.COMPLETED, completedById);
  }

  // ── Dashboard summary ────────────────────────────
  async getSummary(shopId?: string): Promise<{
    queued: number;
    assigned: number;
    printing: number;
    finishing: number;
    completedToday: number;
    rushJobs: number;
    avgCompletionHours: number;
  }> {
    const where: any = shopId ? { shopId } : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [queued, assigned, printing, finishing, completedToday, rushJobs] = await Promise.all([
      this.jobRepo.count({ where: { ...where, status: ProductionStatus.QUEUED } }),
      this.jobRepo.count({ where: { ...where, status: ProductionStatus.ASSIGNED } }),
      this.jobRepo.count({ where: { ...where, status: ProductionStatus.PRINTING } }),
      this.jobRepo.count({ where: { ...where, status: ProductionStatus.FINISHING } }),
      this.jobRepo
        .createQueryBuilder('job')
        .where('job.status = :s', { s: ProductionStatus.COMPLETED })
        .andWhere('job.completedAt >= :today', { today })
        .getCount(),
      this.jobRepo.count({ where: { ...where, status: ProductionStatus.QUEUED, priority: 'rush' } }),
    ]);

    const completed = await this.jobRepo.find({
      where: { ...where, status: ProductionStatus.COMPLETED },
      order: { completedAt: 'DESC' },
      take: 30,
    });

    const avgMs = completed.reduce((sum, j) => {
      if (!j.startedAt || !j.completedAt) return sum;
      return sum + (new Date(j.completedAt).getTime() - new Date(j.startedAt).getTime());
    }, 0) / (completed.length || 1);

    return {
      queued,
      assigned,
      printing,
      finishing,
      completedToday,
      rushJobs,
      avgCompletionHours: Math.round(avgMs / 3600000 * 10) / 10,
    };
  }

  // ── Legacy compat ────────────────────────────────
  getAllJobs() { return this.findAll({}); }
  getJob(id: string) { return this.findOne(id); }
  getJobsByOrder(orderId: string) { return this.jobRepo.find({ where: { orderId } }); }
}
