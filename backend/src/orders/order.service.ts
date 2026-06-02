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

// Valid state transitions - defines which states each state can move to
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]:                 [OrderStatus.QUOTATION_SENT, OrderStatus.CANCELLED],
  [OrderStatus.QUOTATION_SENT]:        [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]:             [OrderStatus.PENDING_FILE, OrderStatus.IN_PRODUCTION, OrderStatus.CANCELLED],
  [OrderStatus.PENDING_FILE]:          [OrderStatus.FILE_REVIEW, OrderStatus.CANCELLED],
  [OrderStatus.FILE_REVIEW]:           [OrderStatus.CONFIRMED, OrderStatus.FILE_REJECTED],
  [OrderStatus.FILE_REJECTED]:         [OrderStatus.PENDING_FILE, OrderStatus.CANCELLED],
  [OrderStatus.ON_HOLD]:               [], // resolved dynamically - can return to any state that led to ON_HOLD
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
          name: data.customer_name || 'Хэрэглэгч',
          orderId: saved.id,
          productName: data.product_name || 'Бүтээгдэхүүн',
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
          title: 'Шинэ захиалга',
          message: `${data.customer_name || 'Хэрэглэгч'} — ${data.product_name || 'Бүтээгдэхүүн'} × ${saved.quantity}ш`,
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
    if (!quote || (quote as any).user_id !== userId) throw new NotFoundException('Үнийн санал олдсонгүй');
    if ((quote as any).status && (quote as any).status !== 'draft') {
      throw new BadRequestException(`Үнийн санал "${(quote as any).status}" төлөвтэй байна — зөвхөн "draft" батлах боломжтой`);
    }

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
      notes: `Quote ${(quote as any).quote_number}-аас үүсгэгдсэн`,
    });
    const saved: Order = await this.ordersRepo.save(order as any);

    await quoteRepo.update(quoteId, { status: 'ordered' });

    if ((quote as any).customer_email) {
      try {
        await this.mailService.sendOrderConfirmation({
          to: (quote as any).customer_email,
          name: (quote as any).customer_name || 'Хэрэглэгч',
          orderId: saved.id,
          productName: (quote as any).product_name || 'Хэвлэл',
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
        [OrderStatus.CONFIRMED]:            'Таны захиалга баталгаажлаа',
        [OrderStatus.PENDING_FILE]:         'Хэвлэх файлаа оруулна уу',
        [OrderStatus.FILE_REVIEW]:          'Файл хүлээн авлаа, шалгаж байна',
        [OrderStatus.FILE_REJECTED]:        'Файл буцаагдлаа. Засаж дахин оруулна уу',
        [OrderStatus.IN_PRODUCTION]:        'Захиалга үйлдвэрлэлд орлоо',
        [OrderStatus.FINISHING]:            'Захиалга боловсруулалтад орлоо',
        [OrderStatus.DISPATCHED]:           'Таны захиалга илгээгдлээ',
        [OrderStatus.DELIVERED]:            'Захиалга хүргэгдлээ. Үнэлгээ өгнө үү',
        [OrderStatus.COMPLETED]:            'Захиалга амжилттай дууслаа',
      };
      if (statusMessages[status]) {
        try {
          await this.notificationService.create({
            user_id: customerId,
            type: 'ORDER' as any,
            title: 'Захиалгын мэдэгдэл',
            message: statusMessages[status],
            data: { order_id: id, status },
          });
        } catch {}
      }
    }

    // Send file-related emails
    const email = (order as any).customer_email;
    const customerName = (order as any).customer_name || 'Хэрэглэгч';
    const productName = (order as any).product_name || 'Хэвлэл';

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
            courierName: (order as any).courier_name || 'Хүргэлтийн ажилтан',
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

    // Production gate - validate file before production
    if (status === OrderStatus.IN_PRODUCTION) {
      try {
        const gate = await this.productionGate.isProductionReady(id);
        if (!gate.ready) {
          this.logger.warn(`Production gate failed for order ${id}: ${gate.reason}`);
          // Don't block - log warning, admin can override
        }
      } catch (e) {
        this.logger.warn(`Production gate check error: ${e.message}`);
      }
    }

    // Auto-assign vendor when order is CONFIRMED
    if (status === OrderStatus.CONFIRMED && (order as any).product_id) {
      await this.autoAssignVendor(order as any);
    }

    // Always broadcast the transition. Listeners include:
    //   - DeliveryService auto-creates Delivery + assigns courier on DISPATCHED
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
              `Үйлдвэр ${order.status} статусаас ${data.status} статус руу шилжүүлэх эрхгүй`,
            );
          }
        } else {
          throw new BadRequestException('Та энэ захиалгын статусыг өөрчлөх эрхгүй');
        }
      }
      update.status = data.status;
    }
    if (data.assigned_to !== undefined) update.assigned_to = data.assigned_to;
    if (data.deadline !== undefined) update.deadline = data.deadline;
    await this.ordersRepo.update(id, update);

    // Trigger the same downstream side-effects updateStatus does (notification,
    // emails, vendor auto-assign). Skipping these meant vendors clicking
    // "Боловсруулалтад оруулах" left the customer with no notification.
    if (data.status) {
      await this.updateStatus(id, data.status as OrderStatus).catch(e =>
        this.logger.warn(`updateStatus side-effects failed for ${id}: ${e.message}`),
      );
    }

    return this.getOrderById(id);
  }

  /**
   * Throws if the caller (a vendor user) is not assigned to the given order.
   * Resolves the vendor record from user_id to vendors.id and compares to
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
      throw new BadRequestException('Vendor бүртгэл олдсонгүй');
    }

    if ((order as any).factory_id === vendorId) return;

    const group = await this.vendorGroupRepo.findOne({
      where: { order_id: order.id, vendor_id: vendorId },
    });
    if (!group) {
      throw new BadRequestException('Та энэ захиалгад оноогдоогүй');
    }
  }

  /**
   * QC fail буцаах - одоогийн stage-аас өмнөх stage руу буцаана
   * @param id - Order ID
   * @param reason - Буцаах шалтгаан
   * @param targetStage - Аль stage руу буцаах (optional, default = өмнөх stage)
   * @param user - Хэн буцаасан
   */
  async revertStatus(
    id: string,
    reason: string,
    user: string,
    targetStage?: string,
  ) {
    const order = await this.getOrderById(id);
    const currentStatus = order.status;

    // Одоогийн stage-ийн index олох
    const currentIndex = WORKFLOW_STAGES.indexOf(currentStatus as OrderStatus);

    // completed, delivered, shipped, cancelled, pending бол буцаах боломжгүй
    const NON_REVERTABLE = [OrderStatus.COMPLETED, OrderStatus.DELIVERED, OrderStatus.DISPATCHED, OrderStatus.CANCELLED];
    if (NON_REVERTABLE.includes(currentStatus as OrderStatus)) {
      throw new BadRequestException(
        `"${currentStatus}" төлөвөөс буцаах боломжгүй`,
      );
    }
    if (currentIndex <= 0) {
      throw new BadRequestException(
        `"${currentStatus}" төлөвөөс буцаах боломжгүй (анхны төлөв)`,
      );
    }

    let revertToIndex: number;

    if (targetStage) {
      // Тодорхой stage руу буцаах
      revertToIndex = WORKFLOW_STAGES.indexOf(targetStage as OrderStatus);
      if (revertToIndex < 0 || revertToIndex >= currentIndex) {
        throw new BadRequestException(
          `"${targetStage}" руу буцаах боломжгүй (одоогийн: ${currentStatus})`,
        );
      }
    } else {
      // Default: өмнөх stage руу
      revertToIndex = currentIndex - 1;
    }

    const revertTo = WORKFLOW_STAGES[revertToIndex];

    // Статус шинэчлэх
    await this.ordersRepo.update(id, { status: revertTo });

    // Audit trail бичих
    const auditEntry = this.auditRepo.create({
      order_id: id,
      user: user,
      action: `БУЦААГДСАН: "${currentStatus}" → "${revertTo}" | Шалтгаан: ${reason}`,
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
   * List orders assigned to a vendor (joined via vendor user_id to vendor.id to factory_id).
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
    if (!order) throw new NotFoundException('Захиалга олдсонгүй');
    return order;
  }

  private validateTransition(currentStatus: string, newStatus: string) {
    const current = currentStatus as OrderStatus;
    const next = newStatus as OrderStatus;

    if (!Object.values(OrderStatus).includes(next)) {
      throw new BadRequestException(`"${newStatus}" нь зөвшөөрөгдсөн төлөв биш`);
    }

    const allowed = VALID_TRANSITIONS[current];
    if (!allowed) {
      throw new BadRequestException(`"${currentStatus}" төлөвөөс шилжих боломжгүй`);
    }

    // ON_HOLD is resolved dynamically via revertStatus, not updateStatus
    if (current === OrderStatus.ON_HOLD) {
      throw new BadRequestException(
        `ON_HOLD төлөвөөс гарахын тулд revertStatus ашиглана уу`,
      );
    }

    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `"${currentStatus}" -> "${newStatus}" шилжилт зөвшөөрөгдөөгүй. Зөвшөөрөгдсөн: ${allowed.join(', ')}`,
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
        throw new BadRequestException('Та энэ захиалгыг цуцлах эрхгүй');
      }
    }

    const previousStatus = order.status as OrderStatus;
    const wasPaid = order.payment_status === 'paid';
    order.status = OrderStatus.CANCELLED;
    const saved = await this.ordersRepo.save(order);

    // Emit ORDER_CANCELLED - payment.service listens to this and applies the
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

  /*
   * Auto-assign vendor when order becomes CONFIRMED.
   */
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
          productName: (order as any).product_name || 'Бүтээгдэхүүн',
          quantity,
          customerName: (order as any).customer_name || 'Хэрэглэгч',
          fileUrl: (order as any).file_url || undefined,
          deadline: order.deadline ? new Date(order.deadline).toLocaleDateString('mn-MN') : undefined,
          notes: (order as any).notes || undefined,
        });
      }

      // In-app notification - vendor sees the new job in real time without
      // having to dig through email.
      if ((vendor as any).user_id) {
        await this.notificationService.create({
          user_id: (vendor as any).user_id,
          type: 'order' as any,
          title: 'Шинэ захиалга оноогдлоо',
          message: `${(order as any).product_name || 'Бүтээгдэхүүн'} · ${quantity} ширхэг · ${(order as any).customer_name || 'Хэрэглэгч'}`,
          data: { order_id: order.id, vendor_id: vendor.id },
        }).catch(e => this.logger.warn(`Vendor notification failed: ${e.message}`));
      }

      this.logger.log(`Order ${order.id.slice(-8)} -> auto-assigned to ${vendor.company_name} (${result.reason})`);
    } catch (e) {
      this.logger.warn(`Auto-assign failed for order ${order.id}: ${e.message}`);
      // Order proceeds without vendor - admin can manually assign
    }
  }

  /*
   * Manual re-assign vendor - админ гараар vendor солих.
   */
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
        productName: (order as any).product_name || 'Бүтээгдэхүүн',
        quantity: order.quantity || 1,
        customerName: (order as any).customer_name || 'Хэрэглэгч',
        fileUrl: (order as any).file_url || undefined,
      });
    }

    this.logger.log(`Order ${orderId.slice(-8)} -> manually re-assigned to ${vendor.company_name}`);
    return { order_id: orderId, vendor_id: vendorId, vendor_name: vendor.company_name };
  }

  // Zoom meeting for order
  async scheduleZoom(orderId: string, userId: string, scheduledAt?: string, notes?: string) {
    const order = await this.ordersRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Захиалга олдсонгүй');
    if (order.customer_id !== userId) throw new BadRequestException('Зөвхөн өөрийн захиалга дээр Zoom товлох боломжтой');

    // Only allow for design/signage orders in relevant statuses
    const allowedStatuses = ['confirmed', 'pending_file', 'file_review', 'file_rejected'];
    if (!allowedStatuses.includes(order.status)) {
      throw new BadRequestException('Энэ төлөвт Zoom уулзалт товлох боломжгүй');
    }

    const topic = `BizPrint - ${order.product_name || 'Захиалга'} #${orderId.slice(-8).toUpperCase()}`;
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
      // Fallback - save a placeholder for manual link
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
          customerName: order.customer_name || 'Хэрэглэгч',
          designerName: 'BizPrint баг',
          productName: order.product_name || 'Захиалга',
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
        title: 'Zoom уулзалт товлогдлоо',
        message: meetingDate
          ? `${order.product_name} - ${meetingDate.toLocaleString('mn-MN', { timeZone: 'Asia/Ulaanbaatar' })}`
          : `${order.product_name} - Шуурхай уулзалт`,
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

  // Get orders with upcoming Zoom meetings (for reminder cron)
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
      // Auto-transition to file upload step (Алхам 4: Батлах -> файл оруулах)
      if (['confirmed', 'pending_file', 'file_review'].includes(order.status)) {
        order.status = OrderStatus.PENDING_FILE;
      }
    }
    return this.ordersRepo.save(order);
  }

  // Public order tracking (no auth, limited info)

  private readonly STATUS_INFO: Record<string, { mn: string; icon: string; desc: string }> = {
    draft:                  { mn: 'Ноорог',                  icon: 'draft', desc: 'Захиалга үүсгэгдсэн' },
    quotation_sent:         { mn: 'Үнэ илгээсэн',            icon: 'quote', desc: 'Үнийн санал илгээгдсэн' },
    confirmed:              { mn: 'Батлагдсан',              icon: 'confirmed', desc: 'Захиалга батлагдлаа' },
    pending_file:           { mn: 'Файл хүлээж байна',        icon: 'file', desc: 'Эх файл хүлээгдэж байна' },
    file_review:            { mn: 'Файл шалгаж байна',        icon: 'review', desc: 'Дизайн файлыг шалгаж байна' },
    file_rejected:          { mn: 'Файл буцаагдсан',          icon: 'rejected', desc: 'Файлд засвар хийх шаардлагатай' },
    on_hold:                { mn: 'Хүлээлтэд',               icon: 'hold', desc: 'Түр хүлээлтэд байна' },
    in_production:          { mn: 'Хэвлэж байна',             icon: 'production', desc: 'Хэвлэлийн үйл явц эхэлсэн' },
    finishing:              { mn: 'Боловсруулалт',            icon: 'finishing', desc: 'Эцсийн боловсруулалт хийж байна' },
    partially_dispatched:   { mn: 'Хэсэгчлэн хүргэгдсэн',     icon: 'package', desc: 'Нэг хэсэг хүргэгдсэн' },
    dispatched:             { mn: 'Хүргэлтэд гарсан',         icon: 'delivery', desc: 'Хүргэлтэд гарсан' },
    delivered:              { mn: 'Хүргэгдсэн',               icon: 'delivered', desc: 'Таны хаягт хүргэгдсэн' },
    completed:              { mn: 'Дууссан',                  icon: 'completed', desc: 'Захиалга амжилттай дууслаа' },
    cancelled:              { mn: 'Цуцлагдсан',               icon: 'cancelled', desc: 'Захиалга цуцлагдсан' },
  };

  async getPublicTracking(orderNumber: string) {
    // Find by quote_number or by id prefix
    let order = await this.ordersRepo.findOne({ where: { quote_number: orderNumber } });
    if (!order) {
      order = await this.ordersRepo.findOne({ where: { id: orderNumber } });
    }
    if (!order) return { found: false };

    const info = this.STATUS_INFO[order.status] || { mn: order.status, icon: 'package', desc: '' };

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
          icon: this.STATUS_INFO[s]?.icon || 'step',
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
    const qb = this.ordersRepo.createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .orderBy('order.created_at', 'DESC');

    if (filters.startDate) {
      qb.andWhere('order.created_at >= :startDate', { startDate: new Date(filters.startDate) });
    }
    if (filters.endDate) {
      qb.andWhere('order.created_at <= :endDate', { endDate: new Date(filters.endDate) });
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
      const email = o.customer_email || (o as any).customer?.email || '';
      const price = o.total_price ?? '';
      return [
        o.id,
        o.status,
        price,
        o.created_at ? new Date(o.created_at).toISOString() : '',
        email,
        `"${productNames.replace(/"/g, '""')}"`,
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }


  async exportOrdersCsv(): Promise<string> {
    const orders = await this.ordersRepo.find({ relations: ['customer'], order: { created_at: 'DESC' }, take: 10000 }).catch(() => []);
    const rows = [
      ['ID', 'Order Number', 'Customer', 'Email', 'Total', 'Status', 'Created'].join(','),
      ...orders.map((o: any) => [
        o.id ?? '',
        o.orderNumber ?? o.order_number ?? '',
        (o.customer_name ?? o.customer?.full_name ?? '').toString().replace(/,/g, ' '),
        o.customer_email ?? o.customer?.email ?? '',
        o.total_price ?? 0,
        o.status ?? '',
        o.created_at ? new Date(o.created_at).toISOString().split('T')[0] : '',
      ].join(',')),
    ];
    return rows.join('\n');
  }

  async generateInvoicePdf(orderId: string): Promise<Buffer> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['customer', 'items', 'items.product'],
    });

    const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const orange = rgb(1, 0.42, 0);
    const black = rgb(0, 0, 0);
    const gray = rgb(0.5, 0.5, 0.5);

    // Header
    page.drawText('BIZPRINT.MN', { x: 50, y: 790, size: 22, font: boldFont, color: orange });
    page.drawText('INVOICE', { x: 430, y: 790, size: 18, font: boldFont, color: black });

    // Order info
    const orderNum = order?.quote_number ?? orderId.slice(0, 8).toUpperCase();
    const createdAt = order?.created_at ? new Date(order.created_at).toLocaleDateString() : new Date().toLocaleDateString();
    page.drawText('Order #: ' + orderNum, { x: 50, y: 755, size: 11, font: boldFont, color: black });
    page.drawText('Date: ' + createdAt, { x: 50, y: 738, size: 10, font, color: gray });

    // Customer
    const customerName = order?.customer_name ?? order?.customer?.full_name ?? 'Customer';
    const customerEmail = order?.customer_email ?? order?.customer?.email ?? '';
    page.drawText('Bill To:', { x: 50, y: 710, size: 11, font: boldFont, color: black });
    page.drawText(customerName, { x: 50, y: 694, size: 10, font, color: black });
    if (customerEmail) page.drawText(customerEmail, { x: 50, y: 679, size: 10, font, color: gray });

    // Divider
    page.drawLine({ start: { x: 50, y: 665 }, end: { x: 545, y: 665 }, thickness: 1, color: orange });

    // Table header
    page.drawText('Item', { x: 50, y: 648, size: 10, font: boldFont, color: black });
    page.drawText('Qty', { x: 360, y: 648, size: 10, font: boldFont, color: black });
    page.drawText('Unit Price', { x: 410, y: 648, size: 10, font: boldFont, color: black });
    page.drawText('Total', { x: 490, y: 648, size: 10, font: boldFont, color: black });
    page.drawLine({ start: { x: 50, y: 640 }, end: { x: 545, y: 640 }, thickness: 0.5, color: gray });

    // Items
    const items = order?.items ?? [];
    let y = 622;
    let subtotal = 0;
    for (const item of items.slice(0, 20)) {
      const name = (item.product?.name ?? item.specs?.product_name ?? 'Product').slice(0, 45);
      const qty = item.quantity ?? 1;
      const price = item.unit_price ?? 0;
      const lineTotal = qty * price;
      subtotal += lineTotal;
      page.drawText(name, { x: 50, y, size: 9, font, color: black });
      page.drawText(String(qty), { x: 365, y, size: 9, font, color: black });
      page.drawText(Number(price).toLocaleString(), { x: 410, y, size: 9, font, color: black });
      page.drawText(Number(lineTotal).toLocaleString(), { x: 490, y, size: 9, font, color: black });
      y -= 16;
      if (y < 200) break;
    }

    if (!items.length) {
      const total = order?.total_price ?? 0;
      page.drawText('See order details', { x: 50, y, size: 9, font, color: gray });
      subtotal = Number(total);
      y -= 16;
    }

    // Total
    page.drawLine({ start: { x: 350, y: y - 4 }, end: { x: 545, y: y - 4 }, thickness: 0.5, color: gray });
    const finalTotal = order?.total_price ?? subtotal;
    page.drawText('TOTAL:', { x: 390, y: y - 20, size: 12, font: boldFont, color: black });
    page.drawText(Number(finalTotal).toLocaleString() + ' MNT', { x: 460, y: y - 20, size: 12, font: boldFont, color: orange });

    // Footer
    page.drawLine({ start: { x: 50, y: 60 }, end: { x: 545, y: 60 }, thickness: 0.5, color: gray });
    page.drawText('Bizprint.mn | info@bizprint.mn | +976 XXXX XXXX', { x: 50, y: 44, size: 8, font, color: gray });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
