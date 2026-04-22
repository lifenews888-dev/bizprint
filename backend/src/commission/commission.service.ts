import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { CommissionLog, CommissionStatus } from './commission.entity';
import { SalesCommission } from './sales-commission.entity';
import { DesignerRoyalty } from './designer-royalty.entity';
import { Vendor } from '../vendors/vendor.entity';
import { OrderVendorGroup } from '../orders/entities/order-vendor-group.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { Referral } from '../referral/referral.entity';
import { Template } from '../templates/template.entity';
import { MailService } from '../mail/mail.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationService } from '../notifications/notification.service';
import { EventBusService } from '../events/event-bus.service';
import { BizEvent } from '../events/event-types';

// Default sales commission rate when the agent's referral row has no
// per-agent override. Same 10% the rest of the codebase assumes.
const DEFAULT_SALES_RATE = 10;

// Margin estimate when ProfitEngine has not produced an OrderProfit row.
// We treat 40% of order total as platform margin — admin can edit the
// commission_amount manually before payout for unusual jobs.
const FALLBACK_MARGIN_RATE = 0.4;

@Injectable()
export class CommissionService implements OnModuleInit {
  private readonly logger = new Logger(CommissionService.name);

  constructor(
    @InjectRepository(CommissionLog)
    private repo: Repository<CommissionLog>,
    @InjectRepository(SalesCommission)
    private salesRepo: Repository<SalesCommission>,
    @InjectRepository(DesignerRoyalty)
    private royaltyRepo: Repository<DesignerRoyalty>,
    @InjectRepository(Vendor)
    private vendorRepo: Repository<Vendor>,
    @InjectRepository(OrderVendorGroup)
    private vendorGroupRepo: Repository<OrderVendorGroup>,
    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(Referral)
    private referralRepo: Repository<Referral>,
    @InjectRepository(Template)
    private templateRepo: Repository<Template>,
    private readonly walletService: WalletService,
    private readonly eventBus: EventBusService,
    private readonly notificationService: NotificationService,
    @Optional() private mailService?: MailService,
  ) {}

  onModuleInit() {
    // Auto-create PENDING commission row(s) when an order is paid.
    // Listening via EventBus avoids circular module dependencies.
    this.eventBus.on(BizEvent.ORDER_PAID, (payload: any) => {
      const orderId = payload?.orderId;
      this.createCommissionForOrder(orderId).catch(e =>
        this.logger.error(`createCommissionForOrder(${orderId}) failed: ${e.message}`),
      );
      this.createSalesCommissionForOrder(orderId).catch(e =>
        this.logger.error(`createSalesCommissionForOrder(${orderId}) failed: ${e.message}`),
      );
      this.createDesignerRoyaltiesForOrder(orderId).catch(e =>
        this.logger.error(`createDesignerRoyaltiesForOrder(${orderId}) failed: ${e.message}`),
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

  /* ═══════════════════════════════════════════════════════════════════
     SALES COMMISSION — payout to the sales agent who referred the order
     ═══════════════════════════════════════════════════════════════════ */

  /**
   * On payment confirmation, generate a PENDING sales commission row when
   * the order has a sales_agent_id. Idempotent.
   */
  async createSalesCommissionForOrder(orderId: string) {
    if (!orderId) return;
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order || !(order as any).sales_agent_id) return;

    const salesUserId = (order as any).sales_agent_id as string;
    const existing = await this.salesRepo.findOne({ where: { order_id: orderId, sales_user_id: salesUserId } });
    if (existing) return;

    // Resolve the per-agent rate from the referral row, or fall back to default.
    const ref = await this.referralRepo.findOne({ where: { sales_user_id: salesUserId } }).catch(() => null);
    const rate = ref?.commission_rate ? Number(ref.commission_rate) : DEFAULT_SALES_RATE;

    const orderTotal = Number(order.total_price) || 0;
    const margin = Math.round(orderTotal * FALLBACK_MARGIN_RATE);
    const commission = Math.round((margin * rate) / 100);

    await this.salesRepo.save(this.salesRepo.create({
      order_id: orderId,
      sales_user_id: salesUserId,
      order_total: orderTotal,
      margin_amount: margin,
      commission_rate: rate,
      commission_amount: commission,
      status: CommissionStatus.PENDING,
    }));

    this.logger.log(`Sales commission ${commission}₮ created for agent ${salesUserId} on order ${orderId}`);

    // Tell the agent right away — they should see the win the moment the
    // customer pays, not 48 hours later when escrow releases. Estimated
    // amount (status = pending) is shown so they know what's coming.
    this.notificationService.create({
      user_id: salesUserId,
      type: 'order',
      title: '🎉 Шинэ захиалга — таны тооцоонд',
      message: `₮${orderTotal.toLocaleString()} захиалга төлөгдлөө. Шагнал ~₮${commission.toLocaleString()} (${rate}%) хүлээгдэж байна.`,
      data: { order_id: orderId, commission_amount: commission, status: 'pending' },
    }).catch(e => this.logger.warn(`Sales paid-notification failed for ${salesUserId}: ${e.message}`));
  }

  /**
   * Approve a batch of sales commissions, credit the agent's wallet, and
   * notify them. Mirrors approvePayout() for vendors.
   */
  async approveSalesPayout(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) return { batchId: null, count: 0 };
    const batchId = `SBATCH-${Date.now()}`;
    await this.salesRepo.update({ id: In(ids) }, {
      status: CommissionStatus.APPROVED,
      payout_batch_id: batchId,
    });

    try {
      const rows = await this.salesRepo.find({ where: { payout_batch_id: batchId } });
      const byAgent = new Map<string, typeof rows>();
      for (const r of rows) {
        const list = byAgent.get(r.sales_user_id) || [];
        list.push(r);
        byAgent.set(r.sales_user_id, list);
      }
      for (const [agentId, agentRows] of byAgent) {
        const total = agentRows.reduce((s, r) => s + Number(r.commission_amount), 0);
        try {
          await this.walletService.credit(
            agentId,
            total,
            'sales_commission_payout',
            batchId,
            `Sales commission ${batchId} (${agentRows.length} orders)`,
          );
        } catch (e: any) {
          this.logger.error(`Sales wallet credit failed for ${agentId} batch ${batchId}: ${e.message}`);
        }
        // In-app notification — sales agent sees "🎉 ₮X commission earned"
        this.notificationService.create({
          user_id: agentId,
          type: 'wallet',
          title: '💰 Борлуулалтын шагнал орлоо',
          message: `${agentRows.length} захиалгын тооцоогоор ${total.toLocaleString()}₮ хэтэвчинд орлоо.`,
          data: { batch_id: batchId, total, count: agentRows.length },
        }).catch(e => this.logger.warn(`Sales notification failed for ${agentId}: ${e.message}`));
      }
    } catch (e: any) {
      this.logger.error(`approveSalesPayout post-processing failed for batch ${batchId}: ${e.message}`);
    }

    return { batchId, count: ids.length };
  }

  /**
   * Cron-friendly: auto-approve sales commissions whose order has been
   * DELIVERED for ≥ holdHours (mirrors vendor escrow).
   */
  async autoApproveDelayedSalesCommissions(holdHours = 48) {
    const cutoff = new Date(Date.now() - holdHours * 60 * 60 * 1000);
    const eligible = await this.salesRepo.createQueryBuilder('s')
      .innerJoin('orders', 'o', 'o.id = s.order_id')
      .where('s.status = :status', { status: CommissionStatus.PENDING })
      .andWhere('LOWER(o.status) = :delivered', { delivered: 'delivered' })
      .andWhere('o.delivered_at IS NOT NULL')
      .andWhere('o.delivered_at < :cutoff', { cutoff })
      .select(['s.id'])
      .getMany();

    if (!eligible.length) return { count: 0, batchId: null };
    const ids = eligible.map(e => e.id);
    this.logger.log(`Sales escrow released for ${ids.length} commission(s) past ${holdHours}h hold`);
    return this.approveSalesPayout(ids);
  }

  /** List of sales commissions for a given agent (their dashboard). */
  findSalesByAgent(agentId: string) {
    return this.salesRepo.find({ where: { sales_user_id: agentId }, order: { created_at: 'DESC' } });
  }

  /** Summary stats for a given agent. */
  async getSalesSummary(agentId: string) {
    const rows = await this.salesRepo.find({ where: { sales_user_id: agentId } });
    const totalOrders = rows.length;
    const pendingAmount = rows
      .filter(r => r.status === CommissionStatus.PENDING)
      .reduce((s, r) => s + Number(r.commission_amount), 0);
    const paidAmount = rows
      .filter(r => r.status === CommissionStatus.APPROVED || r.status === CommissionStatus.PAID)
      .reduce((s, r) => s + Number(r.commission_amount), 0);
    const totalRevenue = rows.reduce((s, r) => s + Number(r.order_total), 0);
    return { totalOrders, pendingAmount, paidAmount, totalRevenue };
  }

  /** Top-10 sales agents leaderboard by total commission earned. */
  async getSalesLeaderboard(limit = 10) {
    const rows = await this.salesRepo
      .createQueryBuilder('s')
      .select([
        's.sales_user_id as "salesUserId"',
        'COUNT(*) as "orderCount"',
        'SUM(s.commission_amount) as "totalCommission"',
        'SUM(s.order_total) as "totalRevenue"',
      ])
      .groupBy('s.sales_user_id')
      .orderBy('"totalCommission"', 'DESC')
      .limit(limit)
      .getRawMany();
    return rows.map((r, i) => ({
      rank: i + 1,
      salesUserId: r.salesUserId,
      orderCount: Number(r.orderCount || 0),
      totalCommission: Number(r.totalCommission || 0),
      totalRevenue: Number(r.totalRevenue || 0),
    }));
  }

  /* ═══════════════════════════════════════════════════════════════════
     DESIGNER ROYALTY — payout to the template designer whose asset was
     used on an order. Scans order_items.specs for template_id and creates
     one PENDING row per (order, designer).
     ═══════════════════════════════════════════════════════════════════ */

  async createDesignerRoyaltiesForOrder(orderId: string) {
    if (!orderId) return;
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) return;

    // Collect template ids referenced by this order's items. Templates can
    // live in OrderItem.specs.template_id (our canonical path) or the
    // legacy Order.options.template_id (fallback).
    const items = await this.orderItemRepo.find({ where: { order_id: orderId } });
    const templateIds = new Set<string>();
    for (const it of items) {
      const tid = (it as any).specs?.template_id;
      if (tid) templateIds.add(tid);
    }
    const legacyTid = (order as any).options?.template_id;
    if (legacyTid) templateIds.add(legacyTid);

    if (!templateIds.size) return;

    for (const tid of templateIds) {
      const tpl = await this.templateRepo.findOne({ where: { id: tid } }).catch(() => null);
      if (!tpl || !tpl.designer_id) continue;
      const existing = await this.royaltyRepo.findOne({
        where: { order_id: orderId, designer_user_id: tpl.designer_id, template_id: tid },
      });
      if (existing) continue;

      const rate = tpl.royalty_rate != null ? Number(tpl.royalty_rate) : 5;
      const orderTotal = Number(order.total_price) || 0;
      const royalty = Math.round((orderTotal * rate) / 100);

      await this.royaltyRepo.save(this.royaltyRepo.create({
        order_id: orderId,
        designer_user_id: tpl.designer_id,
        template_id: tid,
        template_name: tpl.title_mn || tpl.title,
        order_total: orderTotal,
        royalty_rate: rate,
        royalty_amount: royalty,
        status: CommissionStatus.PENDING,
      }));

      this.notificationService.create({
        user_id: tpl.designer_id,
        type: 'order',
        title: '🎨 Загвар ашиглалт — royalty',
        message: `"${tpl.title_mn || tpl.title}" загвар ашигласан захиалгаас ~${royalty.toLocaleString()}₮ хүлээгдэж байна.`,
        data: { order_id: orderId, template_id: tid, royalty_amount: royalty },
      }).catch(() => {});
    }
  }

  async approveDesignerPayout(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) return { batchId: null, count: 0 };
    const batchId = `DBATCH-${Date.now()}`;
    await this.royaltyRepo.update({ id: In(ids) }, { status: CommissionStatus.APPROVED, payout_batch_id: batchId });

    const rows = await this.royaltyRepo.find({ where: { payout_batch_id: batchId } });
    const byDesigner = new Map<string, typeof rows>();
    for (const r of rows) {
      const list = byDesigner.get(r.designer_user_id) || [];
      list.push(r); byDesigner.set(r.designer_user_id, list);
    }
    for (const [designerId, drows] of byDesigner) {
      const total = drows.reduce((s, r) => s + Number(r.royalty_amount), 0);
      try {
        await this.walletService.credit(designerId, total, 'designer_royalty', batchId,
          `Template royalty ${batchId} (${drows.length} orders)`);
      } catch (e: any) {
        this.logger.error(`Designer wallet credit failed for ${designerId}: ${e.message}`);
      }
      this.notificationService.create({
        user_id: designerId,
        type: 'wallet',
        title: '💰 Designer royalty орлоо',
        message: `${drows.length} захиалгын тооцоогоор ${total.toLocaleString()}₮ хэтэвчинд орлоо.`,
        data: { batch_id: batchId, total, count: drows.length },
      }).catch(() => {});
    }
    return { batchId, count: ids.length };
  }

  async autoApproveDelayedDesignerRoyalties(holdHours = 48) {
    const cutoff = new Date(Date.now() - holdHours * 60 * 60 * 1000);
    const eligible = await this.royaltyRepo.createQueryBuilder('d')
      .innerJoin('orders', 'o', 'o.id = d.order_id::uuid')
      .where('d.status = :status', { status: CommissionStatus.PENDING })
      .andWhere('LOWER(o.status) = :delivered', { delivered: 'delivered' })
      .andWhere('o.delivered_at IS NOT NULL')
      .andWhere('o.delivered_at < :cutoff', { cutoff })
      .select(['d.id'])
      .getMany();
    if (!eligible.length) return { count: 0, batchId: null };
    return this.approveDesignerPayout(eligible.map(e => e.id));
  }

  findRoyaltiesByDesigner(designerId: string) {
    return this.royaltyRepo.find({ where: { designer_user_id: designerId }, order: { created_at: 'DESC' } });
  }

  async getDesignerSummary(designerId: string) {
    const rows = await this.royaltyRepo.find({ where: { designer_user_id: designerId } });
    const pendingAmount = rows.filter(r => r.status === CommissionStatus.PENDING)
      .reduce((s, r) => s + Number(r.royalty_amount), 0);
    const paidAmount = rows.filter(r => r.status === CommissionStatus.APPROVED || r.status === CommissionStatus.PAID)
      .reduce((s, r) => s + Number(r.royalty_amount), 0);
    return { totalOrders: rows.length, pendingAmount, paidAmount };
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
