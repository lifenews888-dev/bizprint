import { Injectable, NotFoundException, BadRequestException, Optional, ForbiddenException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { basename, extname, join } from 'path';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContactMethod, PrintInquiry, InquiryStatus } from './entities/print-inquiry.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { CommissionService } from '../commission/commission.service';
import { Vendor } from '../vendors/vendor.entity';
import { MailService } from '../mail/mail.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { QuoteEngineService } from '../quote-engine/quote-engine.service';

const ALLOWED_INQUIRY_ATTACHMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/postscript',
  'image/vnd.adobe.photoshop',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/zip',
]);
const ALLOWED_INQUIRY_UPLOAD_EXTENSIONS = new Set(['.pdf', '.ai', '.psd', '.jpg', '.jpeg', '.png', '.webp', '.eps', '.zip']);
const MAX_INQUIRY_FILE_METADATA_BYTES = 50 * 1024 * 1024;
const MAX_PRICING_SNAPSHOT_BYTES = 20_000;
const PRICING_CONTRACT_VERSION = 'pricing-golden-v1';
const WIDE_PRICING_ENGINE_ID = 'quote-engine.calculateWide';

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
    @Optional() private quoteEngine?: QuoteEngineService,
  ) {}

  private genNumber(): string {
    const y = new Date().getFullYear();
    const r = Math.floor(1000 + Math.random() * 9000);
    return `INQ-${y}-${r}`;
  }

  private sanitizeOptionalLooseId(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string' && typeof value !== 'number') return this.sanitizeLooseId(value);
    if (String(value).trim() === '') return null;
    return this.sanitizeLooseId(value);
  }

  async create(dto: Partial<PrintInquiry>): Promise<PrintInquiry> {
    const normalizedDto = {
      ...dto,
      customer_id: this.sanitizeOptionalLooseId(dto.customer_id),
      customer_name: this.sanitizeTextField(dto.customer_name),
      customer_phone: this.sanitizePhoneField(dto.customer_phone),
      customer_email: this.sanitizeEmailField(dto.customer_email),
      customer_company: this.sanitizeTextField(dto.customer_company),
      viber_number: this.sanitizePhoneField(dto.viber_number),
      product_id: this.sanitizeOptionalLooseId(dto.product_id),
      product_name: this.sanitizeTextField(dto.product_name),
      category: this.sanitizeCategoryField(dto.category),
      quantity: this.sanitizeBoundedNumber(dto.quantity, { min: 1, max: 1_000_000, integer: true }),
      size_label: this.sanitizeTextField(dto.size_label, 80),
      width_mm: this.sanitizeBoundedNumber(dto.width_mm, { min: 1, max: 100_000, integer: true }),
      height_mm: this.sanitizeBoundedNumber(dto.height_mm, { min: 1, max: 100_000, integer: true }),
      paper_type: this.sanitizeTextField(dto.paper_type),
      color_mode: this.sanitizeTextField(dto.color_mode, 80),
      sides: this.sanitizePrintSides(dto.sides),
      notes: this.sanitizeTextField(dto.notes, 5_000),
      estimated_price: this.sanitizeBoundedNumber(dto.estimated_price, { min: 0, max: 10_000_000_000, integer: true }),
      has_design: this.sanitizeBoolean(dto.has_design),
      needs_design: this.sanitizeBoolean(dto.needs_design),
      preferred_contact: this.sanitizeContactMethod(dto.preferred_contact),
      delivery_address: this.sanitizeTextField(dto.delivery_address, 500),
      delivery_district: this.sanitizeTextField(dto.delivery_district, 120),
      finishing: this.sanitizeFinishing(dto.finishing),
      files: this.sanitizeInquiryFiles(Array.isArray(dto.files) ? dto.files : []),
      pricing_snapshot: this.sanitizePricingSnapshot(dto.pricing_snapshot),
    };
    const pricedDto = await this.applyServerPricing(normalizedDto, 'create');
    const saved = await this.repo.save(
      this.repo.create({ ...pricedDto, inquiry_number: this.genNumber(), status: InquiryStatus.NEW }),
    );
    this.eventEmitter.emit('inquiry.created', saved);
    await this.sysMsg(saved.id, `Захиалгын хүсэлт #${saved.inquiry_number} хүлээн авлаа. Бид удахгүй холбогдоно.`);

    // Realtime notification to admins
    try { this.notificationsGateway?.notifyAdminNewInquiry(saved); } catch {}

    // Email admin
    this.mailService?.sendAdminNewInquiry({
      id: saved.id,
      productName: this.firstScalarText(saved.product_name, saved.category) || 'Захиалга',
      quantity: this.notificationQuantity(saved.quantity),
      estimatedPrice: this.notificationEstimatedPrice(saved.estimated_price),
      customerName: this.firstScalarText(saved.customer_name),
      customerPhone: this.firstScalarText(saved.customer_phone),
    }).catch(() => {});

    // Auto-assign to best-matching vendor (fire-and-forget, never blocks)
    this.autoAssignVendor(saved).catch(() => {});

    return saved;
  }

  private sanitizePricingSnapshot(value: unknown): Record<string, any> | null {
    if (!value || Array.isArray(value) || typeof value !== 'object') return null;
    try {
      const serialized = JSON.stringify(value);
      if (!serialized || serialized.length > MAX_PRICING_SNAPSHOT_BYTES) return null;
      const parsed = JSON.parse(serialized);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return null;
      if (this.hasUnsafeSnapshotKey(parsed)) return null;
      return parsed as Record<string, any>;
    } catch {
      return null;
    }
  }

  private hasUnsafeSnapshotKey(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    if (Array.isArray(value)) return value.some(item => this.hasUnsafeSnapshotKey(item));
    return Object.keys(value as Record<string, unknown>).some(key => (
      ['__proto__', 'prototype', 'constructor'].includes(key)
      || this.hasUnsafeSnapshotKey((value as Record<string, unknown>)[key])
    ));
  }

  private sanitizeTextField(value: unknown, max = 255): string | null {
    if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') return null;
    const text = String(value ?? '')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return text ? text.slice(0, max) : null;
  }

  private sanitizeCategoryField(value: unknown): string | null {
    const text = this.sanitizeTextField(value, 120);
    return text ? text.toLowerCase() : null;
  }

  private sanitizeEmailField(value: unknown): string | null {
    if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') return null;
    const email = String(value ?? '').trim().toLowerCase();
    if (!email || email.length > 160 || /[\r\n\t\0]/.test(email) || /[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(email)) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
  }

  private sanitizePhoneField(value: unknown): string | null {
    if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') return null;
    const phone = String(value ?? '')
      .replace(/[^\d+()\-\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40);
    return /\d/.test(phone) ? phone : null;
  }

  private sanitizeContactMethod(value: unknown): ContactMethod {
    if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') return ContactMethod.CHAT;
    const normalized = String(value || '').trim().toLowerCase();
    if (['call', 'tel', 'telephone', 'mobile', 'cell', 'phone-call'].includes(normalized)) return ContactMethod.PHONE;
    if (['mail', 'e-mail'].includes(normalized)) return ContactMethod.EMAIL;
    if (['messenger', 'dm', 'message'].includes(normalized)) return ContactMethod.CHAT;
    return Object.values(ContactMethod).includes(normalized as ContactMethod)
      ? normalized as ContactMethod
      : ContactMethod.CHAT;
  }

  private sanitizePrintSides(value: unknown): string {
    if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') return 'single';
    const normalized = String(value || '').trim().toLowerCase();
    if (['double', 'double-sided', 'duplex', '2', '2-sided', 'two-sided'].includes(normalized)) return 'double';
    if (['single', 'single-sided', 'simplex', '1', '1-sided', 'one-sided'].includes(normalized)) return 'single';
    return 'single';
  }

  private sanitizeBoolean(value: unknown): boolean {
    if (typeof value !== 'boolean' && typeof value !== 'string' && typeof value !== 'number') return false;
    return value === true || ['true', '1', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
  }

  private sanitizeBoundedNumber(
    value: unknown,
    { min, max, integer = false }: { min: number; max: number; integer?: boolean },
  ): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    const bounded = Math.min(max, Math.max(min, parsed));
    return integer ? Math.round(bounded) : bounded;
  }

  private sanitizeFinishing(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return Array.from(new Set(
      value
        .filter(item => typeof item === 'string' || typeof item === 'number')
        .map(item => String(item)
          .replace(/[\r\n\t]+/g, ' ')
          .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 120))
        .filter(Boolean),
    )).slice(0, 20);
  }

  private sanitizeInquiryFiles(files: any[]): PrintInquiry['files'] {
    if (files.length > 5) throw new BadRequestException('Файлын тоо 5-аас их байж болохгүй');
    return files.map(item => {
      const rawName = typeof item?.name === 'string' || typeof item?.name === 'number' ? item.name : 'file';
      const name = String(rawName || 'file')
        .replace(/[\r\n\t\0]/g, ' ')
        .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/[<>:"|?*\\/]/g, '_')
        .trim()
        .slice(0, 180) || 'file';
      const rawType = typeof item?.type === 'string' || typeof item?.type === 'number'
        ? String(item.type || '').trim().toLowerCase()
        : '';
      const type = ALLOWED_INQUIRY_ATTACHMENT_MIME_TYPES.has(rawType)
        ? rawType
        : 'application/octet-stream';
      const rawSize = typeof item?.size === 'string' || typeof item?.size === 'number'
        ? Number(item.size)
        : 0;
      const size = Number.isFinite(rawSize) && rawSize > 0
        ? Math.min(Math.round(rawSize), MAX_INQUIRY_FILE_METADATA_BYTES)
        : 0;
      const rawUploadedAt = typeof item?.uploaded_at === 'string' || typeof item?.uploaded_at === 'number'
        ? String(item.uploaded_at || '')
        : '';
      const uploadedAt = Number.isNaN(Date.parse(rawUploadedAt))
        ? new Date().toISOString()
        : new Date(rawUploadedAt).toISOString();
      return {
        name,
        size,
        type,
        url: this.sanitizeMessageAttachmentUrl(item?.url),
        uploaded_at: uploadedAt,
      };
    }).filter(item => item.url);
  }

  private async applyServerPricing(dto: Partial<PrintInquiry>, trigger: 'create' | 'manual_reprice' = 'create'): Promise<Partial<PrintInquiry>> {
    const type = this.normalizeProductType(this.firstScalarText(dto.category, dto.product_name));
    if (!this.quoteEngine || !['banner', 'sticker'].includes(type)) return dto;

    const widthMm = Math.min(100_000, this.parsePositiveScalarNumber(dto.width_mm));
    const heightMm = Math.min(100_000, this.parsePositiveScalarNumber(dto.height_mm));
    const quantity = Math.min(1_000_000, Math.max(1, Math.round(this.parsePositiveScalarNumber(dto.quantity) || 1)));
    const material = this.normalizeMaterialField(dto.paper_type);
    if (!widthMm || !heightMm) {
      return this.withPricingVerificationError(dto, trigger, 'missing_size', 'Хэмжээний мэдээлэл дутуу тул backend үнэ баталгаажуулсангүй');
    }
    if (!material) {
      return this.withPricingVerificationError(dto, trigger, 'missing_material', 'Материалын мэдээлэл дутуу тул backend үнэ баталгаажуулсангүй');
    }

    try {
      const clientSnapshot = dto.pricing_snapshot || null;
      const finishing = this.sanitizeFinishing(dto.finishing);
      const sides = this.sanitizePrintSides(dto.sides);
      const clientTotal = this.parsePositiveScalarNumber(
        (clientSnapshot as any)?.meta?.backendTotal
        ?? (clientSnapshot as any)?.total
        ?? dto.estimated_price
        ?? 0,
      );
      const result = await this.quoteEngine.calculateWide({
        type,
        width: widthMm / 1000,
        length: heightMm / 1000,
        quantity,
        material,
        finishing,
        sides,
        pricing_mode: 'retail',
      });
      const serverTotal = this.parsePositiveScalarNumber(result.total_price);
      if (serverTotal <= 0) {
        return this.withPricingVerificationError(
          dto,
          trigger,
          'invalid_server_total',
          'Backend үнийн тооцоолол 0 эсвэл буруу дүн буцаалаа',
        );
      }
      const serverUnitPrice = this.parsePositiveScalarNumber(result.unit_price);
      const serverDelta = serverTotal - clientTotal;
      const serverDeltaPct = clientTotal > 0 ? Math.round((serverDelta / clientTotal) * 10000) / 100 : null;
      const absDeltaPct = Math.abs(serverDeltaPct || 0);
      const serverDeltaSeverity = absDeltaPct >= 10 ? 'critical' : absDeltaPct >= 1 ? 'warning' : serverDelta !== 0 ? 'minor' : 'none';

      return {
        ...dto,
        estimated_price: serverTotal,
        pricing_snapshot: {
          ...(dto.pricing_snapshot || {}),
          clientSnapshot,
          clientTotal,
          serverDelta,
          serverDeltaPct,
          serverDeltaSeverity,
          source: 'server',
          verifiedBy: 'backend',
          pricingContractVersion: PRICING_CONTRACT_VERSION,
          pricingEngine: WIDE_PRICING_ENGINE_ID,
          pricingTrigger: trigger,
          total: serverTotal,
          unitPrice: serverUnitPrice,
          breakdown: this.normalizePricingBreakdown(result.breakdown),
          product: {
            id: this.firstScalarText(dto.product_id) || null,
            name: this.firstScalarText(dto.product_name),
            category: type,
          },
          spec: {
            quantity,
            sizeLabel: this.firstScalarText(dto.size_label),
            widthMm,
            heightMm,
            material,
            colorMode: this.firstScalarText(dto.color_mode),
            sides,
            finishing,
          },
          serverResult: {
            materialKey: this.sanitizeTextField(result.material_key, 120),
            materialName: this.sanitizeTextField(result.material_name, 180),
            areaM2: this.parseNonNegativeScalarNumber(result.area_m2),
            billableAreaM2: this.parseNonNegativeScalarNumber(result.billable_area_m2),
            materialRateM2: this.parseNonNegativeScalarNumber(result.material_rate_m2),
            printRateM2: this.parseNonNegativeScalarNumber(result.print_rate_m2),
            wastePct: this.parseNonNegativeScalarNumber(result.waste_pct),
            sideMultiplier: this.parseNonNegativeScalarNumber(result.side_multiplier),
          },
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (e: any) {
      console.error('Inquiry server pricing failed:', e?.message);
      return this.withPricingVerificationError(
        dto,
        trigger,
        'pricing_engine_error',
        'Backend үнийн тооцоолол амжилтгүй боллоо',
      );
    }
  }

  // ─── Phase 6: Normalize free-form product name → canonical type ───
  private withPricingVerificationError(
    dto: Partial<PrintInquiry>,
    trigger: 'create' | 'manual_reprice',
    code: string,
    message: string,
  ): Partial<PrintInquiry> {
    return {
      ...dto,
      pricing_snapshot: {
        ...(dto.pricing_snapshot || {}),
        source: (dto.pricing_snapshot as any)?.source || 'unverified',
        verifiedBy: 'backend',
        pricingContractVersion: PRICING_CONTRACT_VERSION,
        pricingEngine: WIDE_PRICING_ENGINE_ID,
        pricingTrigger: trigger,
        verificationError: code,
        verificationMessage: message,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private normalizeMaterialField(value: unknown): string {
    return this.sanitizeTextField(value, 180)?.replace(/\s+/g, ' ') || '';
  }

  private parsePositiveScalarNumber(value: unknown): number {
    if (typeof value !== 'string' && typeof value !== 'number') return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  private notificationQuantity(value: unknown): number {
    return Math.round(this.parsePositiveScalarNumber(value));
  }

  private notificationEstimatedPrice(value: unknown): number {
    return this.parsePositiveScalarNumber(value);
  }

  private normalizedReassignCount(value: unknown): number {
    return Math.max(0, Math.round(this.parsePositiveScalarNumber(value)));
  }

  private parseQuoteAmount(value: unknown): number {
    const parsed = this.parsePositiveScalarNumber(value);
    if (parsed <= 0) {
      throw new BadRequestException('Үнийн саналын дүн 0-ээс их тоо байх ёстой');
    }
    const rounded = Math.round(parsed);
    if (rounded > 10_000_000_000) {
      throw new BadRequestException('Үнийн саналын дүн хэт өндөр байна');
    }
    return rounded;
  }

  private parseScalarNumber(value: unknown): number | null {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private safeDateField(value: unknown): Date | undefined {
    return value instanceof Date && !Number.isNaN(value.getTime()) ? value : undefined;
  }

  private parseNonNegativeScalarNumber(value: unknown): number | null {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  private normalizePricingBreakdown(value: unknown): Record<string, number | null> {
    const source = value && !Array.isArray(value) && typeof value === 'object'
      ? value as Record<string, unknown>
      : {};
    return {
      material: this.parseNonNegativeScalarNumber(source.material),
      print: this.parseNonNegativeScalarNumber(source.print),
      finishing: this.parseNonNegativeScalarNumber(source.finishing),
      setup: this.parseNonNegativeScalarNumber(source.setup),
      rush: this.parseNonNegativeScalarNumber(source.rush),
      vat: this.parseNonNegativeScalarNumber(source.vat),
    };
  }

  private firstScalarText(...values: unknown[]): string {
    for (const value of values) {
      if (typeof value !== 'string' && typeof value !== 'number') continue;
      const text = this.sanitizeTextField(value);
      if (text) return text;
    }
    return '';
  }

  private normalizeProductType(input: unknown): string {
    if (typeof input !== 'string' && typeof input !== 'number') return '';
    const lower = this.sanitizeTextField(input)?.toLowerCase() || '';
    const compact = lower.replace(/[\s_-]+/g, '');
    const has = (...terms: string[]) => terms.some(term => {
      const normalizedTerm = term.toLowerCase();
      const compactTerm = normalizedTerm.replace(/[\s_-]+/g, '');
      return lower.includes(normalizedTerm) || compact.includes(compactTerm);
    });
    if (has('нэрийн', 'business')) return 'business-card';
    if (has('флаер', 'flyer')) return 'flyer';
    if (has('баннер', 'роллап', 'rollup', 'roll up', 'өргөн хэвлэл', 'banner')) return 'banner';
    if (has('стикер', 'наалт', 'sticker')) return 'sticker';
    if (has('брошур', 'brochure')) return 'brochure';
    if (has('постер', 'poster')) return 'poster';
    if (has('ном', 'каталог', 'book')) return 'book';
    return lower.replace(/[\s_]+/g, '-').slice(0, 30);
  }

  // ─── Auto-assign: services match + floor price gate + SLA schedule ───
  async autoAssignVendor(inquiry: PrintInquiry): Promise<void> {
    try {
      const safeInquiryId = this.safeLooseIdOrNull(inquiry.id);
      if (!safeInquiryId) return;
      if (this.safeLooseIdOrNull(inquiry.vendor_id)) return; // manual assignment wins

      const productType = this.normalizeProductType(this.firstScalarText(inquiry.category, inquiry.product_name));
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
      const assignableVendors = allAvailable.filter(v => this.isAssignableVendor(v));

      // Match by services JSONB array membership (JS-side since service names vary in locale)
      const capable = assignableVendors.filter(v => {
        const services: string[] = Array.isArray(v.services) ? v.services : [];
        if (services.length === 0) return true; // no service list = open to all
        return this.vendorServicesMatchProduct(services, productType);
      });

      // Step 2: Floor price gate — vendor net must meet their floor
      const estimatedPrice = this.getInquiryVendorFloorPrice(inquiry);
      const eligible = capable.filter(v => this.vendorMeetsFloorPrice(v, productType, estimatedPrice));

      // Do not bypass vendor service or floor-price gates.
      const finalVendors = eligible;

      if (finalVendors.length === 0) {
        const productName = this.firstScalarText(inquiry.product_name, inquiry.category) || 'Захиалга';
        this.notificationsGateway?.notifyAdmins({
          type: 'no_vendor_available',
          title: 'Vendor олдсонгүй',
          message: `"${productName}" захиалгад тохирох vendor алга`,
          inquiryId: safeInquiryId,
          timestamp: new Date().toISOString(),
        });
        await this.sysMsg(
          safeInquiryId,
          'Захиалга хүлээн авлаа. Оператор тохирох үйлдвэртэй холбож өгнө.',
        );
        return;
      }

      const vendor = finalVendors[0];
      const slaDeadline = new Date(Date.now() + 30 * 60 * 1000);

      await this.repo.update(safeInquiryId, {
        vendor_id: vendor.id,
        status: InquiryStatus.REVIEWING,
        vendor_assigned_at: new Date(),
        vendor_sla_deadline: slaDeadline,
      });

      this.notificationsGateway?.notifyVendorNewInquiry(this.safeVendorRealtimeUserId(vendor), { ...inquiry, id: safeInquiryId });
      const vendorEmail = this.safeVendorContactEmail(vendor);
      const vendorName = this.safeVendorDisplayName(vendor);
      if (vendorEmail) {
        this.mailService?.sendVendorNewInquiry(
          { email: vendorEmail, name: vendorName },
          {
            id: safeInquiryId,
            productName: this.firstScalarText(inquiry.product_name),
            quantity: this.notificationQuantity(inquiry.quantity),
            estimatedPrice,
            customerName: this.firstScalarText(inquiry.customer_name),
          },
        ).catch(() => {});
      }
      await this.sysMsg(
        safeInquiryId,
        `Захиалга автоматаар "${vendorName}" үйлдвэрт хуваарилагдлаа`,
      );

      // Schedule SLA timeout check
      this.scheduleSLATimeout(safeInquiryId, vendor);
    } catch (e: any) {
      console.error('Auto-assign failed:', e?.message);
    }
  }

  private isAssignableVendor(vendor: Partial<Vendor> | null | undefined): boolean {
    if (!vendor?.id) return false;
    try {
      this.sanitizeLooseId(vendor.id);
    } catch {
      return false;
    }
    if (!this.sanitizeTextField(vendor.company_name, 120)) return false;
    return !!(this.safeVendorRealtimeUserId(vendor) || this.safeVendorContactEmail(vendor));
  }

  private safeVendorRealtimeUserId(vendor: Partial<Vendor> | null | undefined): string | null {
    if (!vendor?.user_id) return null;
    try {
      return this.sanitizeVendorUserId(vendor.user_id);
    } catch {
      return null;
    }
  }

  private safeVendorContactEmail(vendor: Partial<Vendor> | null | undefined): string | null {
    return this.sanitizeEmailField(vendor?.contact_email);
  }

  private safeVendorDisplayName(vendor: Partial<Vendor> | null | undefined): string {
    return this.sanitizeTextField(vendor?.company_name, 120) || 'Vendor';
  }

  private sanitizeVendorUserId(userId: unknown): string {
    if (typeof userId !== 'string' && typeof userId !== 'number') {
      throw new BadRequestException('Vendor хэрэглэгчийн ID буруу байна');
    }
    const safeUserId = String(userId || '').trim();
    if (!safeUserId || safeUserId.length > 120 || /[\\/\r\n\t\0]/.test(safeUserId) || /[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(safeUserId)) {
      throw new BadRequestException('Vendor хэрэглэгчийн ID буруу байна');
    }
    return safeUserId;
  }

  private async getVendorByUserId(userId: unknown): Promise<Vendor> {
    const safeUserId = this.sanitizeVendorUserId(userId);
    const vendor = await this.vendorRepo.findOne({ where: { user_id: safeUserId } }).catch(() => null);
    if (!vendor?.id) throw new ForbiddenException('Vendor бүртгэл олдсонгүй');
    let safeVendorId: string;
    let safeVendorUserId: string;
    try {
      safeVendorId = this.sanitizeLooseId(vendor.id);
      safeVendorUserId = this.sanitizeVendorUserId(vendor.user_id);
    } catch {
      throw new ForbiddenException('Vendor бүртгэл олдсонгүй');
    }
    if (safeVendorUserId !== safeUserId) {
      throw new ForbiddenException('Vendor бүртгэл олдсонгүй');
    }
    return { ...vendor, id: safeVendorId, user_id: safeVendorUserId } as Vendor;
  }

  private canVendorAccessInquiry(inquiry: PrintInquiry, vendor: Vendor): boolean {
    const vendorUserId = this.safeLooseIdOrNull(inquiry.vendor_user_id);
    const vendorId = this.safeLooseIdOrNull(inquiry.vendor_id);
    if (vendorUserId && vendorUserId === vendor.user_id) return true;
    if (vendorId && vendorId === vendor.id) return true;
    if (inquiry.is_broadcast) {
      return this.normalizedBroadcastVendorIds(inquiry).includes(vendor.id);
    }
    return !vendorId;
  }

  private safeLooseIdOrNull(value: unknown): string | null {
    try {
      return this.sanitizeOptionalLooseId(value);
    } catch {
      return null;
    }
  }

  private normalizedBroadcastVendorIds(inquiry: Partial<PrintInquiry> | null | undefined): string[] {
    if (!Array.isArray(inquiry?.broadcast_vendor_ids)) return [];
    return Array.from(new Set(
      inquiry.broadcast_vendor_ids
        .map(vendorId => {
          try {
            return this.sanitizeLooseId(vendorId);
          } catch {
            return '';
          }
        })
        .filter(Boolean),
    )).slice(0, 50);
  }

  // ─── SLA timeout + re-assign ───
  private scheduleSLATimeout(inquiryId: string, vendor: Vendor) {
    const SLA_MS = 30 * 60 * 1000;
    setTimeout(() => {
      this.checkSLATimeout(inquiryId, vendor.id).catch(() => {});
    }, SLA_MS);
  }

  async checkSLATimeout(inquiryId: unknown, originalVendorId: unknown) {
    const safeInquiryId = this.sanitizeLooseId(inquiryId);
    const safeOriginalVendorId = this.sanitizeLooseId(originalVendorId);
    if (!isUUID(safeInquiryId)) throw new BadRequestException('Буруу ID формат');
    try {
      const inquiry = await this.repo.findOne({ where: { id: safeInquiryId } });
      if (!inquiry || inquiry.vendor_accepted) return;
      const currentVendorId = this.safeLooseIdOrNull(inquiry.vendor_id);
      if (currentVendorId !== safeOriginalVendorId) return;

      const currentReassignCount = this.normalizedReassignCount((inquiry as any).reassign_count);

      if (currentReassignCount >= 3) {
        await this.repo.update(safeInquiryId, {
          status: InquiryStatus.REVIEWING,
          vendor_id: undefined as any,
        });
        this.notificationsGateway?.notifyAdmins({
          type: 'sla_max_reassign',
          title: 'SLA max reassign',
          message: `Захиалга ${currentReassignCount} удаа дахин хуваарилагдсан боловч хэн ч хүлээн аваагүй. Гараар оноох шаардлагатай.`,
          inquiryId: safeInquiryId,
          timestamp: new Date().toISOString(),
        });
        await this.sysMsg(
          safeInquiryId,
          'Захиалга олон удаа дахин хуваарилагдсан боловч хэн ч хүлээн аваагүй. Оператор холбогдох болно.',
        );
        return;
      }

      const triedIds = [safeOriginalVendorId, (inquiry as any).sla_missed_vendor_id].filter(Boolean) as string[];
      const nextVendor = await this.findNextVendor(inquiry, triedIds);

      if (!nextVendor) {
        this.notificationsGateway?.notifyAdmins({
          type: 'no_vendor_available',
          title: 'Vendor алга',
          message: 'Захиалгад өөр vendor олдсонгүй. Гараар оноох шаардлагатай.',
          inquiryId: safeInquiryId,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await this.repo.update(safeInquiryId, {
        vendor_id: nextVendor.id,
        vendor_accepted: false,
        vendor_assigned_at: new Date(),
        vendor_sla_deadline: new Date(Date.now() + 30 * 60 * 1000),
        reassign_count: currentReassignCount + 1,
        sla_missed_vendor_id: safeOriginalVendorId,
      });

      this.notificationsGateway?.notifyVendorNewInquiry(this.safeVendorRealtimeUserId(nextVendor), { ...inquiry, id: safeInquiryId });
      const nextVendorEmail = this.safeVendorContactEmail(nextVendor);
      const nextVendorName = this.safeVendorDisplayName(nextVendor);
      if (nextVendorEmail) {
        this.mailService?.sendVendorNewInquiry(
          { email: nextVendorEmail, name: nextVendorName },
          {
            id: safeInquiryId,
            productName: this.firstScalarText(inquiry.product_name),
            quantity: this.notificationQuantity(inquiry.quantity),
            estimatedPrice: this.notificationEstimatedPrice((inquiry as any).estimated_price),
            customerName: this.firstScalarText(inquiry.customer_name),
          },
        ).catch(() => {});
      }

      await this.sysMsg(
        safeInquiryId,
        `Захиалга "${nextVendorName}" үйлдвэрт дахин хуваарилагдлаа (SLA хэтэрсэн)`,
      );

      this.scheduleSLATimeout(safeInquiryId, nextVendor);
    } catch (e: any) {
      console.error('SLA check failed:', e?.message);
    }
  }

  private async findNextVendor(inquiry: PrintInquiry, excludeIds: string[]): Promise<Vendor | null> {
    const productType = this.normalizeProductType(this.firstScalarText(inquiry.category, inquiry.product_name));
    const safeExcludeIds = Array.from(new Set((excludeIds || []).map(id => {
      try {
        return this.sanitizeLooseId(id);
      } catch {
        return '';
      }
    }).filter(Boolean))).slice(0, 50);
    const qb = this.vendorRepo
      .createQueryBuilder('v')
      .where('v.accepts_orders = true')
      .andWhere(`(v.status = :active OR v.status IS NULL)`, { active: 'active' })
      .orderBy('v.rating', 'DESC')
      .addOrderBy('v.total_orders', 'DESC')
      .limit(10);
    if (safeExcludeIds.length > 0) {
      qb.andWhere('v.id NOT IN (:...excludeIds)', { excludeIds: safeExcludeIds });
    }
    const candidates = (await qb.getMany()).filter(v => this.isAssignableVendor(v));
    // Services match same as autoAssignVendor
    const matched = candidates.filter(v => {
      const services: string[] = Array.isArray(v.services) ? v.services : [];
      if (services.length === 0) return true;
      return this.vendorServicesMatchProduct(services, productType);
    });
    const estimatedPrice = this.getInquiryVendorFloorPrice(inquiry);
    const eligible = matched.filter(v => this.vendorMeetsFloorPrice(v, productType, estimatedPrice));
    return eligible[0] || null;
  }

  private vendorServicesMatchProduct(services: unknown[], productType: string): boolean {
    const safeProductType = this.normalizeServiceMatchText(productType);
    if (!safeProductType) return false;
    const compactProductType = safeProductType.replace(/[\s_-]+/g, '');
    return services.some(service => {
      if (typeof service !== 'string') return false;
      const normalized = this.normalizeServiceMatchText(service);
      const compactService = normalized.replace(/[\s_-]+/g, '');
      return !!normalized && (
        normalized.includes(safeProductType)
        || safeProductType.includes(normalized)
        || compactService.includes(compactProductType)
        || compactProductType.includes(compactService)
      );
    });
  }

  private normalizeServiceMatchText(value: unknown): string {
    return this.sanitizeTextField(value, 120)?.toLowerCase() || '';
  }

  private vendorCanServeProduct(vendor: Partial<Vendor>, productType: string): boolean {
    const services = Array.isArray(vendor.services) ? vendor.services : [];
    if (services.length === 0 || !String(productType || '').trim()) return true;
    return this.vendorServicesMatchProduct(services, productType);
  }

  private getVendorFloorPrice(vendor: Partial<Vendor>, productType: string): number {
    const floors = vendor.floor_prices;
    if (!floors || Array.isArray(floors) || typeof floors !== 'object') return 0;
    const safeProductType = this.normalizeServiceMatchText(productType);
    const compactProductType = safeProductType.replace(/[\s_-]+/g, '');
    const normalizedFloors = Object.entries(floors as Record<string, unknown>).reduce((acc, [key, value]) => {
      const safeKey = this.normalizeServiceMatchText(key);
      if (typeof value !== 'string' && typeof value !== 'number') return acc;
      const parsed = Number(value);
      if (safeKey && Number.isFinite(parsed) && parsed > 0) {
        acc[safeKey] = parsed;
        acc[safeKey.replace(/[\s_-]+/g, '')] = parsed;
      }
      return acc;
    }, {} as Record<string, number>);
    return Number(normalizedFloors[safeProductType] ?? normalizedFloors[compactProductType] ?? normalizedFloors.default ?? 0);
  }

  // ─── Multi-vendor broadcast (race flow) ───
  private vendorMeetsFloorPrice(vendor: Partial<Vendor>, productType: string, estimatedPrice: number): boolean {
    const floor = this.getVendorFloorPrice(vendor, productType);
    if (floor <= 0) return true;
    if (!Number.isFinite(estimatedPrice) || estimatedPrice <= 0) return false;
    const vendorNet = estimatedPrice * (1 - this.getVendorCommissionRate(vendor) / 100);
    return vendorNet >= floor;
  }

  private getVendorCommissionRate(vendor: Partial<Vendor>): number {
    if (typeof vendor.commission_rate !== 'string' && typeof vendor.commission_rate !== 'number') return 15;
    const parsed = Number(vendor.commission_rate);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : 15;
  }

  private getInquiryVendorFloorPrice(inquiry: Partial<PrintInquiry> | null | undefined): number {
    const prices = [inquiry?.quoted_price, inquiry?.estimated_price, inquiry?.pricing_snapshot?.total]
      .filter(value => typeof value === 'string' || typeof value === 'number')
      .map(value => Number(value));
    return prices.find(value => Number.isFinite(value) && value > 0) || 0;
  }

  async broadcastToVendors(inquiryId: unknown, vendorIds: unknown) {
    const safeInquiryId = this.sanitizeLooseId(inquiryId);
    if (!isUUID(safeInquiryId)) throw new BadRequestException('Буруу ID формат');
    if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
      return { error: 'vendorIds хоосон байна' };
    }
    if (vendorIds.length > 50) {
      return { error: 'vendorIds 50-аас их байж болохгүй' };
    }
    const inquiry = await this.repo.findOne({ where: { id: safeInquiryId } });
    if (!inquiry) throw new NotFoundException('Захиалга олдсонгүй');
    if ([InquiryStatus.IN_WORK, InquiryStatus.COMPLETED, InquiryStatus.CANCELLED].includes(inquiry.status)) {
      throw new BadRequestException('Ажил эхэлсэн, дууссан эсвэл цуцлагдсан захиалгыг broadcast хийх боломжгүй');
    }
    const normalizedVendorIds = Array.from(new Set(
      vendorIds
        .map(vendorId => {
          try {
            return this.sanitizeLooseId(vendorId);
          } catch {
            return '';
          }
        })
        .filter(Boolean),
    )).slice(0, 50);
    if (normalizedVendorIds.length === 0) {
      return { error: 'vendorIds хоосон байна' };
    }
    const requestedVendorCount = vendorIds.length;
    const productType = this.normalizeProductType(this.firstScalarText(inquiry.category, inquiry.product_name));
    const estimatedPrice = this.getInquiryVendorFloorPrice(inquiry);
    const targetVendors: Vendor[] = [];
    for (const vendorId of normalizedVendorIds) {
      const vendor = await this.vendorRepo.findOne({ where: { id: vendorId } }).catch(() => null);
      if (
        this.isAssignableVendor(vendor)
        && this.vendorCanServeProduct(vendor as Vendor, productType)
        && this.vendorMeetsFloorPrice(vendor as Vendor, productType, estimatedPrice)
      ) {
        targetVendors.push(vendor as Vendor);
      }
    }
    if (targetVendors.length === 0) {
      throw new BadRequestException('Илгээх боломжтой vendor олдсонгүй');
    }
    const assignableVendorIds = targetVendors.map(vendor => vendor.id);

    await this.repo.update(safeInquiryId, {
      is_broadcast: true,
      broadcast_vendor_ids: assignableVendorIds,
      status: InquiryStatus.REVIEWING,
      vendor_accepted: false,
      vendor_id: undefined as any,
    });

    for (const vendor of targetVendors) {
      this.notificationsGateway?.notifyVendorNewInquiry(this.safeVendorRealtimeUserId(vendor), { ...inquiry, id: safeInquiryId, is_broadcast: true });
      const vendorEmail = this.safeVendorContactEmail(vendor);
      const vendorName = this.safeVendorDisplayName(vendor);
      if (vendorEmail) {
        this.mailService?.sendVendorNewInquiry(
          { email: vendorEmail, name: vendorName },
          {
            id: safeInquiryId,
            productName: this.firstScalarText(inquiry.product_name),
            quantity: this.notificationQuantity(inquiry.quantity),
            estimatedPrice: this.notificationEstimatedPrice((inquiry as any).estimated_price),
            customerName: this.firstScalarText(inquiry.customer_name),
          },
        ).catch(() => {});
      }
    }

    await this.sysMsg(
      safeInquiryId,
      `Захиалга ${assignableVendorIds.length} үйлдвэрт нэгэн зэрэг илгээгдлээ. Эхлэгч нь авна.`,
    );
    return {
      ok: true,
      vendorCount: assignableVendorIds.length,
      eligibleVendorCount: normalizedVendorIds.length,
      requestedVendorCount,
      skippedVendorCount: requestedVendorCount - assignableVendorIds.length,
    };
  }

  // ─── Admin: assign an inquiry to a specific vendor ───
  async assignVendor(inquiryId: unknown, vendorId: unknown, note?: unknown) {
    const safeInquiryId = this.sanitizeLooseId(inquiryId);
    let safeVendorId = '';
    try {
      safeVendorId = this.sanitizeLooseId(vendorId);
    } catch {
      throw new BadRequestException('Vendor ID буруу байна');
    }
    const vendor = await this.vendorRepo.findOne({ where: { id: safeVendorId } });
    if (!vendor) throw new NotFoundException('Vendor олдсонгүй');
    if (!this.isAssignableVendor(vendor)) {
      throw new BadRequestException('Vendor холбогдох мэдээлэл дутуу байна');
    }

    const existingInquiry = await this.repo.findOne({ where: { id: safeInquiryId } });
    if (!existingInquiry) throw new NotFoundException('Захиалга олдсонгүй');
    if ([InquiryStatus.IN_WORK, InquiryStatus.COMPLETED, InquiryStatus.CANCELLED].includes(existingInquiry.status)) {
      throw new BadRequestException('Ажил эхэлсэн, дууссан эсвэл цуцлагдсан захиалгыг дахин оноох боломжгүй');
    }
    const estimatedPrice = this.getInquiryVendorFloorPrice(existingInquiry);
    const productType = this.normalizeProductType(this.firstScalarText(existingInquiry?.category, existingInquiry?.product_name));
    if (!this.vendorCanServeProduct(vendor, productType)) {
      throw new BadRequestException('Vendor энэ бүтээгдэхүүний төрлийг хийх үйлчилгээтэй биш байна');
    }
    if (
      estimatedPrice > 0
      && !this.vendorMeetsFloorPrice(
        vendor,
        productType,
        estimatedPrice,
      )
    ) {
      throw new BadRequestException('Vendor доод үнэ захиалгын үнээс өндөр байна');
    }

    await this.repo.update(safeInquiryId, {
      vendor_id: safeVendorId,
      status: InquiryStatus.REVIEWING,
    });

    const safeVendorName = this.safeVendorDisplayName(vendor);
    const safeNote = this.sanitizeTextField(note, 1_000);
    await this.sysMsg(
      safeInquiryId,
      `Захиалга "${safeVendorName}" үйлдвэрт хуваарилагдлаа${safeNote ? ': ' + safeNote : ''}`,
    );

    // Notify vendor (email + realtime)
    const inquiry = existingInquiry;
    this.notificationsGateway?.notifyVendorNewInquiry(this.safeVendorRealtimeUserId(vendor), { ...inquiry, id: safeInquiryId });
    const vendorEmail = this.safeVendorContactEmail(vendor);
    if (vendorEmail) {
      this.mailService?.sendVendorNewInquiry(
        { email: vendorEmail, name: safeVendorName },
        {
          id: safeInquiryId,
          productName: this.firstScalarText(inquiry?.product_name),
          quantity: this.notificationQuantity(inquiry?.quantity),
          estimatedPrice: this.notificationEstimatedPrice((inquiry as any)?.estimated_price),
          customerName: this.firstScalarText(inquiry?.customer_name),
        },
      ).catch(() => {});
    }

    return inquiry;
  }

  findAll(f: unknown = {}): Promise<PrintInquiry[]> {
    const filters = f && !Array.isArray(f) && typeof f === 'object'
      ? f as Record<string, unknown>
      : {};
    const requestedStatus = this.normalizeFilterToken(filters.status);
    const requestedPricingDeltaSeverity = this.normalizeFilterToken(filters.pricingDeltaSeverity);
    const requestedPricingUnverifiedReason = this.normalizeFilterToken(filters.pricingUnverifiedReason);
    const status = Object.values(InquiryStatus).includes(requestedStatus as InquiryStatus)
      ? requestedStatus as InquiryStatus
      : undefined;
    const category = this.sanitizeCategoryField(filters.category);
    const slaOverdue = this.isTrueFlag(filters.slaOverdue);
    const pricingDelta = this.isTrueFlag(filters.pricingDelta);
    const pricingVerified = this.isTrueFlag(filters.pricingVerified);
    const pricingUnverified = this.isTrueFlag(filters.pricingUnverified);
    const pricingManualReview = this.isTrueFlag(filters.pricingManualReview);
    const pricingSnapshotMissing = this.isTrueFlag(filters.pricingSnapshotMissing);
    const pricingActionRequired = this.isTrueFlag(filters.pricingActionRequired);
    const pricingDeltaSeverity = ['minor', 'warning', 'critical'].includes(requestedPricingDeltaSeverity)
      ? requestedPricingDeltaSeverity
      : undefined;
    const pricingUnverifiedReason = ['missing_size', 'missing_material'].includes(requestedPricingUnverifiedReason)
      ? requestedPricingUnverifiedReason
      : undefined;
    const qb = this.repo.createQueryBuilder('i').orderBy('i.created_at', 'DESC');
    if (status) qb.andWhere('i.status = :s', { s: status });
    if (category) qb.andWhere('i.category = :c', { c: category });
    if (pricingVerified) {
      qb.andWhere("i.pricing_snapshot ->> 'verifiedBy' = :verifiedBy", { verifiedBy: 'backend' })
        .andWhere("ABS(COALESCE((i.pricing_snapshot ->> 'serverDelta')::numeric, 0)) = 0")
        .andWhere("COALESCE(i.pricing_snapshot ->> 'verificationError', '') = ''");
    }
    if (pricingUnverified) {
      qb.andWhere("COALESCE(i.pricing_snapshot ->> 'verificationError', '') <> ''");
      if (pricingUnverifiedReason) {
        qb.andWhere("i.pricing_snapshot ->> 'verificationError' = :pricingUnverifiedReason", {
          pricingUnverifiedReason,
        });
      }
    }
    if (pricingDelta) {
      qb.andWhere("i.pricing_snapshot ->> 'verifiedBy' = :verifiedBy", { verifiedBy: 'backend' })
        .andWhere("ABS(COALESCE((i.pricing_snapshot ->> 'serverDelta')::numeric, 0)) > 0");
      if (pricingDeltaSeverity) {
        qb.andWhere("i.pricing_snapshot ->> 'serverDeltaSeverity' = :pricingDeltaSeverity", {
          pricingDeltaSeverity,
        });
      }
    }
    if (pricingManualReview) {
      qb.andWhere('i.pricing_snapshot IS NOT NULL')
        .andWhere("COALESCE(i.pricing_snapshot ->> 'verifiedBy', '') <> :verifiedBy", { verifiedBy: 'backend' })
        .andWhere("COALESCE(i.pricing_snapshot ->> 'verificationError', '') = ''");
    }
    if (pricingSnapshotMissing) {
      qb.andWhere('i.pricing_snapshot IS NULL')
        .andWhere('COALESCE(i.estimated_price, 0) > 0');
    }
    if (pricingActionRequired) {
      const condition = this.pricingActionRequiredCondition();
      qb.andWhere(condition.sql, condition.params);
    }
    if (slaOverdue) {
      qb.andWhere('i.vendor_sla_deadline IS NOT NULL')
        .andWhere('i.vendor_sla_deadline < NOW()')
        .andWhere('i.vendor_accepted = false')
        .andWhere('i.vendor_id IS NOT NULL');
    }
    return qb.getMany();
  }

  private isTrueFlag(value: unknown): boolean {
    if (value === true) return true;
    if (typeof value !== 'string' && typeof value !== 'number') return false;
    return ['true', '1', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
  }

  private normalizeFilterToken(value: unknown): string {
    if (typeof value !== 'string' && typeof value !== 'number') return '';
    return String(value || '').trim().toLowerCase();
  }

  private pricingActionRequiredCondition() {
    return {
      sql: `(
        (i.pricing_snapshot IS NOT NULL AND COALESCE(i.pricing_snapshot ->> 'verifiedBy', '') <> :verifiedBy)
        OR (i.pricing_snapshot ->> 'verifiedBy' = :verifiedBy AND ABS(COALESCE((i.pricing_snapshot ->> 'serverDelta')::numeric, 0)) > 0)
        OR COALESCE(i.pricing_snapshot ->> 'verificationError', '') <> ''
        OR (i.pricing_snapshot IS NULL AND COALESCE(i.estimated_price, 0) > 0)
      )`,
      params: { verifiedBy: 'backend' },
    };
  }

  findByCustomer(cid: unknown) {
    const safeCustomerId = this.sanitizeLooseId(cid);
    return this.repo.find({ where: { customer_id: safeCustomerId }, order: { created_at: 'DESC' } });
  }

  async trackByNumber(inquiryNumber: unknown) {
    if (typeof inquiryNumber !== 'string' && typeof inquiryNumber !== 'number') return { found: false };
    const safeNumber = String(inquiryNumber || '').trim().toUpperCase();
    if (safeNumber.length > 32) return { found: false };
    if (!/^INQ-(?:\d{3,}|\d{4}-\d{3,})$/.test(safeNumber)) return { found: false };
    const item = await this.repo.findOne({ where: { inquiry_number: safeNumber } });
    if (!item) return { found: false };
    const safeStatus = Object.values(InquiryStatus).includes(item.status as InquiryStatus)
      ? item.status
      : undefined;
    return {
      found: true,
      inquiry_number: this.firstScalarText(item.inquiry_number) || safeNumber,
      status: safeStatus,
      product_name: this.firstScalarText(item.product_name),
      created_at: this.safeDateField(item.created_at),
      quoted_price: this.parsePositiveScalarNumber(item.quoted_price) || null,
    };
  }

  private isAdminUser(user?: any): boolean {
    return user?.role === 'admin' || user?.role === 'superadmin';
  }

  private async canReadFullInquiry(inquiry: PrintInquiry, user?: any): Promise<boolean> {
    if (!user?.id) return false;
    let safeUserId = '';
    try {
      safeUserId = this.sanitizeLooseId(user.id);
    } catch {
      return false;
    }
    if (this.isAdminUser(user)) return true;
    if (this.safeLooseIdOrNull(inquiry.customer_id) === safeUserId) return true;
    if (this.safeLooseIdOrNull(inquiry.vendor_user_id) === safeUserId) return true;
    const vendor = await this.getVendorByUserId(safeUserId).catch(() => null);
    return !!vendor && this.canVendorAccessInquiry(inquiry, vendor);
  }

  private sanitizeInquiryUploadFilename(filename: unknown): string {
    if (typeof filename !== 'string' && typeof filename !== 'number') {
      throw new BadRequestException('Файлын нэр буруу байна');
    }
    const rawName = String(filename || '');
    if (!rawName || rawName.length > 220) {
      throw new BadRequestException('Файлын нэр буруу байна');
    }
    let decodedName = rawName;
    try {
      decodedName = decodeURIComponent(rawName);
    } catch {
      throw new BadRequestException('Файлын нэр буруу байна');
    }
    if (decodedName.length > 180 || /[\0-\x1F\x7F]/.test(decodedName)) {
      throw new BadRequestException('Файлын нэр буруу байна');
    }
    const safeName = basename(decodedName);
    if (
      !safeName
      || safeName !== decodedName
      || !/^[\w .-]+$/.test(safeName)
      || !ALLOWED_INQUIRY_UPLOAD_EXTENSIONS.has(extname(safeName).toLowerCase())
    ) {
      throw new BadRequestException('Файлын нэр буруу байна');
    }
    if (this.isReservedUploadFilename(safeName)) {
      throw new BadRequestException('Файлын нэр буруу байна');
    }
    return safeName;
  }

  private isReservedUploadFilename(filename: string): boolean {
    const baseName = filename
      .slice(0, filename.length - extname(filename).length)
      .replace(/[ .]+$/g, '')
      .toUpperCase();
    return /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/.test(baseName);
  }

  private hasExactUploadFilename(files: Array<{ url?: unknown; name?: unknown }> | null | undefined, safeName: string): boolean {
    return (files || []).some(file => {
      if (typeof file?.url !== 'string' && typeof file?.url !== 'number') return false;
      const urlName = file.url ? basename(String(file.url)) : '';
      let decodedUrlName = urlName;
      try {
        decodedUrlName = decodeURIComponent(urlName);
      } catch {}
      return urlName === safeName || decodedUrlName === safeName;
    });
  }

  private escapeLikePattern(value: string): string {
    return value.replace(/[\\%_]/g, match => `\\${match}`);
  }

  async resolveInquiryUpload(filename: unknown, user?: any) {
    const safeName = this.sanitizeInquiryUploadFilename(filename);
    const encodedSafeName = encodeURIComponent(safeName);
    const safeLikeName = this.escapeLikePattern(safeName);
    const safeEncodedLikeName = this.escapeLikePattern(encodedSafeName);
    const inquiries = await this.repo.createQueryBuilder('i')
      .where('(i.files::text LIKE :filename OR i.files::text LIKE :encodedFilename)', {
        filename: `%${safeLikeName}%`,
        encodedFilename: `%${safeEncodedLikeName}%`,
      })
      .getMany();
    const exactInquiries = inquiries.filter(item => this.hasExactUploadFilename(item.files, safeName));
    for (const item of exactInquiries) {
      if (await this.canReadFullInquiry(item, user)) {
        return {
          filename: safeName,
          absolutePath: join(process.cwd(), 'uploads', 'inquiries', safeName),
        };
      }
    }
    let foundExactMatch = exactInquiries.length > 0;

    {
      const messages = await this.chatRepo.createQueryBuilder('m')
        .where('(m.attachments::text LIKE :filename OR m.attachments::text LIKE :encodedFilename)', {
          filename: `%${safeLikeName}%`,
          encodedFilename: `%${safeEncodedLikeName}%`,
        })
        .getMany();
      const exactMessages = messages.filter(item => this.hasExactUploadFilename(item.attachments, safeName));
      foundExactMatch = foundExactMatch || exactMessages.length > 0;
      for (const message of exactMessages) {
        const safeMessageInquiryId = this.safeLooseIdOrNull(message.inquiry_id);
        if (!safeMessageInquiryId) continue;
        const inquiry = await this.findOne(safeMessageInquiryId);
        if (inquiry && await this.canReadFullInquiry(inquiry, user)) {
          return {
            filename: safeName,
            absolutePath: join(process.cwd(), 'uploads', 'inquiries', safeName),
          };
        }
      }
    }

    if (foundExactMatch) throw new ForbiddenException('Энэ файлыг татах эрхгүй байна');
    throw new NotFoundException('Файл олдсонгүй');
  }

  private toPublicInquiry(inquiry: PrintInquiry, fallbackId?: string): Partial<PrintInquiry> {
    const safeStatus = Object.values(InquiryStatus).includes(inquiry.status as InquiryStatus)
      ? inquiry.status
      : undefined;
    return {
      id: this.safeLooseIdOrNull(inquiry.id) || fallbackId || '',
      inquiry_number: this.firstScalarText(inquiry.inquiry_number),
      status: safeStatus,
      product_id: this.firstScalarText(inquiry.product_id),
      product_name: this.firstScalarText(inquiry.product_name),
      category: this.firstScalarText(inquiry.category),
      quantity: this.notificationQuantity(inquiry.quantity),
      size_label: this.firstScalarText(inquiry.size_label),
      width_mm: this.parsePositiveScalarNumber(inquiry.width_mm) || null,
      height_mm: this.parsePositiveScalarNumber(inquiry.height_mm) || null,
      paper_type: this.firstScalarText(inquiry.paper_type),
      color_mode: this.firstScalarText(inquiry.color_mode),
      sides: this.sanitizePrintSides(inquiry.sides),
      finishing: this.sanitizeFinishing(inquiry.finishing),
      has_design: this.sanitizeBoolean(inquiry.has_design),
      needs_design: this.sanitizeBoolean(inquiry.needs_design),
      quoted_price: this.parsePositiveScalarNumber(inquiry.quoted_price) || null,
      estimated_price: this.parsePositiveScalarNumber(inquiry.estimated_price) || null,
      created_at: this.safeDateField(inquiry.created_at),
      updated_at: this.safeDateField(inquiry.updated_at),
      files: [],
      pricing_snapshot: undefined,
    };
  }

  async findForVendor(userId: unknown): Promise<PrintInquiry[]> {
    const safeUserId = this.sanitizeVendorUserId(userId);
    const vendor = await this.getVendorByUserId(safeUserId);
    const inquiries = await this.repo.createQueryBuilder('i')
      .where(`
        (
        i.vendor_id = :vendorId
        OR i.vendor_user_id = :userId
        OR (i.is_broadcast = true AND i.broadcast_vendor_ids ? :vendorId)
        OR (i.vendor_id IS NULL AND i.is_broadcast = false)
        )
      `, { vendorId: vendor.id, userId: safeUserId })
      .orderBy('i.created_at', 'DESC')
      .getMany();
    return inquiries.filter(inquiry => this.canVendorSeeInquiryForWork(inquiry, vendor, safeUserId));
  }

  private canVendorSeeInquiryForWork(inquiry: PrintInquiry, vendor: Vendor, safeUserId: string): boolean {
    const vendorId = this.safeLooseIdOrNull(inquiry.vendor_id);
    const vendorUserId = this.safeLooseIdOrNull(inquiry.vendor_user_id);
    if (vendorId === vendor.id || vendorUserId === safeUserId) return true;
    const isBroadcastTarget = !!inquiry.is_broadcast
      && this.normalizedBroadcastVendorIds(inquiry).includes(vendor.id);
    const isOpenOpportunity = !vendorId && !inquiry.is_broadcast;
    if (!isBroadcastTarget && !isOpenOpportunity) return false;
    const productType = this.normalizeProductType(this.firstScalarText(inquiry.category, inquiry.product_name));
    if (!this.vendorCanServeProduct(vendor, productType)) return false;
    const price = this.getInquiryVendorFloorPrice(inquiry);
    return this.vendorMeetsFloorPrice(vendor, productType, price);
  }

  findOne(id: unknown) {
    const safeId = this.sanitizeLooseId(id);
    return this.repo.findOne({ where: { id: safeId } });
  }

  async findOneForUser(id: unknown, user?: any) {
    const safeId = this.sanitizeLooseId(id);
    const inquiry = await this.repo.findOne({ where: { id: safeId } });
    if (!inquiry) return null;
    if (await this.canReadFullInquiry(inquiry, user)) return inquiry;
    return this.toPublicInquiry(inquiry, safeId);
  }

  async updateStatus(id: unknown, status: unknown, note?: unknown) {
    const safeId = this.sanitizeLooseId(id);
    if (typeof status !== 'string' || !Object.values(InquiryStatus).includes(status as InquiryStatus)) {
      throw new BadRequestException('Буруу төлөв');
    }
    const safeStatus = status as InquiryStatus;
    const inquiry = await this.repo.findOne({ where: { id: safeId } });
    if (!inquiry) throw new NotFoundException('Захиалга олдсонгүй');
    if (inquiry.status === InquiryStatus.CANCELLED && safeStatus !== InquiryStatus.CANCELLED) {
      throw new BadRequestException('Цуцлагдсан захиалгын төлөвийг буцааж өөрчлөх боломжгүй');
    }
    if (inquiry.status === InquiryStatus.COMPLETED && safeStatus !== InquiryStatus.COMPLETED) {
      throw new BadRequestException('Дууссан захиалгын төлөвийг буцааж өөрчлөх боломжгүй');
    }
    if (safeStatus === InquiryStatus.CANCELLED && inquiry.status === InquiryStatus.IN_WORK) {
      throw new BadRequestException('Үйлдвэрлэл эхэлсэн захиалгыг шууд цуцлах боломжгүй');
    }
    const hasQuote = this.parsePositiveScalarNumber(inquiry.quoted_price) > 0;
    if ([InquiryStatus.QUOTED, InquiryStatus.CONFIRMED].includes(safeStatus) && !hasQuote) {
      throw new BadRequestException(safeStatus === InquiryStatus.QUOTED
        ? 'Үнийн санал илгээхдээ "Үнэ илгээх" үйлдлийг ашиглана уу'
        : 'Захиалга батлахын өмнө үнийн санал илгээх шаардлагатай');
    }
    if (safeStatus === InquiryStatus.IN_WORK && inquiry.status !== InquiryStatus.CONFIRMED) {
      throw new BadRequestException('Үйлдвэрлэл эхлүүлэхийн өмнө захиалгыг баталгаажуулах шаардлагатай');
    }
    if (safeStatus === InquiryStatus.COMPLETED && inquiry.status !== InquiryStatus.IN_WORK) {
      throw new BadRequestException('Дуусгахын өмнө захиалга үйлдвэрлэлд орсон байх шаардлагатай');
    }
    const safeNote = this.sanitizeTextField(note, 1_000);
    await this.repo.update(safeId, { status: safeStatus, ...(safeNote ? { admin_notes: safeNote } : {}) });
    const labels: Record<string, string> = {
      reviewing: 'Захиалгыг хянаж байна',
      quoted: 'Үнийн санал бэлэн болсон',
      confirmed: 'Захиалга батлагдлаа',
      in_work: 'Хэвлэж эхэллээ',
      completed: 'Захиалга бэлэн болсон',
    };
    if (labels[safeStatus]) await this.sysMsg(safeId, labels[safeStatus]);
    this.eventEmitter.emit('inquiry.status', { id: safeId, status: safeStatus });
    return this.repo.findOne({ where: { id: safeId } });
  }

  private isVerifiedBackendPrice(snapshot?: Record<string, any> | null) {
    return snapshot?.verifiedBy === 'backend'
      && this.parseScalarNumber(snapshot?.serverDelta) === 0
      && !snapshot?.verificationError;
  }

  async sendQuote(id: unknown, price: unknown, notes: unknown, source: unknown = 'manual') {
    const safeId = this.sanitizeLooseId(id);
    const safePrice = this.parseQuoteAmount(price);
    if (typeof source !== 'string' || !['manual', 'auto_verified'].includes(source)) {
      throw new BadRequestException('Үнийн саналын эх сурвалж буруу байна');
    }
    const inquiry = await this.repo.findOne({ where: { id: safeId } });
    if (!inquiry) throw new NotFoundException('Захиалга олдсонгүй');
    if (![InquiryStatus.NEW, InquiryStatus.REVIEWING, InquiryStatus.QUOTED].includes(inquiry.status)) {
      throw new BadRequestException('Энэ төлөвтэй захиалгад үнийн санал дахин илгээх боломжгүй');
    }
    if (source === 'auto_verified') {
      if (!this.isVerifiedBackendPrice(inquiry.pricing_snapshot)) {
        throw new BadRequestException('Backend-ээр баталгаажаагүй автомат үнийг үнийн санал болгохгүй');
      }
      const estimate = this.parsePositiveScalarNumber(inquiry.estimated_price)
        || this.parsePositiveScalarNumber(inquiry.pricing_snapshot?.total);
      if (estimate <= 0 || Math.round(estimate) !== safePrice) {
        throw new BadRequestException('Автомат үнийн санал backend баталгаатай нийт дүнтэй таарахгүй байна');
      }
    }
    if (inquiry.vendor_id) {
      let safeVendorId = '';
      try {
        safeVendorId = this.sanitizeLooseId(inquiry.vendor_id);
      } catch {
        throw new BadRequestException('Vendor ID буруу байна');
      }
      const vendor = await this.vendorRepo.findOne({ where: { id: safeVendorId } }).catch(() => null);
      if (vendor) {
        const productType = this.normalizeProductType(this.firstScalarText(inquiry.category, inquiry.product_name));
        if (!this.vendorCanServeProduct(vendor, productType)) {
          throw new BadRequestException('Vendor энэ бүтээгдэхүүний төрлийг хийх үйлчилгээтэй биш байна');
        }
        if (!this.vendorMeetsFloorPrice(vendor, productType, safePrice)) {
          throw new BadRequestException('Vendor доод үнэ үнийн саналаас өндөр байна');
        }
      }
    }
    const safeNotes = this.sanitizeTextField(notes, 1_000) || '';
    await this.repo.update(safeId, { quoted_price: safePrice, status: InquiryStatus.QUOTED, admin_notes: safeNotes });
    await this.sysMsg(safeId, `Үнийн санал: ${safePrice.toLocaleString()}₮.${safeNotes ? ` ${safeNotes}` : ''}`);
    this.eventEmitter.emit('inquiry.quoted', { id: safeId, price: safePrice });
    return this.repo.findOne({ where: { id: safeId } });
  }

  async reprice(id: unknown) {
    const safeId = this.sanitizeLooseId(id);
    if (!isUUID(safeId)) throw new BadRequestException('Буруу ID формат');
    const inquiry = await this.repo.findOne({ where: { id: safeId } });
    if (!inquiry) throw new NotFoundException('Захиалга олдсонгүй');
    if (![InquiryStatus.NEW, InquiryStatus.REVIEWING, InquiryStatus.QUOTED].includes(inquiry.status)) {
      throw new BadRequestException('Энэ төлөвтэй захиалгад дахин үнэ бодох боломжгүй');
    }
    const type = this.normalizeProductType(this.firstScalarText(inquiry.category, inquiry.product_name));
    if (!['banner', 'sticker'].includes(type)) {
      throw new BadRequestException('Энэ бүтээгдэхүүн backend wide-format reprice дэмжихгүй');
    }
    if (!this.parsePositiveScalarNumber(inquiry.width_mm) || !this.parsePositiveScalarNumber(inquiry.height_mm)) {
      throw new BadRequestException('Дахин үнэ бодоход хэмжээний мэдээлэл дутуу байна');
    }
    if (!this.normalizeMaterialField(inquiry.paper_type)) {
      throw new BadRequestException('Дахин үнэ бодоход материалын мэдээлэл дутуу байна');
    }

    const priced = await this.applyServerPricing(inquiry, 'manual_reprice');
    await this.repo.update(safeId, {
      estimated_price: priced.estimated_price,
      pricing_snapshot: priced.pricing_snapshot,
    });
    await this.sysMsg(safeId, 'Захиалгын автомат үнэ backend engine-ээр дахин баталгаажлаа.');
    return this.repo.findOne({ where: { id: safeId } });
  }

  async assign(id: unknown, adminId: unknown) {
    const safeId = this.sanitizeLooseId(id);
    const safeAdminId = this.sanitizeLooseId(adminId);
    const inquiry = await this.repo.findOne({ where: { id: safeId } });
    if (!inquiry) throw new NotFoundException('Захиалга олдсонгүй');
    if ([InquiryStatus.IN_WORK, InquiryStatus.COMPLETED, InquiryStatus.CANCELLED].includes(inquiry.status)) {
      throw new BadRequestException('Ажил эхэлсэн, дууссан эсвэл цуцлагдсан захиалгыг операторт дахин оноох боломжгүй');
    }
    await this.repo.update(safeId, { assigned_to: safeAdminId, status: InquiryStatus.REVIEWING });
    return this.repo.findOne({ where: { id: safeId } });
  }

  getMessages(inquiryId: unknown) {
    const safeInquiryId = this.sanitizeLooseId(inquiryId);
    return this.chatRepo.find({ where: { inquiry_id: safeInquiryId }, order: { created_at: 'ASC' } });
  }

  private sanitizeMessageAttachmentUrl(value: unknown): string {
    const prefix = '/api/uploads/inquiries/';
    if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') return '';
    const url = String(value || '').trim();
    if (url.length > 300) return '';
    if (!url.startsWith(prefix) || /[\r\n\t\0]/.test(url) || /[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(url)) return '';
    const rawFilename = url.slice(prefix.length);
    let decodedFilename = rawFilename;
    try {
      decodedFilename = decodeURIComponent(rawFilename);
    } catch {
      return '';
    }
    const safeName = basename(decodedFilename);
    if (
      !safeName
      || safeName !== decodedFilename
      || safeName.length > 180
      || !/^[\w .-]+$/.test(safeName)
      || !ALLOWED_INQUIRY_UPLOAD_EXTENSIONS.has(extname(safeName).toLowerCase())
      || this.isReservedUploadFilename(safeName)
    ) return '';
    const encodedUrl = `${prefix}${encodeURIComponent(safeName)}`;
    return encodedUrl.length <= 300 ? encodedUrl : '';
  }

  private sanitizeMessageAttachments(attachments: any[]): Array<{ name: string; type: string; url: string }> {
    return attachments.slice(0, 3).map(item => {
      const rawName = typeof item?.name === 'string' || typeof item?.name === 'number' ? item.name : 'file';
      const name = String(rawName || 'file')
        .replace(/[\r\n\t\0]/g, ' ')
        .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/[<>:"|?*\\/]/g, '_')
        .trim()
        .slice(0, 180) || 'file';
      const rawType = typeof item?.type === 'string' || typeof item?.type === 'number'
        ? String(item.type || '').trim().toLowerCase()
        : '';
      const type = ALLOWED_INQUIRY_ATTACHMENT_MIME_TYPES.has(rawType)
        ? rawType
        : 'application/octet-stream';
      const safeUrl = this.sanitizeMessageAttachmentUrl(item?.url);
      return { name, type, url: safeUrl };
    }).filter(item => item.url);
  }

  private sanitizeMessageSenderId(value: unknown): string {
    if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') {
      return 'guest';
    }
    return String(value || 'guest')
      .replace(/[\r\n\t\0]/g, '')
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/[\\/]/g, '_')
      .trim()
      .slice(0, 120) || 'guest';
  }

  private sanitizeMessageSenderName(value: unknown): string {
    if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') {
      return 'Харилцагч';
    }
    return String(value || 'Харилцагч')
      .replace(/[\r\n\t\0]/g, ' ')
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/[<>:"|?*\\/]/g, '_')
      .trim()
      .slice(0, 80) || 'Харилцагч';
  }

  private sanitizeMessageContent(value: unknown): string {
    if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') return '';
    return String(value || '')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private sanitizeLooseId(value: unknown): string {
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new BadRequestException('Буруу ID формат');
    }
    const safeId = String(value || '').trim();
    if (!safeId || safeId.length > 120 || /[\\/\r\n\t\0]/.test(safeId) || /[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(safeId)) {
      throw new BadRequestException('Буруу ID формат');
    }
    return safeId;
  }

  async getMessagesForUser(inquiryId: unknown, user?: any) {
    const safeInquiryId = this.sanitizeLooseId(inquiryId);
    const inquiry = await this.findOne(safeInquiryId);
    if (!inquiry) return [];
    if (await this.canReadFullInquiry(inquiry, user)) return this.getMessages(safeInquiryId);
    if (inquiry.customer_id) return [];
    return this.chatRepo.find({
      where: { inquiry_id: safeInquiryId, is_system: true },
      order: { created_at: 'ASC' },
    });
  }

  async sendMessage(dto: unknown, user?: any): Promise<ChatMessage> {
    const input = dto && typeof dto === 'object' && !Array.isArray(dto)
      ? dto as Record<string, unknown>
      : {};
    const safeInquiryId = this.sanitizeLooseId(input.inquiryId);
    const inquiry = await this.findOne(safeInquiryId);
    if (!inquiry) throw new NotFoundException('Захиалга олдсонгүй');
    const content = this.sanitizeMessageContent(input.content);
    const rawAttachments = Array.isArray(input.attachments) ? input.attachments : [];
    const attachments = this.sanitizeMessageAttachments(rawAttachments);
    const senderId = this.sanitizeMessageSenderId(input.senderId);
    const senderName = this.sanitizeMessageSenderName(input.senderName);
    const rawSenderRole = typeof input.senderRole === 'string' ? input.senderRole : '';
    const senderRole = ['admin', 'vendor', 'customer', 'system'].includes(rawSenderRole) ? rawSenderRole : 'customer';
    if (rawAttachments.length > 3) throw new BadRequestException('Хавсралтын тоо 3-аас их байж болохгүй');
    const hasMessageBody = content.length > 0 || attachments.length > 0;
    if (!hasMessageBody) throw new BadRequestException('Мессеж хоосон байна');
    if (content.length > 5000) throw new BadRequestException('Мессеж 5000 тэмдэгтээс их байж болохгүй');
    const allowed = await this.canReadFullInquiry(inquiry, user);
    if (!allowed && inquiry.customer_id) {
      throw new ForbiddenException('Энэ захиалгад мессеж бичих эрхгүй байна');
    }

    const msg = await this.chatRepo.save(
      this.chatRepo.create({
        inquiry_id: safeInquiryId,
        sender_id: senderId,
        sender_name: senderName,
        sender_role: senderRole,
        content,
        attachments,
      }),
    );
    this.eventEmitter.emit('chat.new', msg);
    return msg;
  }

  async markRead(inquiryId: unknown) {
    const safeInquiryId = this.sanitizeLooseId(inquiryId);
    await this.chatRepo.update({ inquiry_id: safeInquiryId, is_read: false }, { is_read: true });
  }

  async markReadForUser(inquiryId: unknown, user?: any) {
    const safeInquiryId = this.sanitizeLooseId(inquiryId);
    const inquiry = await this.findOne(safeInquiryId);
    if (!inquiry) throw new NotFoundException('Захиалга олдсонгүй');
    if (!(await this.canReadFullInquiry(inquiry, user))) {
      throw new ForbiddenException('Энэ захиалгын мессежийг уншсан болгох эрхгүй байна');
    }
    const unreadSenderRoles = this.isAdminUser(user)
      ? ['customer']
      : ['vendor', 'factory'].includes(user?.role)
        ? ['customer', 'admin', 'system']
        : ['admin', 'vendor', 'system'];
    await this.chatRepo.update({
      inquiry_id: safeInquiryId,
      is_read: false,
      sender_role: In(unreadSenderRoles),
    }, { is_read: true });
    return { ok: true };
  }

  private async sysMsg(inquiryId: unknown, content: unknown) {
    const safeInquiryId = this.sanitizeLooseId(inquiryId);
    const safeContent = this.sanitizeMessageContent(content);
    if (!safeContent) return;
    await this.chatRepo.save(
      this.chatRepo.create({
        inquiry_id: safeInquiryId,
        sender_id: 'system',
        sender_name: 'BizPrint',
        sender_role: 'system',
        content: safeContent,
        is_system: true,
      }),
    );
  }

  async getSummary() {
    const pricingDeltaQb = this.repo.createQueryBuilder('i')
      .where("i.pricing_snapshot ->> 'verifiedBy' = :verifiedBy", { verifiedBy: 'backend' })
      .andWhere("ABS(COALESCE((i.pricing_snapshot ->> 'serverDelta')::numeric, 0)) > 0");
    const pricingDeltaSeverityQb = (severity: string) => this.repo.createQueryBuilder('i')
      .where("i.pricing_snapshot ->> 'verifiedBy' = :verifiedBy", { verifiedBy: 'backend' })
      .andWhere("ABS(COALESCE((i.pricing_snapshot ->> 'serverDelta')::numeric, 0)) > 0")
      .andWhere("i.pricing_snapshot ->> 'serverDeltaSeverity' = :severity", { severity });
    const pricingUnverifiedQb = this.repo.createQueryBuilder('i')
      .where("COALESCE(i.pricing_snapshot ->> 'verificationError', '') <> ''");
    const pricingUnverifiedReasonQb = (reason: string) => this.repo.createQueryBuilder('i')
      .where("i.pricing_snapshot ->> 'verificationError' = :reason", { reason });
    const slaOverdueQb = this.repo.createQueryBuilder('i')
      .where('i.vendor_sla_deadline IS NOT NULL')
      .andWhere('i.vendor_sla_deadline < NOW()')
      .andWhere('i.vendor_accepted = false')
      .andWhere('i.vendor_id IS NOT NULL');
    const pricingVerifiedQb = () => this.repo.createQueryBuilder('i')
      .where("i.pricing_snapshot ->> 'verifiedBy' = :verifiedBy", { verifiedBy: 'backend' })
      .andWhere("ABS(COALESCE((i.pricing_snapshot ->> 'serverDelta')::numeric, 0)) = 0")
      .andWhere("COALESCE(i.pricing_snapshot ->> 'verificationError', '') = ''");
    const pricingManualReviewQb = () => this.repo.createQueryBuilder('i')
      .where('i.pricing_snapshot IS NOT NULL')
      .andWhere("COALESCE(i.pricing_snapshot ->> 'verifiedBy', '') <> :verifiedBy", { verifiedBy: 'backend' })
      .andWhere("COALESCE(i.pricing_snapshot ->> 'verificationError', '') = ''");
    const pricingSnapshotMissingQb = () => this.repo.createQueryBuilder('i')
      .where('i.pricing_snapshot IS NULL')
      .andWhere('COALESCE(i.estimated_price, 0) > 0');
    const pricingActionRequiredQb = () => {
      const condition = this.pricingActionRequiredCondition();
      return this.repo.createQueryBuilder('i').where(condition.sql, condition.params);
    };

    const [total, newC, reviewing, quoted, unread, pricingDelta, pricingDeltaMinor, pricingDeltaWarning, pricingDeltaCritical, pricingUnverified, pricingMissingSize, pricingMissingMaterial, slaOverdue, pricingVerified, pricingManualReview, pricingSnapshotMissing, pricingActionRequired] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { status: InquiryStatus.NEW } }),
      this.repo.count({ where: { status: InquiryStatus.REVIEWING } }),
      this.repo.count({ where: { status: InquiryStatus.QUOTED } }),
      this.chatRepo.count({ where: { is_read: false, sender_role: 'customer' } }),
      pricingDeltaQb.getCount(),
      pricingDeltaSeverityQb('minor').getCount(),
      pricingDeltaSeverityQb('warning').getCount(),
      pricingDeltaSeverityQb('critical').getCount(),
      pricingUnverifiedQb.getCount(),
      pricingUnverifiedReasonQb('missing_size').getCount(),
      pricingUnverifiedReasonQb('missing_material').getCount(),
      slaOverdueQb.getCount(),
      pricingVerifiedQb().getCount(),
      pricingManualReviewQb().getCount(),
      pricingSnapshotMissingQb().getCount(),
      pricingActionRequiredQb().getCount(),
    ]);
    return {
      total,
      new_count: newC,
      reviewing,
      quoted,
      unread_messages: unread,
      pricing_delta_count: pricingDelta,
      pricing_delta_minor_count: pricingDeltaMinor,
      pricing_delta_warning_count: pricingDeltaWarning,
      pricing_delta_critical_count: pricingDeltaCritical,
      pricing_unverified_count: pricingUnverified,
      pricing_missing_size_count: pricingMissingSize,
      pricing_missing_material_count: pricingMissingMaterial,
      sla_overdue_count: slaOverdue,
      pricing_verified_count: pricingVerified,
      pricing_auto_quote_ready_count: pricingVerified,
      pricing_reprice_required_count: pricingDelta,
      pricing_input_fix_required_count: pricingUnverified,
      pricing_manual_review_count: pricingManualReview,
      pricing_snapshot_missing_count: pricingSnapshotMissing,
      pricing_action_required_count: pricingActionRequired,
    };
  }

  // ─── Vendor workflow (race-safe for broadcast) ───
  async vendorAccept(id: unknown, vendorUserId: unknown) {
    const safeId = this.sanitizeLooseId(id);
    const inquiry = await this.repo.findOne({ where: { id: safeId } });
    if (!inquiry) return null;
    const safeVendorUserId = this.sanitizeVendorUserId(vendorUserId);
    const vendor = await this.getVendorByUserId(safeVendorUserId);

    if (!this.canVendorAccessInquiry(inquiry, vendor)) {
      throw new ForbiddenException('Энэ захиалга танай үйлдвэрт оноогдоогүй байна');
    }
    if (inquiry.vendor_accepted) {
      throw new BadRequestException('Захиалгыг үйлдвэр аль хэдийн хүлээн авсан байна');
    }
    if (inquiry.status !== InquiryStatus.CONFIRMED) {
      throw new BadRequestException('Үйлдвэр захиалга хүлээн авахын өмнө захиалга батлагдсан байх шаардлагатай');
    }
    const quotedPrice = this.parsePositiveScalarNumber(inquiry.quoted_price);
    if (quotedPrice <= 0) {
      throw new BadRequestException('Үйлдвэр захиалга хүлээн авахын өмнө баталгаатай үнийн санал илгээгдсэн байх шаардлагатай');
    }

    // Race guard: broadcast mode — first vendor wins
    const productType = this.normalizeProductType(this.firstScalarText(inquiry.category, inquiry.product_name));
    if (!this.vendorCanServeProduct(vendor, productType)) {
      throw new BadRequestException('Vendor энэ бүтээгдэхүүний төрлийг хийх үйлчилгээтэй биш байна');
    }
    if (!this.vendorMeetsFloorPrice(vendor, productType, quotedPrice)) {
      throw new BadRequestException('Vendor доод үнэ үнийн саналаас өндөр байна');
    }

    if (inquiry.is_broadcast && inquiry.vendor_accepted) {
      return { error: 'Захиалгыг өөр vendor аль хэдийн хүлээн авсан байна' };
    }

    const accepted = await this.repo.update({
      id: safeId,
      vendor_accepted: false,
      status: InquiryStatus.CONFIRMED,
    } as any, {
      vendor_accepted: true,
      vendor_user_id: safeVendorUserId,
      vendor_id: vendor.id,
      vendor_accepted_at: new Date(),
      status: InquiryStatus.IN_WORK,
    });
    if (!accepted.affected) {
      throw new BadRequestException('Захиалгыг өөр үйлдвэр аль хэдийн хүлээн авсан байна');
    }

    const gross = quotedPrice;
    if (gross > 0 && this.commissionService) {
      try {
        await this.commissionService.create({
          inquiryId: safeId,
          vendorId: safeVendorUserId,
          vendorName: this.safeVendorDisplayName(vendor) || inquiry.customer_company || undefined,
          grossAmount: gross,
        });
      } catch {}
    }

    await this.sysMsg(
      safeId,
      `${this.safeVendorDisplayName(vendor)} захиалгыг хүлээн авлаа. Үйлдвэрлэлд орлоо.`,
    );
    return this.repo.findOne({ where: { id: safeId } });
  }

  async getVendorPendingCount(userId: unknown): Promise<number> {
    const safeUserId = this.sanitizeVendorUserId(userId);
    const vendor = await this.getVendorByUserId(safeUserId);
    const inquiries = await this.repo.createQueryBuilder('i')
      .where('i.vendor_accepted = false')
      .andWhere('i.status IN (:...statuses)', {
        statuses: [InquiryStatus.NEW, InquiryStatus.REVIEWING, InquiryStatus.CONFIRMED],
      })
      .andWhere(`
        (
        i.vendor_id = :vendorId
        OR (i.is_broadcast = true AND i.broadcast_vendor_ids ? :vendorId)
        OR (i.vendor_id IS NULL AND i.is_broadcast = false)
        )
      `, { vendorId: vendor.id });
    return inquiries
      .getMany()
      .then(items => items.filter(item => this.canVendorSeeInquiryForWork(item, vendor, safeUserId)).length);
  }

  async vendorReject(id: unknown, vendorUserId: unknown) {
    const safeId = this.sanitizeLooseId(id);
    const inquiry = await this.repo.findOne({ where: { id: safeId } });
    if (!inquiry) return null;
    const vendor = await this.getVendorByUserId(vendorUserId);
    if (!this.canVendorAccessInquiry(inquiry, vendor)) {
      throw new ForbiddenException('Энэ захиалга танай үйлдвэрт оноогдоогүй байна');
    }
    if (inquiry.vendor_accepted || [InquiryStatus.IN_WORK, InquiryStatus.COMPLETED, InquiryStatus.CANCELLED].includes(inquiry.status)) {
      throw new BadRequestException('Ажил эхэлсэн, дууссан эсвэл цуцлагдсан захиалгыг татгалзах боломжгүй');
    }

    if (inquiry.is_broadcast) {
      const remainingVendorIds = await this.getEligibleBroadcastVendorIds(inquiry, vendor.id);
      const assignedVendorId = this.safeLooseIdOrNull(inquiry.vendor_id);
      await this.repo.update(safeId, {
        broadcast_vendor_ids: remainingVendorIds,
        vendor_accepted: false,
        vendor_user_id: undefined as any,
        ...(assignedVendorId === vendor.id ? { vendor_id: undefined as any } : {}),
        status: InquiryStatus.REVIEWING,
      });
      if (remainingVendorIds.length === 0) {
        this.notificationsGateway?.notifyAdmins({
          type: 'vendor_broadcast_all_rejected',
          title: 'Бүх үйлдвэр татгалзсан',
          message: 'Broadcast хийсэн бүх үйлдвэр захиалгыг татгалзлаа. Гараар оноох шаардлагатай.',
          inquiryId: safeId,
          timestamp: new Date().toISOString(),
        });
      }
      await this.sysMsg(safeId, `${this.safeVendorDisplayName(vendor)} захиалгыг татгалзсан.`);
      return this.repo.findOne({ where: { id: safeId } });
    }

    const nextVendor = await this.findNextVendor(inquiry, [vendor.id, inquiry.sla_missed_vendor_id].filter(Boolean) as string[]);
    if (nextVendor) {
      await this.repo.update(safeId, {
        vendor_id: nextVendor.id,
        vendor_user_id: undefined as any,
        vendor_accepted: false,
        vendor_assigned_at: new Date(),
        vendor_sla_deadline: new Date(Date.now() + 30 * 60 * 1000),
        reassign_count: this.normalizedReassignCount(inquiry.reassign_count) + 1,
        sla_missed_vendor_id: vendor.id,
        status: InquiryStatus.REVIEWING,
      });
      this.notificationsGateway?.notifyVendorNewInquiry(this.safeVendorRealtimeUserId(nextVendor), { ...inquiry, id: safeId });
      const nextRejectVendorEmail = this.safeVendorContactEmail(nextVendor);
      const nextRejectVendorName = this.safeVendorDisplayName(nextVendor);
      if (nextRejectVendorEmail) {
        this.mailService?.sendVendorNewInquiry(
          { email: nextRejectVendorEmail, name: nextRejectVendorName },
          {
            id: safeId,
            productName: this.firstScalarText(inquiry.product_name),
            quantity: this.notificationQuantity(inquiry.quantity),
            estimatedPrice: this.notificationEstimatedPrice((inquiry as any).estimated_price),
            customerName: this.firstScalarText(inquiry.customer_name),
          },
        ).catch(() => {});
      }
      await this.sysMsg(
        safeId,
        `${this.safeVendorDisplayName(vendor)} татгалзсан тул "${this.safeVendorDisplayName(nextVendor)}" үйлдвэрт дахин хуваарилагдлаа.`,
      );
      this.scheduleSLATimeout(safeId, nextVendor);
      return this.repo.findOne({ where: { id: safeId } });
    }

    const assignedVendorId = this.safeLooseIdOrNull(inquiry.vendor_id);
    await this.repo.update(safeId, {
      vendor_accepted: false,
      vendor_user_id: undefined as any,
      ...(assignedVendorId === vendor.id ? { vendor_id: undefined as any } : {}),
      status: InquiryStatus.REVIEWING,
    });
    this.notificationsGateway?.notifyAdmins({
      type: 'vendor_rejected_no_alternative',
      title: 'Өөр үйлдвэр олдсонгүй',
      message: `${this.safeVendorDisplayName(vendor)} захиалгыг татгалзсан боловч дахин оноох боломжтой үйлдвэр олдсонгүй.`,
      inquiryId: safeId,
      timestamp: new Date().toISOString(),
    });
    await this.sysMsg(safeId, `${this.safeVendorDisplayName(vendor)} захиалгыг татгалзсан. Оператор өөр үйлдвэртэй холбогдоно.`);
    return this.repo.findOne({ where: { id: safeId } });
  }

  private async getEligibleBroadcastVendorIds(inquiry: PrintInquiry, rejectingVendorId: string): Promise<string[]> {
    const normalizedVendorIds = Array.from(new Set(
      (inquiry.broadcast_vendor_ids || [])
        .map(vendorId => {
          try {
            return this.sanitizeLooseId(vendorId);
          } catch {
            return '';
          }
        })
        .filter(vendorId => vendorId && vendorId !== rejectingVendorId),
    )).slice(0, 50);
    const productType = this.normalizeProductType(this.firstScalarText(inquiry.category, inquiry.product_name));
    const price = this.getInquiryVendorFloorPrice(inquiry);
    const remainingVendorIds: string[] = [];
    for (const vendorId of normalizedVendorIds) {
      const vendor = await this.vendorRepo.findOne({ where: { id: vendorId } }).catch(() => null);
      if (
        this.isAssignableVendor(vendor)
        && this.vendorCanServeProduct(vendor as Vendor, productType)
        && this.vendorMeetsFloorPrice(vendor as Vendor, productType, price)
      ) {
        remainingVendorIds.push(vendorId);
      }
    }
    return remainingVendorIds;
  }
}


