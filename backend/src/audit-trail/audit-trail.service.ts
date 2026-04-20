import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditTrail } from './audit-trail.entity';

@Injectable()
export class AuditTrailService {
  constructor(
    @InjectRepository(AuditTrail)
    private repo: Repository<AuditTrail>,
  ) {}

  async create(data: { order_id: string; user: string; action: string; file?: string }) {
    const entry = this.repo.create(data);
    return this.repo.save(entry);
  }

  async getByOrderId(orderId: string) {
    return this.repo.find({
      where: { order_id: orderId },
      order: { created_at: 'DESC' },
    });
  }

  async bulkCreate(entries: { order_id: string; user: string; action: string; file?: string }[]) {
    const items = entries.map(e => this.repo.create(e));
    return this.repo.save(items);
  }

  async findAll(limit = 200, search?: string) {
    const qb = this.repo.createQueryBuilder('a').orderBy('a.created_at', 'DESC').take(limit);
    if (search) {
      qb.where('a.order_id ILIKE :s OR a.user ILIKE :s OR a.action ILIKE :s', { s: `%${search}%` });
    }
    return qb.getMany();
  }
}
