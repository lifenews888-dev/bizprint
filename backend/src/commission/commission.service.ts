import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { CommissionLog, CommissionStatus } from './commission.entity';
import { Vendor } from '../vendors/vendor.entity';
import { OrderVendorGroup } from '../orders/entities/order-vendor-group.entity';
import { Order } from '../orders/entities/order.entity';
import { MailService } from '../mail/mail.service';
import { WalletService } from '../wallet/wallet.service';
import { EventBusService } from '../events/event-bus.service';
import { BizEvent } from '../events/event-types';

@Injectable()
export class CommissionService implements OnModuleInit {
  private readonly logger = new Logger(CommissionService.name);

  constructor(
    @InjectRepository(CommissionLog)
    private repo: Repository<CommissionLog>,
    @InjectRepository(Vendor)
    private vendorRepo: Repository<Vendor>,
    @InjectRepository(OrderVendorGroup)
    private vendorGroupRepo: Repository<OrderVendorGroup>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private readonly walletService: WalletService,
    private readonly eventBus: EventBusService,
    @Optional() private mailService?: MailService,
  ) {}

  onModuleInit() {
    // Auto-create PENDING commission row(s) when an order is paid.
    // Listening via EventBus avoids circular module dependencies.
    this.eventBus.on(BizEvent.ORDER_PAID, (payload: any) => {
      this.createCommissionForOrder(payload?.orderId).catch(e =>
        this.logger.error(`createCommissionForOrder(${payload?.orderId}) failed: ${e.message}`),
      );
    });
  }

  /**
   * On payment confirmation, generate one PENDING commission row per vendor
   * group (multi-vendor orders generate multiple rows). Idempotent: if a row
   * already exists for an order_id+vendor_id pair we skip.
   */
  async createCommissionForOrder(orderId: string) {
    if (!orderId) return;
    const groups = await this.vendorGroupRepo.find({ where: { order_id: orderId } });
    if (!groups.length) {
      // Single-vendor / legacy order — fall back to factory_id on the order
      const order = await this.orderRepo.findOne({ where: { id: orderId } });
      if (!order || !(order as any).factory_id) {
        this.logger.warn(`No vendor groups for paid order ${orderId} — commission skipped`);
        return;
      }
      const vendor = await this.vendorRepo.findOne({ where: { id: (order as any).factory_id } });
      const vendorUserId = vendor?.user_id || (order as any).factory_id;
      const existing = await this.repo.findOne({ where: { order_id: orderId, vendor_id: vendorUserId } });
      if (existing) return;
      await this.create({
        orderId,
        vendorId: vendorUserId,
        vendorName: vendor?.company_name,
        grossAmount: Number(order.total_price) || 0,
      });
      return;
    }

    for (const g of groups) {
      const vendor = await this.vendorRepo.findOne({ where: { id: g.vendor_id } }).catch(() => null);
      const vendorUserId = vendor?.user_id || g.vendor_id;
      const existing = await this.repo.findOne({ where: { order_id: orderId, vendor_id: vendorUserId } });
      if (existing) continue;
      await this.create({
        orderId,
        vendorId: vendorUserId,
        vendorName: vendor?.company_name,
        grossAmount: Number(g.subtotal) || 0,
      });
    }
  }

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

    // Credit each vendor's wallet + notify (best-effort).
    // We intentionally do NOT throw if wallet credit fails — the commission row
    // remains APPROVED so admin can retry; an error here must not roll back the
    // batch status update which has already been committed.
    try {
      const logs = await this.repo.find({ where: { payout_batch_id: batchId } });
      const vendorIds = Array.from(new Set(logs.map(l => l.vendor_id).filter(Boolean)));
      for (const vendorId of vendorIds) {
        const vendorLogs = logs.filter(l => l.vendor_id === vendorId);
        const netAmount = vendorLogs.reduce((sum, l) => sum + Number(l.net_amount), 0);

        try {
          await this.walletService.credit(
            vendorId!,
            netAmount,
            'commission_payout',
            batchId,
            `Commission batch ${batchId} (${vendorLogs.length} orders)`,
          );
        } catch (e: any) {
          this.logger.error(`Wallet credit failed for vendor ${vendorId} batch ${batchId}: ${e.message}`);
        }

        const vendor = await this.vendorRepo.findOne({ where: { user_id: vendorId } }).catch(() => null);
        if (vendor?.contact_email && this.mailService) {
          this.mailService.sendVendorPayoutApproved(
            { email: vendor.contact_email, name: vendor.company_name },
            { batchId, netAmount, count: vendorLogs.length },
          ).catch(e => this.logger.warn(`Vendor payout email failed: ${e.message}`));
        }
      }
    } catch (e: any) {
      this.logger.error(`approvePayout post-processing failed for batch ${batchId}: ${e.message}`);
    }

    return { batchId, count: ids.length };
  }

  /**
   * Auto-approve commissions for orders that have been DELIVERED ≥ 48 hours
   * with no refund/dispute filed. Called by escrow release cron.
   *
   * Returns the number of commissions promoted to APPROVED.
   */
  async autoApproveDelayedCommissions(holdHours = 48) {
    const cutoff = new Date(Date.now() - holdHours * 60 * 60 * 1000);
    // commission_logs.order_id is varchar in this schema; cast to uuid for join.
    const eligible = await this.repo.createQueryBuilder('c')
      .innerJoin('orders', 'o', 'o.id = c.order_id::uuid')
      .where('c.status = :status', { status: CommissionStatus.PENDING })
      .andWhere('LOWER(o.status) = :delivered', { delivered: 'delivered' })
      .andWhere('o.delivered_at IS NOT NULL')
      .andWhere('o.delivered_at < :cutoff', { cutoff })
      .select(['c.id'])
      .getMany();

    if (!eligible.length) return { count: 0, batchId: null };
    const ids = eligible.map(e => e.id);
    this.logger.log(`Escrow released for ${ids.length} commission(s) past ${holdHours}h hold`);
    return this.approvePayout(ids);
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
