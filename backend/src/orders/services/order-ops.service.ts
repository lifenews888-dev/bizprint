import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, IsNull, Not } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderStatusLog } from '../entities/order-status-log.entity';
import { OrderVendorGroup } from '../entities/order-vendor-group.entity';
import { OrdersService } from '../order.service';

/* ═══════════════════════════════════════
 *  Order Operations Service
 *  KPI, Alerts, Bulk Actions, SLA Tracking
 * ═══════════════════════════════════════ */

@Injectable()
export class OrderOpsService {
  private readonly logger = new Logger(OrderOpsService.name);

  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderStatusLog) private logRepo: Repository<OrderStatusLog>,
    @InjectRepository(OrderVendorGroup) private vendorGroupRepo: Repository<OrderVendorGroup>,
    private ordersService: OrdersService,
  ) {}

  /* ═══════════════════════════════════════
   *  KPI SUMMARY
   * ═══════════════════════════════════════ */

  async getKpiSummary() {
    const orders = await this.orderRepo.find();

    const total = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total_price || 0), 0);

    // Status counts
    const statusCounts: Record<string, { count: number; value: number }> = {};
    for (const o of orders) {
      if (!statusCounts[o.status]) statusCounts[o.status] = { count: 0, value: 0 };
      statusCounts[o.status].count++;
      statusCounts[o.status].value += Number(o.total_price || 0);
    }

    // Active = not completed/cancelled
    const ACTIVE_STATUSES = [
      OrderStatus.DRAFT, OrderStatus.QUOTATION_SENT, OrderStatus.CONFIRMED,
      OrderStatus.PENDING_FILE, OrderStatus.FILE_REVIEW, OrderStatus.FILE_REJECTED,
      OrderStatus.ON_HOLD, OrderStatus.IN_PRODUCTION, OrderStatus.FINISHING,
      OrderStatus.PARTIALLY_DISPATCHED,
    ];
    const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status as OrderStatus));
    const activeValue = activeOrders.reduce((s, o) => s + Number(o.total_price || 0), 0);

    // Pending = needs action
    const PENDING_STATUSES = [OrderStatus.DRAFT, OrderStatus.QUOTATION_SENT, OrderStatus.CONFIRMED, OrderStatus.PENDING_FILE];
    const pendingOrders = orders.filter(o => PENDING_STATUSES.includes(o.status as OrderStatus));
    const pendingValue = pendingOrders.reduce((s, o) => s + Number(o.total_price || 0), 0);

    // In production
    const PRODUCTION_STATUSES = [OrderStatus.IN_PRODUCTION, OrderStatus.FINISHING];
    const productionOrders = orders.filter(o => PRODUCTION_STATUSES.includes(o.status as OrderStatus));
    const productionValue = productionOrders.reduce((s, o) => s + Number(o.total_price || 0), 0);

    // Completed
    const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.DELIVERED);
    const completedValue = completedOrders.reduce((s, o) => s + Number(o.total_price || 0), 0);

    // Delayed
    const delayedOrders = orders.filter(o => o.is_delayed);

    // Today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => new Date(o.created_at) >= today);

    // Urgent orders
    const urgentOrders = orders.filter(o => o.priority === 'urgent' && !['completed', 'cancelled', 'delivered'].includes(o.status));

    return {
      total_orders: total,
      total_revenue: Math.round(totalRevenue),

      active: { count: activeOrders.length, value: Math.round(activeValue) },
      pending: { count: pendingOrders.length, value: Math.round(pendingValue) },
      production: { count: productionOrders.length, value: Math.round(productionValue) },
      completed: { count: completedOrders.length, value: Math.round(completedValue) },
      delayed: { count: delayedOrders.length },
      today: { count: todayOrders.length },
      urgent: { count: urgentOrders.length },

      by_status: statusCounts,
    };
  }

  /* ═══════════════════════════════════════
   *  ALERTS SYSTEM
   * ═══════════════════════════════════════ */

  async getAlerts() {
    const now = new Date();

    // 1. Delayed orders (deadline < now, not completed/cancelled)
    const TERMINAL = [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.DELIVERED];
    const allActive = await this.orderRepo.find({
      where: { status: Not(In(TERMINAL)) },
    });

    const delayed = allActive.filter(o => o.deadline && new Date(o.deadline) < now);

    // 2. No vendor assigned (confirmed+ but no vendor)
    const needsVendor = allActive.filter(o => {
      const afterConfirm = [OrderStatus.CONFIRMED, OrderStatus.IN_PRODUCTION, OrderStatus.FINISHING].includes(o.status as OrderStatus);
      return afterConfirm && !o.factory_id;
    });

    // 3. Urgent orders
    const urgent = allActive.filter(o => o.priority === 'urgent');

    // 4. SLA violations (>2 days in same status)
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const stale = allActive.filter(o => new Date(o.updated_at) < twoDaysAgo);

    // 5. File pending too long (>24h in pending_file)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const filePending = allActive.filter(o =>
      o.status === OrderStatus.PENDING_FILE && new Date(o.updated_at) < oneDayAgo
    );

    return {
      delayed: { count: delayed.length, orders: delayed.map(o => ({ id: o.id, product: o.product_name, deadline: o.deadline })) },
      no_vendor: { count: needsVendor.length, orders: needsVendor.map(o => ({ id: o.id, product: o.product_name })) },
      urgent: { count: urgent.length, orders: urgent.map(o => ({ id: o.id, product: o.product_name, priority: o.priority })) },
      stale: { count: stale.length, orders: stale.map(o => ({ id: o.id, product: o.product_name, status: o.status, updated: o.updated_at })) },
      file_pending: { count: filePending.length, orders: filePending.map(o => ({ id: o.id, product: o.product_name })) },
      total_alerts: delayed.length + needsVendor.length + urgent.length + stale.length + filePending.length,
    };
  }

  /* ═══════════════════════════════════════
   *  SLA CHECK — mark delayed orders
   * ═══════════════════════════════════════ */

  async checkSla() {
    const now = new Date();
    const TERMINAL = [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.DELIVERED];

    const activeOrders = await this.orderRepo.find({
      where: { status: Not(In(TERMINAL)) },
    });

    let updated = 0;
    for (const order of activeOrders) {
      const shouldBeDelayed = order.deadline && new Date(order.deadline) < now;
      if (shouldBeDelayed && !order.is_delayed) {
        await this.orderRepo.update(order.id, { is_delayed: true });
        updated++;
      } else if (!shouldBeDelayed && order.is_delayed) {
        await this.orderRepo.update(order.id, { is_delayed: false });
        updated++;
      }
    }

    return { checked: activeOrders.length, updated };
  }

  /* ═══════════════════════════════════════
   *  STATUS LOG — record every transition
   * ═══════════════════════════════════════ */

  async logTransition(orderId: string, fromStatus: string, toStatus: string, changedBy?: string, reason?: string) {
    return this.logRepo.save(this.logRepo.create({
      order_id: orderId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: changedBy,
      reason,
    }));
  }

  async getStatusLogs(orderId: string) {
    return this.logRepo.find({
      where: { order_id: orderId },
      order: { created_at: 'ASC' },
    });
  }

  /* ═══════════════════════════════════════
   *  BULK ACTIONS
   * ═══════════════════════════════════════ */

  async bulkUpdateStatus(orderIds: string[], status: string, changedBy?: string) {
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const id of orderIds) {
      try {
        const order = await this.ordersService.getOrderById(id);
        const fromStatus = order.status;
        await this.ordersService.updateStatus(id, status);
        await this.logTransition(id, fromStatus, status, changedBy, 'Bulk action');
        results.push({ id, success: true });
      } catch (e: any) {
        results.push({ id, success: false, error: e.message });
      }
    }

    return {
      total: orderIds.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results,
    };
  }

  async bulkAssignVendor(orderIds: string[], vendorId: string) {
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const id of orderIds) {
      try {
        await this.ordersService.reassignVendor(id, vendorId);
        results.push({ id, success: true });
      } catch (e: any) {
        results.push({ id, success: false, error: e.message });
      }
    }

    return {
      total: orderIds.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results,
    };
  }

  async bulkSetPriority(orderIds: string[], priority: string) {
    await this.orderRepo.update(orderIds.map(id => id) as any, { priority });
    // TypeORM doesn't support IN with update easily, so do individually
    for (const id of orderIds) {
      await this.orderRepo.update(id, { priority });
    }
    return { updated: orderIds.length, priority };
  }

  async bulkCancel(orderIds: string[]) {
    const results: { id: string; success: boolean; error?: string }[] = [];
    for (const id of orderIds) {
      try {
        await this.ordersService.cancelOrder(id);
        results.push({ id, success: true });
      } catch (e: any) {
        results.push({ id, success: false, error: e.message });
      }
    }
    return {
      total: orderIds.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results,
    };
  }

  /* ═══════════════════════════════════════
   *  ORDER TIMELINE
   * ═══════════════════════════════════════ */

  async getTimeline(orderId: string) {
    const logs = await this.logRepo.find({
      where: { order_id: orderId },
      order: { created_at: 'ASC' },
    });

    const order = await this.ordersService.getOrderById(orderId);

    // Build timeline with standard stages
    const STAGE_LABELS: Record<string, string> = {
      draft: 'Захиалга үүссэн',
      quotation_sent: 'Үнийн санал илгээсэн',
      confirmed: 'Баталгаажсан',
      pending_file: 'Файл хүлээж байна',
      file_review: 'Файл шалгаж байна',
      file_rejected: 'Файл буцаагдсан',
      on_hold: 'Түр зогссон',
      in_production: 'Үйлдвэрлэлд',
      finishing: 'Боловсруулалт',
      partially_dispatched: 'Хэсэгчлэн илгээсэн',
      dispatched: 'Илгээсэн',
      delivered: 'Хүргэсэн',
      completed: 'Дууссан',
      cancelled: 'Цуцалсан',
    };

    const timeline = [
      { status: 'draft', label: STAGE_LABELS.draft, date: order.created_at, completed: true },
    ];

    for (const log of logs) {
      timeline.push({
        status: log.to_status,
        label: STAGE_LABELS[log.to_status] || log.to_status,
        date: log.created_at,
        completed: true,
      });
    }

    return { order_id: orderId, current_status: order.status, timeline };
  }
}
