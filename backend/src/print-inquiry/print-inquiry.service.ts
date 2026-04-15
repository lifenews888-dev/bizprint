import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrintInquiry, InquiryStatus } from './entities/print-inquiry.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { CommissionService } from '../commission/commission.service';
import { Vendor } from '../vendors/vendor.entity';
import { MailService } from '../mail/mail.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class PrintInquiryService {
  constructor(
    @InjectRepository(PrintInquiry) private repo: Repository<PrintInquiry>,
    @InjectRepository(ChatMessage) private chatRepo: Repository<ChatMessage>,
    @InjectRepository(Vendor) private vendorRepo: Repository<Vendor>,
    private eventEmitter: EventEmitter2,
    @Optional() private commissionService?: CommissionService,
    @Optional() private mailService?: MailService,
    @Optional() private notificationsGateway?: NotificationsGateway,
  ) {}

  private genNumber(): string {
    const y = new Date().getFullYear();
    const r = Math.floor(1000 + Math.random() * 9000);
    return `INQ-${y}-${r}`;
  }

  async create(dto: Partial<PrintInquiry>): Promise<PrintInquiry> {
    const saved = await this.repo.save(
      this.repo.create({ ...dto, inquiry_number: this.genNumber(), status: InquiryStatus.NEW }),
    );
    this.eventEmitter.emit('inquiry.created', saved);
    await this.sysMsg(saved.id, `Захиалгын хүсэлт #${saved.inquiry_number} хүлээн авлаа. Бид удахгүй холбогдоно.`);

    // Realtime notification to admins
    try { this.notificationsGateway?.notifyAdminNewInquiry(saved); } catch {}

    // Email admin
    this.mailService?.sendAdminNewInquiry({
      id: saved.id,
      productName: saved.product_name || saved.category || 'Захиалга',
      quantity: saved.quantity || 0,
      estimatedPrice: Number((saved as any).estimated_price) || 0,
      customerName: saved.customer_name || '',
      customerPhone: saved.customer_phone || '',
    }).catch(() => {});

    // Auto-assign to best-matching vendor (fire-and-forget, never blocks)
    this.autoAssignVendor(saved).catch(() => {});

    return saved;
  }

  // ─── Auto-assign inquiry to best vendor (tier × rating × availability) ───
  async autoAssignVendor(inquiry: PrintInquiry): Promise<void> {
    try {
      // Skip if already assigned
      if (inquiry.vendor_id) return;

      const productType = (inquiry.category || inquiry.product_name || '').toLowerCase();
      if (!productType) return;

      // Simple match: any vendor accepting orders
      const vendors = await this.vendorRepo
        .createQueryBuilder('v')
        .where('v.accepts_orders = true')
        .orderBy('v.rating', 'DESC')
        .addOrderBy('v.total_orders', 'DESC')
        .limit(5)
        .getMany();

      if (vendors.length === 0) return;

      // Pick best (first) — future enhancement: match by capability/floor_prices
      const vendor = vendors[0];

      await this.repo.update(inquiry.id, {
        vendor_id: vendor.id,
        status: InquiryStatus.CONFIRMED,
      });

      // Realtime + email vendor
      this.notificationsGateway?.notifyVendorNewInquiry(vendor.user_id || null, inquiry);
      if (vendor.contact_email) {
        this.mailService?.sendVendorNewInquiry(
          { email: vendor.contact_email, name: vendor.company_name },
          {
            id: inquiry.id,
            productName: inquiry.product_name || '',
            quantity: inquiry.quantity || 0,
            estimatedPrice: Number((inquiry as any).estimated_price) || 0,
            customerName: inquiry.customer_name || '',
          },
        ).catch(() => {});
      }

      await this.sysMsg(
        inquiry.id,
        `Захиалга автоматаар "${vendor.company_name}" үйлдвэрт хуваарилагдлаа`,
      );
    } catch (e: any) {
      console.error('Auto-assign failed:', e?.message);
    }
  }

  // ─── Admin: assign an inquiry to a specific vendor ───
  async assignVendor(inquiryId: string, vendorId: string, note?: string) {
    const vendor = await this.vendorRepo.findOne({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor олдсонгүй');

    await this.repo.update(inquiryId, {
      vendor_id: vendorId,
      status: InquiryStatus.CONFIRMED,
    });

    await this.sysMsg(
      inquiryId,
      `Захиалга "${vendor.company_name}" үйлдвэрт хуваарилагдлаа${note ? ': ' + note : ''}`,
    );

    // Notify vendor (email + realtime)
    const inquiry = await this.repo.findOne({ where: { id: inquiryId } });
    this.notificationsGateway?.notifyVendorNewInquiry(vendor.user_id || null, inquiry);
    if (vendor.contact_email) {
      this.mailService?.sendVendorNewInquiry(
        { email: vendor.contact_email, name: vendor.company_name },
        {
          id: inquiryId,
          productName: inquiry?.product_name || '',
          quantity: inquiry?.quantity || 0,
          estimatedPrice: Number((inquiry as any)?.estimated_price) || 0,
          customerName: inquiry?.customer_name || '',
        },
      ).catch(() => {});
    }

    return inquiry;
  }

  findAll(f: { status?: string; category?: string } = {}): Promise<PrintInquiry[]> {
    const qb = this.repo.createQueryBuilder('i').orderBy('i.created_at', 'DESC');
    if (f.status) qb.andWhere('i.status = :s', { s: f.status });
    if (f.category) qb.andWhere('i.category = :c', { c: f.category });
    return qb.getMany();
  }

  findByCustomer(cid: string) {
    return this.repo.find({ where: { customer_id: cid }, order: { created_at: 'DESC' } });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async updateStatus(id: string, status: InquiryStatus, note?: string) {
    await this.repo.update(id, { status, ...(note ? { admin_notes: note } : {}) });
    const labels: Record<string, string> = {
      reviewing: 'Захиалгыг хянаж байна',
      quoted: 'Үнийн санал бэлэн болсон',
      confirmed: 'Захиалга батлагдлаа',
      in_work: 'Хэвлэж эхэллээ',
      completed: 'Захиалга бэлэн болсон',
    };
    if (labels[status]) await this.sysMsg(id, labels[status]);
    this.eventEmitter.emit('inquiry.status', { id, status });
    return this.repo.findOne({ where: { id } });
  }

  async sendQuote(id: string, price: number, notes: string) {
    await this.repo.update(id, { quoted_price: price, status: InquiryStatus.QUOTED, admin_notes: notes });
    await this.sysMsg(id, `Үнийн санал: ${price.toLocaleString()}₮. ${notes}`);
    this.eventEmitter.emit('inquiry.quoted', { id, price });
    return this.repo.findOne({ where: { id } });
  }

  async assign(id: string, adminId: string) {
    await this.repo.update(id, { assigned_to: adminId, status: InquiryStatus.REVIEWING });
    return this.repo.findOne({ where: { id } });
  }

  getMessages(inquiryId: string) {
    return this.chatRepo.find({ where: { inquiry_id: inquiryId }, order: { created_at: 'ASC' } });
  }

  async sendMessage(dto: {
    inquiryId: string; senderId: string; senderName: string;
    senderRole: string; content: string; attachments?: any[];
  }): Promise<ChatMessage> {
    const msg = await this.chatRepo.save(
      this.chatRepo.create({
        inquiry_id: dto.inquiryId,
        sender_id: dto.senderId,
        sender_name: dto.senderName,
        sender_role: dto.senderRole,
        content: dto.content,
        attachments: dto.attachments || [],
      }),
    );
    this.eventEmitter.emit('chat.new', msg);
    return msg;
  }

  async markRead(inquiryId: string) {
    await this.chatRepo.update({ inquiry_id: inquiryId, is_read: false }, { is_read: true });
  }

  private async sysMsg(inquiryId: string, content: string) {
    await this.chatRepo.save(
      this.chatRepo.create({
        inquiry_id: inquiryId,
        sender_id: 'system',
        sender_name: 'BizPrint',
        sender_role: 'system',
        content,
        is_system: true,
      }),
    );
  }

  async getSummary() {
    const [total, newC, reviewing, quoted, unread] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { status: InquiryStatus.NEW } }),
      this.repo.count({ where: { status: InquiryStatus.REVIEWING } }),
      this.repo.count({ where: { status: InquiryStatus.QUOTED } }),
      this.chatRepo.count({ where: { is_read: false, sender_role: 'customer' } }),
    ]);
    return { total, new_count: newC, reviewing, quoted, unread_messages: unread };
  }

  // ─── Vendor workflow ───
  async vendorAccept(id: string, vendorUserId: string) {
    const inquiry = await this.repo.findOne({ where: { id } });
    if (!inquiry) return null;

    await this.repo.update(id, {
      vendor_accepted: true,
      vendor_user_id: vendorUserId,
      vendor_accepted_at: new Date(),
      status: InquiryStatus.IN_WORK,
    });

    // Auto-create commission log if estimated_price exists
    const gross = Number(inquiry.estimated_price || inquiry.quoted_price || 0);
    if (gross > 0 && this.commissionService) {
      try {
        await this.commissionService.create({
          inquiryId: id,
          vendorId: vendorUserId,
          vendorName: inquiry.customer_company || undefined,
          grossAmount: gross,
        });
      } catch {}
    }

    await this.sysMsg(id, 'Vendor захиалгыг хүлээн авсан. Үйлдвэрлэлд орлоо.');
    return this.repo.findOne({ where: { id } });
  }

  async getVendorPendingCount(userId: string): Promise<number> {
    // Find vendor linked to this user
    const vendor = await this.vendorRepo.findOne({ where: { user_id: userId } }).catch(() => null);
    // Count pending inquiries either assigned to this vendor or unassigned & new
    const qb = this.repo.createQueryBuilder('i')
      .where('i.vendor_accepted = false')
      .andWhere('i.status IN (:...statuses)', {
        statuses: [InquiryStatus.NEW, InquiryStatus.REVIEWING, InquiryStatus.CONFIRMED],
      });
    if (vendor?.id) {
      qb.andWhere('(i.vendor_id = :vid OR i.vendor_id IS NULL)', { vid: vendor.id });
    }
    return qb.getCount();
  }

  async vendorReject(id: string, _vendorUserId: string) {
    await this.repo.update(id, {
      vendor_accepted: false,
      vendor_user_id: undefined as any,
      status: InquiryStatus.REVIEWING,
    });
    await this.sysMsg(id, 'Vendor захиалгыг татгалзсан. Бид өөр vendor-той холбогдоно.');
    return this.repo.findOne({ where: { id } });
  }
}
