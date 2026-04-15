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

  // ─── Phase 6: Normalize free-form product name → canonical type ───
  private normalizeProductType(input: string): string {
    const lower = (input || '').toLowerCase();
    if (lower.includes('нэрийн') || lower.includes('business')) return 'business-card';
    if (lower.includes('флаер') || lower.includes('flyer')) return 'flyer';
    if (lower.includes('баннер') || lower.includes('роллап') || lower.includes('banner')) return 'banner';
    if (lower.includes('стикер') || lower.includes('sticker')) return 'sticker';
    if (lower.includes('брошур') || lower.includes('brochure')) return 'brochure';
    if (lower.includes('постер') || lower.includes('poster')) return 'poster';
    if (lower.includes('ном') || lower.includes('book')) return 'book';
    return lower.replace(/\s+/g, '-').slice(0, 30);
  }

  // ─── Auto-assign: services match + floor price gate + SLA schedule ───
  async autoAssignVendor(inquiry: PrintInquiry): Promise<void> {
    try {
      if (inquiry.vendor_id) return; // manual assignment wins

      const productType = this.normalizeProductType(inquiry.category || inquiry.product_name || '');
      if (!productType) return;

      // Step 1: vendors with matching service and accepting orders
      // services is JSONB text[], use PG ? operator for containment
      const allAvailable = await this.vendorRepo
        .createQueryBuilder('v')
        .where('v.accepts_orders = true')
        .andWhere(`(v.status = :active OR v.status IS NULL)`, { active: 'active' })
        .orderBy('v.rating', 'DESC')
        .addOrderBy('v.total_orders', 'DESC')
        .limit(20)
        .getMany();

      // Match by services JSONB array membership (JS-side since service names vary in locale)
      const capable = allAvailable.filter(v => {
        const services: string[] = Array.isArray(v.services) ? v.services : [];
        if (services.length === 0) return true; // no service list = open to all
        return services.some(s => s.toLowerCase().includes(productType) || productType.includes(s.toLowerCase()));
      });

      // Step 2: Floor price gate — vendor net must meet their floor
      const estimatedPrice = Number((inquiry as any).estimated_price) || 0;
      const eligible = estimatedPrice > 0
        ? capable.filter(v => {
            const floors = (v.floor_prices as Record<string, number>) || {};
            const floor = Number(floors[productType] ?? floors['default'] ?? 0);
            if (floor <= 0) return true;
            const vendorNet = estimatedPrice * (1 - Number(v.commission_rate || 15) / 100);
            return vendorNet >= floor;
          })
        : capable;

      // Step 3: Fall back if no eligible — try capable pool, then any available
      const finalVendors = eligible.length > 0 ? eligible : (capable.length > 0 ? capable : allAvailable);

      if (finalVendors.length === 0) {
        this.notificationsGateway?.notifyAdmins({
          type: 'no_vendor_available',
          title: 'Vendor олдсонгүй',
          message: `"${inquiry.product_name}" захиалгад тохирох vendor алга`,
          inquiryId: inquiry.id,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const vendor = finalVendors[0];
      const slaDeadline = new Date(Date.now() + 30 * 60 * 1000);

      await this.repo.update(inquiry.id, {
        vendor_id: vendor.id,
        status: InquiryStatus.CONFIRMED,
        vendor_assigned_at: new Date(),
        vendor_sla_deadline: slaDeadline,
      });

      this.notificationsGateway?.notifyVendorNewInquiry(vendor.user_id || null, inquiry);
      if (vendor.contact_email) {
        this.mailService?.sendVendorNewInquiry(
          { email: vendor.contact_email, name: vendor.company_name },
          {
            id: inquiry.id,
            productName: inquiry.product_name || '',
            quantity: inquiry.quantity || 0,
            estimatedPrice,
            customerName: inquiry.customer_name || '',
          },
        ).catch(() => {});
      }

      await this.sysMsg(
        inquiry.id,
        `Захиалга автоматаар "${vendor.company_name}" үйлдвэрт хуваарилагдлаа`,
      );

      // Schedule SLA timeout check
      this.scheduleSLATimeout(inquiry.id, vendor);
    } catch (e: any) {
      console.error('Auto-assign failed:', e?.message);
    }
  }

  // ─── SLA timeout + re-assign ───
  private scheduleSLATimeout(inquiryId: string, vendor: Vendor) {
    const SLA_MS = 30 * 60 * 1000;
    setTimeout(() => {
      this.checkSLATimeout(inquiryId, vendor.id).catch(() => {});
    }, SLA_MS);
  }

  async checkSLATimeout(inquiryId: string, originalVendorId: string) {
    try {
      const inquiry = await this.repo.findOne({ where: { id: inquiryId } });
      if (!inquiry || inquiry.vendor_accepted) return;

      const currentReassignCount = (inquiry as any).reassign_count || 0;

      if (currentReassignCount >= 3) {
        await this.repo.update(inquiryId, {
          status: InquiryStatus.REVIEWING,
          vendor_id: undefined as any,
        });
        this.notificationsGateway?.notifyAdmins({
          type: 'sla_max_reassign',
          title: 'SLA max reassign',
          message: `Захиалга ${currentReassignCount} удаа дахин хуваарилагдсан боловч хэн ч хүлээн аваагүй. Гараар оноох шаардлагатай.`,
          inquiryId,
          timestamp: new Date().toISOString(),
        });
        await this.sysMsg(
          inquiryId,
          'Захиалга олон удаа дахин хуваарилагдсан боловч хэн ч хүлээн аваагүй. Оператор холбогдох болно.',
        );
        return;
      }

      const triedIds = [originalVendorId, (inquiry as any).sla_missed_vendor_id].filter(Boolean) as string[];
      const nextVendor = await this.findNextVendor(inquiry, triedIds);

      if (!nextVendor) {
        this.notificationsGateway?.notifyAdmins({
          type: 'no_vendor_available',
          title: 'Vendor алга',
          message: 'Захиалгад өөр vendor олдсонгүй. Гараар оноох шаардлагатай.',
          inquiryId,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await this.repo.update(inquiryId, {
        vendor_id: nextVendor.id,
        vendor_accepted: false,
        vendor_assigned_at: new Date(),
        vendor_sla_deadline: new Date(Date.now() + 30 * 60 * 1000),
        reassign_count: currentReassignCount + 1,
        sla_missed_vendor_id: originalVendorId,
      });

      this.notificationsGateway?.notifyVendorNewInquiry(nextVendor.user_id || null, inquiry);
      if (nextVendor.contact_email) {
        this.mailService?.sendVendorNewInquiry(
          { email: nextVendor.contact_email, name: nextVendor.company_name },
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
        inquiryId,
        `Захиалга "${nextVendor.company_name}" үйлдвэрт дахин хуваарилагдлаа (SLA хэтэрсэн)`,
      );

      this.scheduleSLATimeout(inquiryId, nextVendor);
    } catch (e: any) {
      console.error('SLA check failed:', e?.message);
    }
  }

  private async findNextVendor(inquiry: PrintInquiry, excludeIds: string[]): Promise<Vendor | null> {
    const productType = this.normalizeProductType(inquiry.category || inquiry.product_name || '');
    const qb = this.vendorRepo
      .createQueryBuilder('v')
      .where('v.accepts_orders = true')
      .andWhere(`(v.status = :active OR v.status IS NULL)`, { active: 'active' })
      .orderBy('v.rating', 'DESC')
      .addOrderBy('v.total_orders', 'DESC')
      .limit(10);
    if (excludeIds.length > 0) {
      qb.andWhere('v.id NOT IN (:...excludeIds)', { excludeIds });
    }
    const candidates = await qb.getMany();
    // Services match same as autoAssignVendor
    const matched = candidates.filter(v => {
      const services: string[] = Array.isArray(v.services) ? v.services : [];
      if (services.length === 0) return true;
      return services.some(s => s.toLowerCase().includes(productType) || productType.includes(s.toLowerCase()));
    });
    return matched[0] || candidates[0] || null;
  }

  // ─── Multi-vendor broadcast (race flow) ───
  async broadcastToVendors(inquiryId: string, vendorIds: string[]) {
    const inquiry = await this.repo.findOne({ where: { id: inquiryId } });
    if (!inquiry) throw new NotFoundException('Inquiry олдсонгүй');
    if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
      return { error: 'vendorIds хоосон байна' };
    }

    await this.repo.update(inquiryId, {
      is_broadcast: true,
      broadcast_vendor_ids: vendorIds,
      status: InquiryStatus.CONFIRMED,
      vendor_accepted: false,
      vendor_id: undefined as any,
    });

    for (const vendorId of vendorIds) {
      const vendor = await this.vendorRepo.findOne({ where: { id: vendorId } }).catch(() => null);
      if (!vendor) continue;
      this.notificationsGateway?.notifyVendorNewInquiry(vendor.user_id || null, { ...inquiry, is_broadcast: true });
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
    }

    await this.sysMsg(
      inquiryId,
      `Захиалга ${vendorIds.length} үйлдвэрт нэгэн зэрэг илгээгдлээ. Эхлэгч нь авна.`,
    );
    return { ok: true, vendorCount: vendorIds.length };
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

  findAll(f: { status?: string; category?: string; slaOverdue?: boolean } = {}): Promise<PrintInquiry[]> {
    const qb = this.repo.createQueryBuilder('i').orderBy('i.created_at', 'DESC');
    if (f.status) qb.andWhere('i.status = :s', { s: f.status });
    if (f.category) qb.andWhere('i.category = :c', { c: f.category });
    if (f.slaOverdue) {
      qb.andWhere('i.vendor_sla_deadline IS NOT NULL')
        .andWhere('i.vendor_sla_deadline < NOW()')
        .andWhere('i.vendor_accepted = false')
        .andWhere('i.vendor_id IS NOT NULL');
    }
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

  // ─── Vendor workflow (race-safe for broadcast) ───
  async vendorAccept(id: string, vendorUserId: string) {
    const inquiry = await this.repo.findOne({ where: { id } });
    if (!inquiry) return null;

    // Race guard: broadcast mode — first vendor wins
    if (inquiry.is_broadcast && inquiry.vendor_accepted) {
      return { error: 'Захиалгыг өөр vendor аль хэдийн хүлээн авсан байна' };
    }

    // Look up vendor row to get real vendor.id + name
    const vendor = await this.vendorRepo.findOne({ where: { user_id: vendorUserId } }).catch(() => null);

    await this.repo.update(id, {
      vendor_accepted: true,
      vendor_user_id: vendorUserId,
      vendor_id: vendor?.id || inquiry.vendor_id || undefined,
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
          vendorName: vendor?.company_name || inquiry.customer_company || undefined,
          grossAmount: gross,
        });
      } catch {}
    }

    await this.sysMsg(
      id,
      `${vendor?.company_name || 'Vendor'} захиалгыг хүлээн авлаа. Үйлдвэрлэлд орлоо.`,
    );
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
