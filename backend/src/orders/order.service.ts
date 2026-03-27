import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
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

// Valid state transitions — defines which states each state can move to
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]:                 [OrderStatus.QUOTATION_SENT, OrderStatus.CANCELLED],
  [OrderStatus.QUOTATION_SENT]:        [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]:             [OrderStatus.PENDING_FILE, OrderStatus.IN_PRODUCTION, OrderStatus.CANCELLED],
  [OrderStatus.PENDING_FILE]:          [OrderStatus.FILE_REVIEW, OrderStatus.CANCELLED],
  [OrderStatus.FILE_REVIEW]:           [OrderStatus.CONFIRMED, OrderStatus.FILE_REJECTED],
  [OrderStatus.FILE_REJECTED]:         [OrderStatus.PENDING_FILE, OrderStatus.CANCELLED],
  [OrderStatus.ON_HOLD]:               [], // resolved dynamically — can return to any state that led to ON_HOLD
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
  ) {}

  async createOrder(data: any) {
    const order = this.ordersRepo.create({ ...data, status: OrderStatus.DRAFT });
    const saved: Order = await this.ordersRepo.save(order as any);
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
    if (!quote) throw new NotFoundException('Quote олдсонгүй');

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
        [OrderStatus.CONFIRMED]:            'Таны захиалга баталгаажлаа ✅',
        [OrderStatus.PENDING_FILE]:         'Хэвлэх файлаа оруулна уу 📁',
        [OrderStatus.FILE_REVIEW]:          'Файл хүлээн авлаа, шалгаж байна 🔍',
        [OrderStatus.FILE_REJECTED]:        'Файл буцаагдлаа. Засаад дахин оруулна уу ❌',
        [OrderStatus.IN_PRODUCTION]:        'Захиалга үйлдвэрлэлд орлоо 🏭',
        [OrderStatus.FINISHING]:            'Захиалга боловсруулалтад орлоо 🔧',
        [OrderStatus.DISPATCHED]:           'Таны захиалга илгээгдлээ 📦',
        [OrderStatus.DELIVERED]:            'Захиалга хүргэгдлээ. Үнэлгээ өгнө үү ⭐',
        [OrderStatus.COMPLETED]:            'Захиалга амжилттай дууслаа ✅',
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
        }
      } catch (e) {
        this.logger.warn('File email error: ' + e.message);
      }
    }

    // ═══ PRODUCTION GATE — validate file before production ═══
    if (status === OrderStatus.IN_PRODUCTION) {
      try {
        const gate = await this.productionGate.isProductionReady(id);
        if (!gate.ready) {
          this.logger.warn(`Production gate failed for order ${id}: ${gate.reason}`);
          // Don't block — log warning, admin can override
        }
      } catch (e) {
        this.logger.warn(`Production gate check error: ${e.message}`);
      }
    }

    // ═══ AUTO-ASSIGN VENDOR when order is CONFIRMED ═══
    if (status === OrderStatus.CONFIRMED && (order as any).product_id) {
      await this.autoAssignVendor(order as any);
    }

    return order;
  }

  async updateOrder(id: string, data: any) {
    const update: any = {};
    if (data.status) {
      const order = await this.getOrderById(id);
      this.validateTransition(order.status, data.status);
      update.status = data.status;
    }
    if (data.assigned_to !== undefined) update.assigned_to = data.assigned_to;
    if (data.deadline !== undefined) update.deadline = data.deadline;
    await this.ordersRepo.update(id, update);
    return this.getOrderById(id);
  }

  /**
   * QC fail буцаах — одоогийн stage-аас өмнөх stage руу буцаана
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
        `"${currentStatus}" → "${newStatus}" шилжилт зөвшөөрөгдөөгүй. Зөвшөөрөгдсөн: ${allowed.join(', ')}`,
      );
    }
  }

  async cancelOrder(id: string) {
    const order = await this.getOrderById(id);
    order.status = OrderStatus.CANCELLED;
    const saved = await this.ordersRepo.save(order);
    // Emit ORDER_CANCELLED for real-time broadcast
    this.eventBus.emit(BizEvent.ORDER_CANCELLED, {
      orderId: id,
      userId: (order as any).customer_id || (order as any).user_id,
      status: OrderStatus.CANCELLED,
    });
    return saved;
  }

  /* ═══════════════════════════════════════════════════
     AUTO-ASSIGN VENDOR — захиалга CONFIRMED болоход
     ═══════════════════════════════════════════════════ */
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

      this.logger.log(`Order ${order.id.slice(-8)} → auto-assigned to ${vendor.company_name} (${result.reason})`);
    } catch (e) {
      this.logger.warn(`Auto-assign failed for order ${order.id}: ${e.message}`);
      // Order proceeds without vendor — admin can manually assign
    }
  }

  /* ═══════════════════════════════════════════════════
     MANUAL RE-ASSIGN VENDOR — админ гараар vendor солих
     ═══════════════════════════════════════════════════ */
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

    this.logger.log(`Order ${orderId.slice(-8)} → manually re-assigned to ${vendor.company_name}`);
    return { order_id: orderId, vendor_id: vendorId, vendor_name: vendor.company_name };
  }
}
