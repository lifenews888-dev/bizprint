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
}
