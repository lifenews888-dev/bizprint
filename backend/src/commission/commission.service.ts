import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CommissionLog, CommissionStatus } from './commission.entity';
import { Vendor } from '../vendors/vendor.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class CommissionService {
  constructor(
    @InjectRepository(CommissionLog)
    private repo: Repository<CommissionLog>,
    @InjectRepository(Vendor)
    private vendorRepo: Repository<Vendor>,
    @Optional() private mailService?: MailService,
  ) {}

  async create(data: {
    orderId?: string;
    inquiryId?: string;
    vendorId?: string;
    vendorName?: string;
    grossAmount: number;
    commissionRate?: number;
  }): Promise<CommissionLog> {
    let rate = data.commissionRate ?? 15;
    let vendorName = data.vendorName;

    // Vendor-specific rate lookup (vendorId is the linked user_id from JWT)
    if (data.vendorId && data.commissionRate == null) {
      try {
        const vendor = await this.vendorRepo.findOne({ where: { user_id: data.vendorId } });
        if (vendor) {
          if (vendor.commission_rate != null) rate = Number(vendor.commission_rate);
          if (!vendorName) vendorName = vendor.company_name;
        }
      } catch {}
    }

    const commission = Math.round((data.grossAmount * rate) / 100);
    const net = data.grossAmount - commission;

    return this.repo.save(
      this.repo.create({
        order_id: data.orderId,
        inquiry_id: data.inquiryId,
        vendor_id: data.vendorId,
        vendor_name: vendorName,
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

    // Notify vendors (fire-and-forget)
    try {
      const logs = await this.repo.find({ where: { payout_batch_id: batchId } });
      const vendorIds = Array.from(new Set(logs.map(l => l.vendor_id).filter(Boolean)));
      for (const vendorId of vendorIds) {
        const vendor = await this.vendorRepo.findOne({ where: { user_id: vendorId } }).catch(() => null);
        if (!vendor?.contact_email || !this.mailService) continue;
        const vendorLogs = logs.filter(l => l.vendor_id === vendorId);
        const netAmount = vendorLogs.reduce((sum, l) => sum + Number(l.net_amount), 0);
        this.mailService.sendVendorPayoutApproved(
          { email: vendor.contact_email, name: vendor.company_name },
          { batchId, netAmount, count: vendorLogs.length },
        ).catch(() => {});
      }
    } catch {}

    return { batchId, count: ids.length };
  }

  async markPaid(batchId: string) {
    await this.repo.update(
      { payout_batch_id: batchId },
      { status: CommissionStatus.PAID, paid_at: new Date() },
    );
    return { ok: true };
  }

  async getBatches() {
    const rows = await this.repo
      .createQueryBuilder('c')
      .select([
        'c.payout_batch_id as "batchId"',
        'c.status as status',
        'COUNT(*) as count',
        'SUM(c.net_amount) as "totalNet"',
        'SUM(c.gross_amount) as "totalGross"',
        'MIN(c.created_at) as "created_at"',
      ])
      .where('c.payout_batch_id IS NOT NULL')
      .groupBy('c.payout_batch_id')
      .addGroupBy('c.status')
      .orderBy('MIN(c.created_at)', 'DESC')
      .getRawMany();

    const batches = await Promise.all(
      rows.map(async (batch) => {
        const vendors = await this.repo
          .createQueryBuilder('c')
          .select([
            'c.vendor_id as "vendorId"',
            'c.vendor_name as "vendorName"',
            'SUM(c.net_amount) as "netAmount"',
            'COUNT(*) as count',
          ])
          .where('c.payout_batch_id = :batchId', { batchId: batch.batchId })
          .groupBy('c.vendor_id')
          .addGroupBy('c.vendor_name')
          .getRawMany();
        return {
          batchId: batch.batchId,
          status: batch.status,
          count: Number(batch.count || 0),
          totalNet: Number(batch.totalNet || 0),
          totalGross: Number(batch.totalGross || 0),
          created_at: batch.created_at,
          vendors: vendors.map((v: any) => ({
            vendorId: v.vendorId,
            vendorName: v.vendorName,
            netAmount: Number(v.netAmount || 0),
            count: Number(v.count || 0),
          })),
        };
      }),
    );

    return batches;
  }
}
