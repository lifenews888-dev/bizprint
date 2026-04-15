import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CommissionLog, CommissionStatus } from './commission.entity';

@Injectable()
export class CommissionService {
  constructor(
    @InjectRepository(CommissionLog)
    private repo: Repository<CommissionLog>,
  ) {}

  async create(data: {
    orderId?: string;
    inquiryId?: string;
    vendorId?: string;
    vendorName?: string;
    grossAmount: number;
    commissionRate?: number;
  }): Promise<CommissionLog> {
    const rate = data.commissionRate ?? 15;
    const commission = Math.round((data.grossAmount * rate) / 100);
    const net = data.grossAmount - commission;

    return this.repo.save(
      this.repo.create({
        order_id: data.orderId,
        inquiry_id: data.inquiryId,
        vendor_id: data.vendorId,
        vendor_name: data.vendorName,
        gross_amount: data.grossAmount,
        commission_rate: rate,
        commission_amount: commission,
        net_amount: net,
        status: CommissionStatus.PENDING,
      }),
    );
  }

  findAll(filters: { vendorId?: string; status?: string } = {}) {
    const qb = this.repo.createQueryBuilder('c').orderBy('c.created_at', 'DESC');
    if (filters.vendorId) qb.andWhere('c.vendor_id = :v', { v: filters.vendorId });
    if (filters.status) qb.andWhere('c.status = :s', { s: filters.status });
    return qb.getMany();
  }

  async getSummary(vendorId?: string) {
    const qb = this.repo.createQueryBuilder('c');
    if (vendorId) qb.where('c.vendor_id = :v', { v: vendorId });

    const result = await qb
      .select([
        'SUM(c.gross_amount) as totalGross',
        'SUM(c.commission_amount) as totalCommission',
        'SUM(c.net_amount) as totalNet',
        `SUM(CASE WHEN c.status = 'pending' THEN c.net_amount ELSE 0 END) as pendingPayout`,
        'COUNT(*) as totalOrders',
      ])
      .getRawOne();

    return {
      totalGross: Number(result?.totalgross || result?.totalGross || 0),
      totalCommission: Number(result?.totalcommission || result?.totalCommission || 0),
      totalNet: Number(result?.totalnet || result?.totalNet || 0),
      pendingPayout: Number(result?.pendingpayout || result?.pendingPayout || 0),
      totalOrders: Number(result?.totalorders || result?.totalOrders || 0),
    };
  }

  async approvePayout(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) return { batchId: null, count: 0 };
    const batchId = `BATCH-${Date.now()}`;
    await this.repo.update({ id: In(ids) }, {
      status: CommissionStatus.APPROVED,
      payout_batch_id: batchId,
    });
    return { batchId, count: ids.length };
  }

  async markPaid(batchId: string) {
    await this.repo.update(
      { payout_batch_id: batchId },
      { status: CommissionStatus.PAID, paid_at: new Date() },
    );
    return { ok: true };
  }
}
