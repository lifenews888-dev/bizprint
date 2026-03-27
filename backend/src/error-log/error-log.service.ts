import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { ErrorLog, ErrorSource, ErrorSeverity, ErrorStatus } from './error-log.entity';

@Injectable()
export class ErrorLogService {
  constructor(
    @InjectRepository(ErrorLog)
    private repo: Repository<ErrorLog>,
  ) {}

  /** Log a new error (or increment count if same message exists within 1h) */
  async log(data: {
    source: ErrorSource
    severity?: ErrorSeverity
    message: string
    error_code?: string
    stack_trace?: string
    user_id?: string
    order_id?: string
    endpoint?: string
    http_method?: string
    http_status?: number
    app_version?: string
    device_info?: string
    os?: string
    browser?: string
    metadata?: Record<string, any>
  }): Promise<ErrorLog> {
    // Deduplicate: same source + message within 1 hour → increment count
    const oneHourAgo = new Date(Date.now() - 3600000);
    const existing = await this.repo.findOne({
      where: {
        source: data.source,
        message: data.message,
        status: In([ErrorStatus.OPEN, ErrorStatus.INVESTIGATING]),
      },
      order: { created_at: 'DESC' },
    });

    if (existing && new Date(existing.created_at) > oneHourAgo) {
      existing.occurrence_count += 1;
      existing.metadata = { ...existing.metadata, ...data.metadata };
      return this.repo.save(existing);
    }

    return this.repo.save(this.repo.create({
      ...data,
      severity: data.severity || this.autoSeverity(data),
      first_seen_at: new Date(),
    }));
  }

  /** Auto-determine severity based on context */
  private autoSeverity(data: any): ErrorSeverity {
    if (data.http_status >= 500) return ErrorSeverity.HIGH;
    if (data.source === 'payment') return ErrorSeverity.CRITICAL;
    if (data.source === 'webhook' || data.source === 'queue') return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  /** Get summary for dashboard */
  async getSummary() {
    const total = await this.repo.count();
    const open = await this.repo.count({ where: { status: ErrorStatus.OPEN } });
    const critical = await this.repo.count({ where: { status: ErrorStatus.OPEN, severity: ErrorSeverity.CRITICAL } });
    const high = await this.repo.count({ where: { status: ErrorStatus.OPEN, severity: ErrorSeverity.HIGH } });

    // By source
    const bySource = await this.repo
      .createQueryBuilder('e')
      .select(['e.source as source', 'COUNT(*)::int as count'])
      .where('e.status = :s', { s: ErrorStatus.OPEN })
      .groupBy('e.source')
      .getRawMany();

    // Recent errors
    const recent = await this.repo.find({
      where: { status: In([ErrorStatus.OPEN, ErrorStatus.INVESTIGATING]) },
      order: { created_at: 'DESC' },
      take: 20,
    });

    return { total, open, critical, high, by_source: bySource, recent };
  }

  /** List errors with filters */
  async findAll(filters?: {
    source?: ErrorSource
    severity?: ErrorSeverity
    status?: ErrorStatus
    start?: Date
    end?: Date
    limit?: number
  }) {
    const qb = this.repo.createQueryBuilder('e');

    if (filters?.source) qb.andWhere('e.source = :source', { source: filters.source });
    if (filters?.severity) qb.andWhere('e.severity = :severity', { severity: filters.severity });
    if (filters?.status) qb.andWhere('e.status = :status', { status: filters.status });
    if (filters?.start && filters?.end) qb.andWhere('e.created_at BETWEEN :s AND :e', { s: filters.start, e: filters.end });

    return qb.orderBy('e.created_at', 'DESC').take(filters?.limit || 50).getMany();
  }

  /** Update error status (resolve, investigate, ignore) */
  async updateStatus(id: string, status: ErrorStatus, resolvedBy?: string, note?: string) {
    const update: any = { status };
    if (status === ErrorStatus.RESOLVED) {
      update.resolved_at = new Date();
      update.resolved_by = resolvedBy;
      update.resolution_note = note;
    }
    await this.repo.update(id, update);
    return this.repo.findOne({ where: { id } });
  }

  /** Find errors by order ID (debug mode) */
  async findByOrder(orderId: string) {
    return this.repo.find({ where: { order_id: orderId }, order: { created_at: 'DESC' } });
  }
}
