import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderVendorGroup } from './entities/order-vendor-group.entity';
import { AuditTrail } from '../audit-trail/audit-trail.entity';
import { MailService } from '../mail/mail.service';
import { OrdersGateway } from './orders.gateway';
import { NotificationService } from '../notifications/notification.service';
import { EventBusService } from '../events/event-bus.service';
import { BizEvent } from '../events/event-types';
import { AssignmentEngineService } from '../vendors/services/assignment-engine.service';
import { VendorTierService } from '../vendors/services/vendor-tier.service';
import { ProductionGateService } from '../files/production-gate.service';
import { ZoomService } from '../design-requests/zoom.service';

// Canonical order state progression (matches OrderStatus enum exactly)
// Production sub-stages (designing, printing, qc, etc.) belong in production_stages table
const WORKFLOW_STAGES = [
  OrderStatus.DRAFT,
  OrderStatus.QUOTATION_SENT,
  OrderStatus.CONFIRMED,
  OrderStatus.PENDING_FILE,
  OrderStatus.FILE_REVIEW,
  OrderStatus.FILE_REJECTED,
  OrderStatus.ON_HOLD,
  OrderStatus.IN_PRODUCTION,
  OrderStatus.FINISHING,
  OrderStatus.PARTIALLY_DISPATCHED,
  OrderStatus.DISPATCHED,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
];

// Subset of transitions a vendor (factory operator) is allowed to perform
// on orders assigned to them. Anything else requires admin. Mirrors the
// buttons rendered in /dashboard/vendor/orders.
const VENDOR_ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
  [OrderStatus.CONFIRMED]:     [OrderStatus.IN_PRODUCTION],
  [OrderStatus.FILE_REVIEW]:   [OrderStatus.CONFIRMED, OrderStatus.FILE_REJECTED],
  [OrderStatus.IN_PRODUCTION]: [OrderStatus.FINISHING],
  [OrderStatus.FINISHING]:     [OrderStatus.DISPATCHED, OrderStatus.PARTIALLY_DISPATCHED],
  [OrderStatus.PARTIALLY_DISPATCHED]: [OrderStatus.DISPATCHED],
};

// Valid state transitions â defines which states each state can move to
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]:                 [OrderStatus.QUOTATION_SENT, OrderStatus.CANCELLED],
  [OrderStatus.QUOTATION_SENT]:        [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]:             [OrderStatus.PENDING_FILE, OrderStatus.IN_PRODUCTION, OrderStatus.CANCELLED],
  [OrderStatus.PENDING_FILE]:          [OrderStatus.FILE_REVIEW, OrderStatus.CANCELLED],
  [OrderStatus.FILE_REVIEW]:           [OrderStatus.CONFIRMED, OrderStatus.FILE_REJECTED],
  [OrderStatus.FILE_REJECTED]:         [OrderStatus.PENDING_FILE, OrderStatus.CANCELLED],
  [OrderStatus.ON_HOLD]:               [], // resolved dynamically â can return to any state that led to ON_HOLD
  [OrderStatus.IN_PRODUCTION]:         [OrderStatus.FINISHING, OrderStatus.ON_HOLD, OrderStatus.CANCELLED],
  [OrderStatus.FINISHING]:             [OrderStatus.PARTIALLY_DISPATCHED, OrderStatus.DISPATCHED],
  [OrderStatus.PARTIALLY_DISPATCHED]:  [OrderStatus.DISPATCHED],
  [OrderStatus.DISPATCHED]:            [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]:             [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]:             [], // terminal
  [OrderStatus.CANCELLED]:             [], // terminal
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(OrderVendorGroup)
    private vendorGroupRepo: Repository<OrderVendorGroup>,
    @InjectRepository(AuditTrail)
    private auditRepo: Repository<AuditTrail>,
    private mailService: MailService,
    private ordersGateway: OrdersGateway,
    private notificationService: NotificationService,
    private readonly eventBus: EventBusService,
    private readonly assignmentEngine: AssignmentEngineService,
    private readonly vendorTier: VendorTierService,
    private readonly productionGate: ProductionGateService,
    private readonly zoomService: ZoomService,
  ) {}

  async createOrder(data: any) {
    // Separate items from order data
    const { items, ...orderData } = data;
    const order = this.ordersRepo.create({ ...orderData, status: OrderStatus.DRAFT });
    const saved: Order = await this.ordersRepo.save(order as any);

    // Save order items from cart
    if (Array.isArray(items) && items.length > 0) {
      const orderItems = items.map((item: any) =>
        this.orderItemRepo.create({
          order_id: saved.id,
          product_id: item.product_id || null,
          quantity: item.quantity || 1,
          unit_price: Number(item.unit_price) || 0,
          total_price: Number(item.total_price) || 0,
          specs: { product_name: item.product_name, image: item.image },
        }),
      );
      await this.orderItemRepo.save(orderItems);
    }

    if (data.customer_email) {
      try {
        await this.mailService.sendOrderConfirmation({
          to: data.customer_email,
          name: data.customer_name || 'Ð¥ÑÑÑÐ³Ð»ÑÐ³Ñ',
          orderId: saved.id,
          productName: data.product_name || 'ÐÒ¯ÑÑÑÐ³Ð´ÑÑÒ¯Ò¯Ð½',
          quantity: saved.quantity,
          total: saved.total_price,
          invoiceCode: data.invoice_code || '',
        });
      } catch (e) {
        console.log('Email error:', e.message);
      }
    }
    // Emit ORDER_CREATED for real-time broadcast
    this.eventBus.emit(BizEvent.ORDER_CREATED, {
      orderId: saved.id,
      userId: data.user_id || data.customer_id,
      vendorId: data.vendor_id,
      status: saved.status,
    });

    // Notify all admins about new order
    try {
      const adminUsers = await this.ordersRepo.manager.connection.getRepository('User').find({ where: { role: 'admin', is_active: true }, select: ['id'] });
      for (const admin of adminUsers) {
        await this.notificationService.create({
          user_id: (admin as any).id,
          type: 'ORDER' as any,
          title: 'Ð¨Ð¸Ð½Ñ Ð·Ð°ÑÐ¸Ð°Ð»Ð³Ð°',
          message: `${data.customer_name || 'Ð¥ÑÑÑÐ³Ð»ÑÐ³Ñ'} â ${data.product_name || 'ÐÒ¯ÑÑÑÐ³Ð´ÑÑÒ¯Ò¯Ð½'} Ã ${saved.quantity}Ñ`,
          data: { order_id: saved.id },
        });
      }
    } catch {}

    // Auto-create digital card + trial QR for business card orders
    if (data.customer_id && data.options?.product_type === 'business_card') {
      try {
        this.eventBus.emit('BUSINESS_CARD_ORDERED' as any, {
          userId: data.customer_id,
          orderId: saved.id,
          orderData: data.options || data,
        });
      } catch (e) {
        console.log('Digital card auto-create note:', e?.message);
      }
    }

    return saved;
  }

  async createFromQuote(quoteId: string, userId: string, paymentMethod?: string) {
    const quoteRepo = this.ordersRepo.manager.connection.getRepository('Quotation');
    const quote = await quoteRepo.findOne({ where: { id: quoteId } });
    if (!quote) throw new NotFoundException('Quote Ð¾Ð»Ð´ÑÐ¾Ð½Ð³Ò¯Ð¹');

    const order = this.ordersRepo.create({
      customer_id: userId,
      quote_id: quoteId,
      quote_number: (quote as any).quote_number,
      customer_name: (quote as any).customer_name,
      customer_phone: (quote as any).customer_phone,
      customer_email: (quote as any).customer_email,
      product_name: (quote as any).product_name,
      quantity: (quote as any).quantity,
      unit_price: (quote as any).unit_price,
      total_price: (quote as any).total_price,
      paper_gsm: (quote as any).paper_gsm,
      color_mode: (quote as any).color_mode,
      sides: (quote as any).sides,
      finishing: (quote as any).finishing,
      payment_method: paymentMethod || 'pending',
      payment_status: 'pending',
      status: OrderStatus.DRAFT,
      notes: `Quote ${(quote as any).quote_number}-Ð°Ð°Ñ Ò¯Ò¯ÑÐ³ÑÐ³Ð´ÑÑÐ½`,
    });
    const saved: Order = await this.ordersRepo.save(order as any);

    await quoteRepo.update(quoteId, { status: 'ordered' });

    if ((quote as any).customer_email) {
      try {
        await this.mailService.sendOrderConfirmation({
          to: (quote as any).customer_email,
          name: (quote as any).customer_name || 'Ð¥ÑÑÑÐ³Ð»ÑÐ³Ñ',
          orderId: saved.id,
          productName: (quote as any).product_name || 'Ð¥ÑÐ²Ð»ÑÐ»',
          quantity: (quote as any).quantity,
          total: (quote as any).total_price,
          invoiceCode: saved.id.slice(0, 8).toUpperCase(),
        });
      } catch (e) {
        console.log('Email error:', e.message);
      }
    }
    return saved;
  }

  async updateStatus(id: string, status: string) {
    const order = await this.getOrderById(id);
    this.validateTransition(order.status, status);
    await this.ordersRepo.update(id, { status });

    // Real-time notification via Socket.IO
    this.ordersGateway.notifyStatusChange(id, status, {});

    // Push notification for key statuses
    const customerId = (order as any).customer_id || (order as any).user_id;
    if (customerId) {
      const statusMessages: Record<string, string> = {
        [OrderStatus.CONFIRMED]:            'Ð¢Ð°Ð½Ñ Ð·Ð°ÑÐ¸Ð°Ð»Ð³Ð° Ð±Ð°ÑÐ°Ð»Ð³Ð°Ð°Ð¶Ð»Ð°Ð° â',
        [OrderStatus.PENDING_FILE]:         'Ð¥ÑÐ²Ð»ÑÑ ÑÐ°Ð¹Ð»Ð°Ð° Ð¾ÑÑÑÐ»Ð½Ð° ÑÑ ð',
        [OrderStatus.FILE_REVIEW]:          'Ð¤Ð°Ð¹Ð» ÑÒ¯Ð»ÑÑÐ½ Ð°Ð²Ð»Ð°Ð°, ÑÐ°Ð»Ð³Ð°Ð¶ Ð±Ð°Ð¹Ð½Ð° ð',
        [OrderStatus.FILE_REJECTED]:        'Ð¤Ð°Ð¹Ð» Ð±ÑÑÐ°Ð°Ð³Ð´Ð»Ð°Ð°. ÐÐ°ÑÐ°Ð°Ð´ Ð´Ð°ÑÐ¸Ð½ Ð¾ÑÑÑÐ»Ð½Ð° ÑÑ â',
        [OrderStatus.IN_PRODUCTION]:        'ÐÐ°ÑÐ¸Ð°Ð»Ð³Ð° Ò¯Ð¹Ð»Ð´Ð²ÑÑÐ»ÑÐ»Ð´ Ð¾ÑÐ»Ð¾Ð¾ ð­',
        [OrderStatus.FINISHING]:            'ÐÐ°ÑÐ¸Ð°Ð»Ð³Ð° Ð±Ð¾Ð»Ð¾Ð²ÑÑÑÑÐ»Ð°Ð»ÑÐ°Ð´ Ð¾ÑÐ»Ð¾Ð¾ ð§',
        [OrderStatus.DISPATCHED]:           'Ð¢Ð°Ð½Ñ Ð·Ð°ÑÐ¸Ð°Ð»Ð³Ð° Ð¸Ð»Ð³ÑÑÐ³Ð´Ð»ÑÑ ð¦',
        [OrderStatus.DELIVERED]:            'ÐÐ°ÑÐ¸Ð°Ð»Ð³Ð° ÑÒ¯ÑÐ³ÑÐ³Ð´Ð»ÑÑ. Ò®Ð½ÑÐ»Ð³ÑÑ Ó©Ð³Ð½Ó© Ò¯Ò¯ â­',
        [OrderStatus.COMPLETED]:            'ÐÐ°ÑÐ¸Ð°Ð»Ð³Ð° Ð°Ð¼Ð¶Ð¸Ð»ÑÑÐ°Ð¹ Ð´ÑÑÑÐ»Ð°Ð° â',
      };
      if (statusMessages[status]) {
        try {
          await this.notificationService.create({
            user_id: customerId,
            type: 'ORDER' as any,
            title: 'ÐÐ°ÑÐ¸Ð°Ð»Ð³ÑÐ½ Ð¼ÑÐ´ÑÐ³Ð´ÑÐ»',
            message: statusMessages[status],
            data: { order_id: id, status },
          });
        } catch {}
      }
    }

    // Send file-related emails
    const email = (order as any).customer_email;
    const customerName = (order as any).customer_name || 'Ð¥ÑÑÑÐ³Ð»ÑÐ³Ñ';
    const productName = (order as any).product_name || 'Ð¥ÑÐ²Ð»ÑÐ»';

    if (email) {
      try {
        if (status === OrderStatus.PENDING_FILE) {
          await this.mailService.sendFileRequestNotice({
            to: email, name: customerName,
            orderId: id, productName,
          });
        } else if (status === OrderStatus.FILE_REJECTED) {
          await this.mailService.sendFileRejectionNotice({
            to: email, name: customerName,
            orderId: id, productName,
          });
        } else if (status === OrderStatus.DISPATCHED) {
          await this.mailService.sendDeliveryStarted({
            to: email,
            customerName,
            productName,
            courierName: (order as any).courier_name || 'Ð¥Ò¯ÑÐ³ÑÐ»ÑÐ¸Ð¹Ð½ Ð°Ð¶Ð¸Ð»ÑÐ°Ð½',
            courierPhone: (order as any).courier_phone || '',
            address: (order as any).shipping_address || (order as any).delivery_address || '',
          });
        } else if (status === OrderStatus.DELIVERED) {
          await this.mailService.sendDeliveryCompleted({
            to: email,
            customerName,
            productName,
          });
        }
      } catch (e: any) {
        this.logger.warn('Status email error: ' + e.message);
      }
    }

    // âââ PRODUCTION GATE â validate file before production âââ
    if (status === OrderStatus.IN_PRODUCTION) {
      try {
        const gate = await this.productionGate.isProductionReady(id);
        if (!gate.ready) {
          this.logger.warn(`Production gate failed for order ${id}: ${gate.reason}`);
          // Don't block â log warning, admin can override
        }
      } catch (e) {
        this.logger.warn(`Production gate check error: ${e.message}`);
      }
    }

    // âââ AUTO-ASSIGN VENDOR when order is CONFIRMED âââ
    if (status === OrderStatus.CONFIRMED && (order as any).product_id) {
      await this.autoAssignVendor(order as any);
    }

    // Always broadcast the transition. Listeners include:
    //   - DeliveryService â auto-create Delivery + assign courier on DISPATCHED
    //   - Frontend dashboards subscribed to order:{id}, user:{customerId},
    //     vendor:{vendorId} rooms (live status updates)
    this.eventBus.emit(BizEvent.ORDER_STATUS_UPDATED, {
      orderId: id,
      status,
      previousStatus: order.status,
      userId: customerId,
      vendorId: (order as any).factory_id || undefined,
      data: { product_name: (order as any).product_name },
    });

    return order;
  }

  async updateOrder(id: string, data: any, actor?: { id?: string; role?: string }) {
    const update: any = {};
    if (data.status) {
      const order = await this.getOrderById(id);
      this.validateTransition(order.status, data.status);

      // Vendor RBAC: a vendor can only advance their own assigned orders
      // through the production-floor transitions. Admin/superadmin bypass.
      if (actor && actor.role && !['admin', 'superadmin'].includes(actor.role)) {
        if (actor.role === 'vendor' || actor.role === 'factory') {
          await this.assertVendorOwnsOrder(actor.id!, order);
          const allowed = VENDOR_ALLOWED_TRANSITIONS[order.status as OrderStatus] || [];
          if (!allowed.includes(data.status as OrderStatus)) {
            throw new BadRequestException(
              `Ò®Ð¹Ð»Ð´Ð²ÑÑ ${order.status} ÑÑÐ°ÑÑÑÐ°Ð°Ñ ${data.status} ÑÑÐ°ÑÑÑ ÑÑÑ ÑÐ¸Ð»Ð¶Ò¯Ò¯Ð»ÑÑ ÑÑÑÐ³Ò¯Ð¹`,
            );
          }
        } else {
          throw new BadRequestException('Ð¢Ð° ÑÐ½Ñ Ð·Ð°ÑÐ¸Ð°Ð»Ð³ÑÐ½ ÑÑÐ°ÑÑÑÑÐ³ Ó©Ó©ÑÑÐ»Ó©Ñ ÑÑÑÐ³Ò¯Ð¹');
        }
      }
      update.status = data.status;
    }
    if (data.assigned_to !== undefined) update.assigned_to = data.assigned_to;
    if (data.deadline !== undefined) update.deadline = data.deadline;
    await this.ordersRepo.update(id, update);

    // Trigger the same downstream side-effects updateStatus does (notification,
    // emails, vendor auto-assign). Skipping these meant vendors clicking
    // "ÐÐ¾Ð»Ð¾Ð²ÑÑÑÑÐ»Ð°Ð»ÑÐ°Ð´ Ð¾ÑÑÑÐ»Ð°Ñ" left the customer with no notification.
    if (data.status) {
      await this.updateStatus(id, data.status as OrderStatus).catch(e =>
        this.logger.warn(`updateStatus side-effects failed for ${id}: ${e.message}`),
      );
    }

    return this.getOrderById(id);
  }

  /**
   * Throws if the caller (a vendor user) is not assigned to the given order.
   * Resolves the vendor record from user_id â vendors.id and compares to
   * order.factory_id (legacy column) and any OrderVendorGroup rows.
   */
  private async assertVendorOwnsOrder(vendorUserId: string, order: Order) {
    const vendorRow = await this.ordersRepo.manager
      .createQueryBuilder()
      .select('v.id', 'id')
      .from('vendors', 'v')
      .where('v.user_id = :uid', { uid: vendorUserId })
      .getRawOne();
    const vendorId = vendorRow?.id;
    if (!vendorId) {
      throw new BadRequestException('Vendor Ð±Ò¯ÑÑÐ³ÑÐ» Ð¾Ð»Ð´ÑÐ¾Ð½Ð³Ò¯Ð¹');
    }

    if ((order as any).factory_id === vendorId) return;

    const group = await this.vendorGroupRepo.findOne({
      where: { order_id: order.id, vendor_id: vendorId },
    });
    if (!group) {
      throw new BadRequestException('Ð¢Ð° ÑÐ½Ñ Ð·Ð°ÑÐ¸Ð°Ð»Ð³Ð°Ð´ Ð¾Ð½Ð¾Ð¾Ð³Ð´Ð¾Ð¾Ð³Ò¯Ð¹');
    }
  }

  /**
   * QC fail Ð±ÑÑÐ°Ð°Ñ â Ð¾Ð´Ð¾Ð¾Ð³Ð¸Ð¹Ð½ stage-Ð°Ð°Ñ Ó©Ð¼Ð½Ó©Ñ stage ÑÑÑ Ð±ÑÑÐ°Ð°Ð½Ð°
   * @param id - Order ID
   * @param reason - ÐÑÑÐ°Ð°Ñ ÑÐ°Ð»ÑÐ³Ð°Ð°Ð½
   * @param targetStage - ÐÐ»Ñ stage ÑÑÑ Ð±ÑÑÐ°Ð°Ñ (optional, default = Ó©Ð¼Ð½Ó©Ñ stage)
   * @param user - Ð¥ÑÐ½ Ð±ÑÑÐ°Ð°ÑÐ°Ð½
   */
  async revertStatus(
    id: string,
    reason: string,
    user: string,
    targetStage?: string,
  ) {
    const order = await this.getOrderById(id);
    const currentStatus = order.status;

    // ÐÐ´Ð¾Ð¾Ð³Ð¸Ð¹Ð½ stage-Ð¸Ð¹Ð½ index Ð¾Ð»Ð¾Ñ
    const currentIndex = WORKFLOW_STAGES.indexOf(currentStatus as OrderStatus);

    // completed, delivered, shipped, cancelled, pending Ð±Ð¾Ð» Ð±ÑÑÐ°Ð°Ñ Ð±Ð¾Ð»Ð¾Ð¼Ð¶Ð³Ò¯Ð¹
    const NON_REVERTABLE = [OrderStatus.COMPLETED, OrderStatus.DELIVERED, OrderStatus.DISPATCHED, OrderStatus.CANCELLED];
    if (NON_REVERTABLE.includes(currentStatus as OrderStatus)) {
      throw new BadRequestException(
        `"${currentStatus}" ÑÓ©Ð»Ó©Ð²Ó©Ó©Ñ Ð±ÑÑÐ°Ð°Ñ Ð±Ð¾Ð»Ð¾Ð¼Ð¶Ð³Ò¯Ð¹`,
      );
    }
    if (currentIndex <= 0) {
      throw new BadRequestException(
        `"${currentStatus}" ÑÓ©Ð»Ó©Ð²Ó©Ó©Ñ Ð±ÑÑÐ°Ð°Ñ Ð±Ð¾Ð»Ð¾Ð¼Ð¶Ð³Ò¯Ð¹ (Ð°Ð½ÑÐ½Ñ ÑÓ©Ð»Ó©Ð²)`,
      );
    }

    let revertToIndex: number;

    if (targetStage) {
      // Ð¢Ð¾Ð´Ð¾ÑÑÐ¾Ð¹ stage ÑÑÑ Ð±ÑÑÐ°Ð°Ñ
      revertToIndex = WORKFLOW_STAGES.indexOf(targetStage as OrderStatus);
      if (revertToIndex < 0 || revertToIndex >= currentIndex) {
        throw new BadRequestException(
          `"${targetStage}" ÑÑÑ Ð±ÑÑÐ°Ð°Ñ Ð±Ð¾Ð»Ð¾Ð¼Ð¶Ð³Ò¯Ð¹ (Ð¾Ð´Ð¾Ð¾Ð³Ð¸Ð¹Ð½: ${currentStatus})`,
        );
      }
    } else {
      // Default: Ó©Ð¼Ð½Ó©Ñ stage ÑÑÑ
      revertToIndex = currentIndex - 1;
    }

    const revertTo = WORKFLOW_STAGES[revertToIndex];

    // Ð¡ÑÐ°ÑÑÑ ÑÐ¸Ð½ÑÑÐ»ÑÑ
    await this.ordersRepo.update(id, { status: revertTo });

    // Audit trail Ð±Ð¸ÑÐ¸Ñ
    const auditEntry = this.auditRepo.create({
      order_id: id,
      user: user,
      action: `ÐÐ£Ð¦ÐÐÐÐÐ¡ÐÐ: "${currentStatus}" â "${revertTo}" | Ð¨Ð°Ð»ÑÐ³Ð°Ð°Ð½: ${reason}`,
    });
    await this.auditRepo.save(auditEntry);

    return this.getOrderById(id);
  }

  async getOrders() {
    return this.ordersRepo.find({ order: { created_at: 'DESC' } });
  }

  async getOrdersByCustomer(customer_id: string) {
    return this.ordersRepo.find({
      where: { customer_id },
      relations: ['items'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * List orders assigned to a vendor (joined via vendor user_id â vendor.id â factory_id).
   * Used by the vendor production dashboard to show their queue.
   */
  async getOrdersByVendor(vendorUserId: string) {
    // Resolve vendor.id from user_id
    const vendorRow = await this.ordersRepo.manager
      .createQueryBuilder()
      .select('v.id', 'id')
      .from('vendors', 'v')
      .where('v.user_id = :uid', { uid: vendorUserId })
      .getRawOne();
    const vendorId = vendorRow?.id || vendorUserId;
    return this.ordersRepo.find({
      where: { factory_id: vendorId },
      relations: ['items'],
      order: { created_at: 'DESC' },
    });
  }

  async getOrderById(id: string) {
    const order = await this.ordersRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('ÐÐ°ÑÐ¸Ð°Ð»Ð³Ð° Ð¾Ð»Ð´ÑÐ¾Ð½Ð³Ò¯Ð¹');
    return order;
  }

  private validateTransition(currentStatus: string, newStatus: string) {
    const current = currentStatus as OrderStatus;
    const next = newStatus as OrderStatus;

    if (!Object.values(OrderStatus).includes(next)) {
      throw new BadRequestException(`"${newStatus}" Ð½Ñ Ð·Ó©Ð²ÑÓ©Ó©ÑÓ©Ð³Ð´ÑÓ©Ð½ ÑÓ©Ð»Ó©Ð² Ð±Ð¸Ñ`);
    }

    const allowed = VALID_TRANSITIONS[current];
    if (!allowed) {
      throw new BadRequestException(`"${currentStatus}" ÑÓ©Ð»Ó©Ð²Ó©Ó©Ñ ÑÐ¸Ð»Ð¶Ð¸Ñ Ð±Ð¾Ð»Ð¾Ð¼Ð¶Ð³Ò¯Ð¹`);
    }

    // ON_HOLD is resolved dynamically via revertStatus, not updateStatus
    if (current === OrderStatus.ON_HOLD) {
      throw new BadRequestException(
        `ON_HOLD ÑÓ©Ð»Ó©Ð²Ó©Ó©Ñ Ð³Ð°ÑÐ°ÑÑÐ½ ÑÑÐ»Ð´ revertStatus Ð°ÑÐ¸Ð³Ð»Ð°Ð½Ð° ÑÑ`,
      );
    }

    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `"${currentStatus}" â "${newStatus}" ÑÐ¸Ð»Ð¶Ð¸Ð»Ñ Ð·Ó©Ð²ÑÓ©Ó©ÑÓ©Ð³Ð´Ó©Ó©Ð³Ò¯Ð¹. ÐÓ©Ð²ÑÓ©Ó©ÑÓ©Ð³Ð´ÑÓ©Ð½: ${allowed.join(', ')}`,
      );
    }
  }

  async cancelOrder(id: string, reason?: string, actor?: { id?: string; role?: string }) {
    const order = await this.getOrderById(id);

    // Only the owning customer or an admin/superadmin may cancel. Vendors
    // get an explicit reject and can't unilaterally void a customer order.
    if (actor && actor.role) {
      const isAdmin = ['admin', 'superadmin'].includes(actor.role);
      const isOwner = (order as any).customer_id === actor.id;
      if (!isAdmin && !isOwner) {
        throw new BadRequestException('Ð¢Ð° ÑÐ½Ñ Ð·Ð°ÑÐ¸Ð°Ð»Ð³ÑÐ³ ÑÑÑÐ»Ð°Ñ ÑÑÑÐ³Ò¯Ð¹');
      }
    }

    const previousStatus = order.status as OrderStatus;
    const wasPaid = order.payment_status === 'paid';
    order.status = OrderStatus.CANCELLED;
    const saved = await this.ordersRepo.save(order);

    // Emit ORDER_CANCELLED â payment.service listens to this and applies the
    // refund policy (100% before production, 50% in production, 0% after dispatch).
    this.eventBus.emit(BizEvent.ORDER_CANCELLED, {
      orderId: id,
      userId: (order as any).customer_id || (order as any).user_id,
      status: OrderStatus.CANCELLED,
      previousStatus,
      wasPaid,
      reason: reason || 'cancelled',
    });
    return saved;
  }

  /* âââââââââââââââââââââââââââââââââââââââââââââââââââ
     AUTO-ASSIGN VENDOR â Ð·Ð°ÑÐ¸Ð°Ð»Ð³Ð° CONFIRMED Ð±Ð¾Ð»Ð¾ÑÐ¾Ð´
     âââââââââââââââââââââââââââââââââââââââââââââââââââ */
  private async autoAssignVendor(order: Order) {
    try {
      const productId = (order as any).product_id;
      const quantity = order.quantity || 1;
      if (!productId) return;

      // Check if already assigned
      const existing = await this.vendorGroupRepo.findOne({ where: { order_id: order.id } });
      if (existing) return;

      // Use AssignmentEngine to find best vendor
      const result = await this.assignmentEngine.assignVendor(productId, quantity);
      const vendor = result.vendor;

      // Create OrderVendorGroup
      await this.vendorGroupRepo.save({
        order_id: order.id,
        vendor_id: vendor.id,
        subtotal: Number(order.total_price) || 0,
        status: 'pending',
        assigned_at: new Date(),
      });

      // Update order factory_id (legacy field)
      await this.ordersRepo.update(order.id, { factory_id: vendor.id });

      // Increment vendor load (both vendor-level and per-product)
      await this.assignmentEngine.incrementLoad(vendor.id, productId, quantity);

      // Send email notification to vendor
      if (vendor.contact_email) {
        await this.mailService.sendVendorOrderAssigned({
          to: vendor.contact_email,
          vendorName: vendor.company_name,
          orderId: order.id,
          productName: (order as any).product_name || 'ÐÒ¯ÑÑÑÐ³Ð´ÑÑÒ¯Ò¯Ð½',
          quantity,
          customerName: (order as any).customer_name || 'Ð¥ÑÑÑÐ³Ð»ÑÐ³Ñ',
          fileUrl: (order as any).file_url || undefined,
          deadline: order.deadline ? new Date(order.deadline).toLocaleDateString('mn-MN') : undefined,
          notes: (order as any).notes || undefined,
        });
      }

      // In-app notification â vendor sees the new job in real time without
      // having to dig through email.
      if ((vendor as any).user_id) {
        await this.notificationService.create({
          user_id: (vendor as any).user_id,
          type: 'order' as any,
          title: 'â¡ Ð¨Ð¸Ð½Ñ Ð·Ð°ÑÐ¸Ð°Ð»Ð³Ð° Ð¾Ð½Ð¾Ð¾Ð³Ð´Ð»Ð¾Ð¾',
          message: `${(order as any).product_name || 'ÐÒ¯ÑÑÑÐ³Ð´ÑÑÒ¯Ò¯Ð½'} Â· ${quantity} ÑÐ¸ÑÑÑÐ³ Â· ${(order as any).customer_name || 'Ð¥ÑÑÑÐ³Ð»ÑÐ³Ñ'}`,
          data: { order_id: order.id, vendor_id: vendor.id },
        }).catch(e => this.logger.warn(`Vendor notification failed: ${e.message}`));
      }

      this.logger.log(`Order ${order.id.slice(-8)} â auto-assigned to ${vendor.company_name} (${result.reason})`);
    } catch (e) {
      this.logger.warn(`Auto-assign failed for order ${order.id}: ${e.message}`);
      // Order proceeds without vendor â admin can manually assign
    }
  }

  /* âââââââââââââââââââââââââââââââââââââââââââââââââââ
     MANUAL RE-ASSIGN VENDOR â Ð°Ð´Ð¼Ð¸Ð½ Ð³Ð°ÑÐ°Ð°Ñ vendor ÑÐ¾Ð»Ð¸Ñ
     âââââââââââââââââââââââââââââââââââââââââââââââââââ */
  async reassignVendor(orderId: string, vendorId: string) {
    const order = await this.getOrderById(orderId);

    // Remove old assignment
    const oldGroup = await this.vendorGroupRepo.findOne({ where: { order_id: orderId } });
    if (oldGroup) {
      // Decrement old vendor's load
      await this.assignmentEngine.decrementLoad(oldGroup.vendor_id);
      await this.vendorGroupRepo.remove(oldGroup);
    }

    // Get new vendor info
    const result = await this.assignmentEngine.manualAssign(
      (order as any).product_id || '',
      vendorId,
    );
    const vendor = result.vendor;

    // Create new assignment
    await this.vendorGroupRepo.save({
      order_id: orderId,
      vendor_id: vendorId,
      subtotal: Number(order.total_price) || 0,
      status: 'pending',
      assigned_at: new Date(),
    });

    await this.ordersRepo.update(orderId, { factory_id: vendorId });
    await this.assignmentEngine.incrementLoad(vendorId, (order as any).product_id, order.quantity || 1);

    // Notify new vendor
    if (vendor.contact_email) {
      await this.mailService.sendVendorOrderAssigned({
        to: vendor.contact_email,
        vendorName: vendor.company_name,
        orderId,
        productName: (order as any).product_name || 'ÐÒ¯ÑÑÑÐ³Ð´ÑÑÒ¯Ò¯Ð½',
        quantity: order.quantity || 1,
        customerName: (order as any).customer_name || 'Ð¥ÑÑÑÐ³Ð»ÑÐ³Ñ',
        fileUrl: (order as any).file_url || undefined,
      });
    }

    this.logger.log(`Order ${orderId.slice(-8)} â manually re-assigned to ${vendor.company_name}`);
    return { order_id: orderId, vendor_id: vendorId, vendor_name: vendor.company_name };
  }

  // ââ Zoom meeting for order ââââââââââââââââââââââââââââââââââ
  async scheduleZoom(orderId: string, userId: string, scheduledAt?: string, notes?: string) {
    const order = await this.ordersRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('ÐÐ°ÑÐ¸Ð°Ð»Ð³Ð° Ð¾Ð»Ð´ÑÐ¾Ð½Ð³Ò¯Ð¹');
    if (order.customer_id !== userId) throw new BadRequestException('ÐÓ©Ð²ÑÓ©Ð½ Ó©Ó©ÑÐ¸Ð¹Ð½ Ð·Ð°ÑÐ¸Ð°Ð»Ð³Ð° Ð´ÑÑÑ Zoom ÑÐ¾Ð²Ð»Ð¾Ñ Ð±Ð¾Ð»Ð¾Ð¼Ð¶ÑÐ¾Ð¹');

    // Only allow for design/signage orders in relevant statuses
    const allowedStatuses = ['confirmed', 'pending_file', 'file_review', 'file_rejected'];
    if (!allowedStatuses.includes(order.status)) {
      throw new BadRequestException('Ð­Ð½Ñ ÑÓ©Ð»Ó©Ð²Ñ Zoom ÑÑÐ»Ð·Ð°Ð»Ñ ÑÐ¾Ð²Ð»Ð¾Ñ Ð±Ð¾Ð»Ð¾Ð¼Ð¶Ð³Ò¯Ð¹');
    }

    const topic = `BizPrint â ${order.product_name || 'ÐÐ°ÑÐ¸Ð°Ð»Ð³Ð°'} #${orderId.slice(-8).toUpperCase()}`;
    const meetingDate = scheduledAt ? new Date(scheduledAt) : undefined;

    const meeting = await this.zoomService.createMeeting({
      topic,
      scheduledAt: meetingDate,
      durationMinutes: 30,
    });

    if (meeting) {
      order.zoom_meeting_id = meeting.meeting_id;
      order.zoom_join_url = meeting.join_url;
      order.zoom_start_url = meeting.start_url;
      order.zoom_password = meeting.password;
      order.zoom_scheduled_at = meetingDate || new Date();
      order.zoom_status = 'scheduled';
      order.zoom_reminder_sent = false;
    } else {
      // Fallback â save a placeholder for manual link
      order.zoom_join_url = 'https://zoom.us';
      order.zoom_scheduled_at = meetingDate || new Date();
      order.zoom_status = 'scheduled';
      order.zoom_reminder_sent = false;
    }
    await this.ordersRepo.save(order);

    // Send email with calendar invite
    if (order.customer_email) {
      try {
        await this.mailService.sendZoomCreated({
          to: order.customer_email,
          customerName: order.customer_name || 'Ð¥ÑÑÑÐ³Ð»ÑÐ³Ñ',
          designerName: 'BizPrint Ð±Ð°Ð³',
          productName: order.product_name || 'ÐÐ°ÑÐ¸Ð°Ð»Ð³Ð°',
          joinUrl: meeting?.join_url || 'https://zoom.us',
          password: meeting?.password,
          scheduledAt: meetingDate,
          meetingId: meeting?.meeting_id,
        });
      } catch (e) {
        this.logger.warn(`Zoom email send failed: ${e.message}`);
      }
    }

    // Notify customer
    if (order.customer_id) {
      await this.notificationService.create({
        user_id: order.customer_id,
        type: 'order',
        title: 'ð¹ Zoom ÑÑÐ»Ð·Ð°Ð»Ñ ÑÐ¾Ð²Ð»Ð¾Ð³Ð´Ð»Ð¾Ð¾',
        message: meetingDate
          ? `${order.product_name} â ${meetingDate.toLocaleString('mn-MN', { timeZone: 'Asia/Ulaanbaatar' })}`
          : `${order.product_name} â Ð¨ÑÑÑÑÐ°Ð¹ ÑÑÐ»Ð·Ð°Ð»Ñ`,
        data: {
          order_id: orderId,
          join_url: meeting?.join_url,
          meeting_id: meeting?.meeting_id,
        },
      }).catch(() => {});
    }

    return {
      success: true,
      meeting_id: meeting?.meeting_id || null,
      join_url: meeting?.join_url || 'https://zoom.us',
      password: meeting?.password || null,
      scheduled_at: order.zoom_scheduled_at,
    };
  }

  // ââ Get orders with upcoming Zoom meetings (for reminder cron) ââ
  async getOrdersWithUpcomingZoom(minutesBefore: number) {
    const now = new Date();
    const targetTime = new Date(now.getTime() + minutesBefore * 60000);
    const windowStart = new Date(targetTime.getTime() - 60000); // 1-min window

    return this.ordersRepo
      .createQueryBuilder('o')
      .where('o.zoom_status = :status', { status: 'scheduled' })
      .andWhere('o.zoom_reminder_sent = false')
      .andWhere('o.zoom_scheduled_at BETWEEN :start AND :end', {
        start: windowStart.toISOString(),
        end: targetTime.toISOString(),
      })
      .getMany();
  }

  async markZoomReminderSent(orderId: string) {
    await this.ordersRepo.update(orderId, { zoom_reminder_sent: true });
  }

  async updateZoomStatus(meetingId: string, status: string) {
    const order = await this.ordersRepo.findOne({ where: { zoom_meeting_id: meetingId } });
    if (!order) return null;
    order.zoom_status = status;
    if (status === 'completed') {
      // Auto-transition to file upload step (ÐÐ»ÑÐ°Ð¼ 4: ÐÐ°ÑÐ»Ð°Ñ â ÑÐ°Ð¹Ð» Ð¾ÑÑÑÐ»Ð°Ñ)
      if (['confirmed', 'pending_file', 'file_review'].includes(order.status)) {
        order.status = OrderStatus.PENDING_FILE;
      }
    }
    return this.ordersRepo.save(order);
  }

  // âââ Public order tracking (no auth, limited info) âââ

  private readonly STATUS_INFO: Record<string, { mn: string; icon: string; desc: string }> = {
    draft:                  { mn: 'ÐÐ¾Ð¾ÑÐ¾Ð³',                  icon: 'ð', desc: 'ÐÐ°ÑÐ¸Ð°Ð»Ð³Ð° Ò¯Ò¯ÑÐ³ÑÐ³Ð´ÑÑÐ½' },
    quotation_sent:         { mn: 'Ò®Ð½Ñ Ð¸Ð»Ð³ÑÑÑÑÐ½',            icon: 'ð°', desc: 'Ò®Ð½Ð¸Ð¹Ð½ ÑÐ°Ð½Ð°Ð» Ð¸Ð»Ð³ÑÑÐ³Ð´ÑÑÐ½' },
    confirmed:              { mn: 'ÐÐ°ÑÐ»Ð°Ð³Ð´ÑÐ°Ð½',               icon: 'â', desc: 'ÐÐ°ÑÐ¸Ð°Ð»Ð³Ð° Ð±Ð°ÑÐ»Ð°Ð³Ð´Ð»Ð°Ð°' },
    pending_file:           { mn: 'Ð¤Ð°Ð¹Ð» ÑÒ¯Ð»ÑÑÐ¶ Ð±Ð°Ð¹Ð½Ð°',        icon: 'ð', desc: 'Ð­Ñ ÑÐ°Ð¹Ð» ÑÒ¯Ð»ÑÑÐ³Ð´ÑÐ¶ Ð±Ð°Ð¹Ð½Ð°' },
    file_review:            { mn: 'Ð¤Ð°Ð¹Ð» ÑÐ°Ð»Ð³Ð°Ð¶ Ð±Ð°Ð¹Ð½Ð°',        icon: 'ð', desc: 'ÐÐ¸Ð·Ð°Ð¹Ð½ ÑÐ°Ð¹Ð»ÑÐ³ ÑÐ°Ð»Ð³Ð°Ð¶ Ð±Ð°Ð¹Ð½Ð°' },
    file_rejected:          { mn: 'Ð¤Ð°Ð¹Ð» Ð±ÑÑÐ°Ð°Ð³Ð´ÑÐ°Ð½',          icon: 'â', desc: 'Ð¤Ð°Ð¹Ð»Ð´ Ð·Ð°ÑÐ²Ð°Ñ ÑÐ¸Ð¹Ñ ÑÐ°Ð°ÑÐ´Ð»Ð°Ð³Ð°ÑÐ°Ð¹' },
    on_hold:                { mn: 'Ð¥Ò¯Ð»ÑÑÐ»ÑÑÐ´',                icon: 'â¸ï¸', desc: 'Ð¢Ò¯Ñ ÑÒ¯Ð»ÑÑÐ»ÑÑÐ´ Ð±Ð°Ð¹Ð½Ð°' },
    in_production:          { mn: 'Ð¥ÑÐ²Ð»ÑÐ¶ Ð±Ð°Ð¹Ð½Ð°',             icon: 'ð¨ï¸', desc: 'Ð¥ÑÐ²Ð»ÑÐ»Ð¸Ð¹Ð½ Ò¯Ð¹Ð» ÑÐ²Ñ ÑÑÑÐ»ÑÑÐ½' },
    finishing:              { mn: 'ÐÐ¾Ð»Ð¾Ð²ÑÑÑÑÐ»Ð°Ð»Ñ',             icon: 'âï¸', desc: 'Ð­ÑÑÐ¸Ð¹Ð½ Ð±Ð¾Ð»Ð¾Ð²ÑÑÑÑÐ»Ð°Ð»Ñ ÑÐ¸Ð¹Ð¶ Ð±Ð°Ð¹Ð½Ð°' },
    partially_dispatched:   { mn: 'Ð¥ÑÑÑÐ³ÑÐ»ÑÐ½ ÑÒ¯ÑÐ³ÑÐ³Ð´ÑÑÐ½',    icon: 'ð¦', desc: 'ÐÑÐ³ ÑÑÑÑÐ³ ÑÒ¯ÑÐ³ÑÐ³Ð´ÑÑÐ½' },
    dispatched:             { mn: 'Ð¥Ò¯ÑÐ³ÑÐ»ÑÑÐ´ Ð³Ð°ÑÑÐ°Ð½',         icon: 'ð', desc: 'Ð¥Ò¯ÑÐ³ÑÐ»ÑÑÐ´ Ð³Ð°ÑÑÐ°Ð½' },
    delivered:              { mn: 'Ð¥Ò¯ÑÐ³ÑÐ³Ð´ÑÑÐ½',               icon: 'ð¬', desc: 'Ð¢Ð°Ð½Ñ ÑÐ°ÑÐ³Ñ ÑÒ¯ÑÐ³ÑÐ³Ð´ÑÑÐ½' },
    completed:              { mn: 'ÐÑÑÑÑÐ°Ð½',                   icon: 'ð', desc: 'ÐÐ°ÑÐ¸Ð°Ð»Ð³Ð° Ð°Ð¼Ð¶Ð¸Ð»ÑÑÐ°Ð¹ Ð´ÑÑÑÐ»Ð°Ð°' },
    cancelled:              { mn: 'Ð¦ÑÑÐ»Ð°Ð³Ð´ÑÐ°Ð½',               icon: 'ð«', desc: 'ÐÐ°ÑÐ¸Ð°Ð»Ð³Ð° ÑÑÑÐ»Ð°Ð³Ð´ÑÐ°Ð½' },
  };

  async getPublicTracking(orderNumber: string) {
    // Find by quote_number or by id prefix
    let order = await this.ordersRepo.findOne({ where: { quote_number: orderNumber } });
    if (!order) {
      order = await this.ordersRepo.findOne({ where: { id: orderNumber } });
    }
    if (!order) return { found: false };

    const info = this.STATUS_INFO[order.status] || { mn: order.status, icon: 'ð¦', desc: '' };

    // Public timeline stages
    const stages = ['confirmed', 'pending_file', 'file_review', 'in_production', 'finishing', 'dispatched', 'delivered', 'completed'];
    const currentIdx = stages.indexOf(order.status);

    // Get audit logs for dates
    const logs = await this.auditRepo.find({
      where: { order_id: order.id },
      order: { created_at: 'ASC' },
    });

    return {
      found: true,
      order_id: order.id,
      order_number: order.quote_number || order.id.slice(0, 8).toUpperCase(),
      status: order.status,
      status_label: info.mn,
      status_icon: info.icon,
      product_name: order.product_name,
      quantity: order.quantity,
      total_price: order.total_price,
      created_at: order.created_at,
      deadline: (order as any).deadline || null,
      timeline: stages.map((s, i) => {
        const log = logs.find(l => (l as any).new_value === s || (l as any).to_status === s);
        return {
          status: s,
          label: this.STATUS_INFO[s]?.mn || s,
          icon: this.STATUS_INFO[s]?.icon || 'â',
          completed: i < currentIdx,
          active: i === currentIdx,
          pending: i > currentIdx,
          date: log?.created_at || null,
        };
      }),
    };
  }

  // ─── CSV Export ──────────────────────────────────────────────────────
  async exportOrders(filters: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<string> {
    const qb = this.orderRepo.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .orderBy('order.createdAt', 'DESC');

    if (filters.startDate) {
      qb.andWhere('order.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
    }
    if (filters.endDate) {
      qb.andWhere('order.createdAt <= :endDate', { endDate: new Date(filters.endDate) });
    }
    if (filters.status) {
      qb.andWhere('order.status = :status', { status: filters.status });
    }

    const orders = await qb.getMany();

    const header = 'id,status,totalPrice,createdAt,customerEmail,productNames';
    const rows = orders.map((o) => {
      const productNames = (o.items || [])
        .map((item: any) => item.product?.name || item.productName || '')
        .filter(Boolean)
        .join(' | ');
      const email = (o as any).user?.email || '';
      const price = (o as any).totalPrice ?? (o as any).total_price ?? '';
      return [
        o.id,
        o.status,
        price,
        o.createdAt ? new Date(o.createdAt).toISOString() : '',
        email,
        `"${productNames.replace(/"/g, '""')}"`,
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

}