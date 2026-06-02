import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, Request, UseInterceptors, UploadedFiles, BadRequestException, NotFoundException, UnauthorizedException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { basename, extname, join } from 'path';
import { mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { PrintInquiryService } from './print-inquiry.service';
import { ContactMethod, InquiryStatus } from './entities/print-inquiry.entity';

const ALLOWED_UPLOAD_EXTENSIONS = new Set(['.pdf', '.ai', '.psd', '.jpg', '.jpeg', '.png', '.webp', '.eps', '.zip']);
const MAX_INQUIRY_UPLOAD_COUNT = 5;
const MAX_INQUIRY_UPLOAD_BYTES = 50 * 1024 * 1024;
const MAX_MESSAGE_ATTACHMENT_COUNT = 3;
const MAX_MESSAGE_UPLOAD_BYTES = 20 * 1024 * 1024;
const UPLOAD_MIME_BY_EXTENSION = new Map<string, string>([
  ['.pdf', 'application/pdf'],
  ['.ai', 'application/postscript'],
  ['.psd', 'image/vnd.adobe.photoshop'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.eps', 'application/postscript'],
  ['.zip', 'application/zip'],
]);

export const safeInquiryUploadExtension = (originalName: unknown): string | null => {
  if (typeof originalName !== 'string' && typeof originalName !== 'number') return null;
  const name = String(originalName || '');
  if (!name || /[\0-\x1F\x7F]/.test(name)) return null;
  const ext = extname(name.trim()).toLowerCase();
  return ALLOWED_UPLOAD_EXTENSIONS.has(ext) ? ext : null;
};

const uploadStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dest = join(process.cwd(), 'uploads', 'inquiries');
    mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${unique}${safeInquiryUploadExtension(file.originalname) || '.bin'}`);
  },
});

const fileFilter = (_req: any, file: any, cb: any) => {
  if (safeInquiryUploadExtension(file.originalname)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Зөвшөөрөгдөөгүй файлын төрөл'), false);
  }
};

const parseJsonField = <T>(value: unknown, fallback: T): T => {
  try {
    const parsed = typeof value === 'string'
      ? (value.length > 20000 ? null : JSON.parse(value))
      : value;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return fallback;
    if (hasUnsafeJsonKey(parsed)) return fallback;
    const serialized = JSON.stringify(parsed);
    if (!serialized || serialized.length > 20000) return fallback;
    const normalized = JSON.parse(serialized);
    if (!normalized || Array.isArray(normalized) || typeof normalized !== 'object') return fallback;
    if (hasUnsafeJsonKey(normalized)) return fallback;
    return normalized;
  } catch {
    return fallback;
  }
};

const hasUnsafeJsonKey = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(item => hasUnsafeJsonKey(item));
  return Object.keys(value as Record<string, unknown>).some(key => (
    ['__proto__', 'prototype', 'constructor'].includes(key)
    || hasUnsafeJsonKey((value as Record<string, unknown>)[key])
  ));
};

const parseStringArrayField = (value: unknown): string[] => {
  const normalize = (items: unknown[]) => Array.from(new Set(
    items
      .filter(v => typeof v === 'string' || typeof v === 'number')
      .map(String)
      .map(v => v
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .trim()
        .slice(0, 120))
      .filter(Boolean),
  )).slice(0, 20);
  if (Array.isArray(value)) return normalize(value);
  if (!value || typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return normalize(parsed);
  } catch {}
  return normalize(value
    .replace(/^\s*\[/, '')
    .replace(/\]\s*$/, '')
    .split(',')
    .map(v => v.trim().replace(/^["']|["']$/g, '')));
};

const parseContactMethod = (value: unknown): ContactMethod => {
  if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') return ContactMethod.CHAT;
  const normalized = String(value || '').trim().toLowerCase();
  if (['call', 'tel', 'telephone', 'mobile', 'cell', 'phone-call'].includes(normalized)) return ContactMethod.PHONE;
  if (['mail', 'e-mail'].includes(normalized)) return ContactMethod.EMAIL;
  if (['messenger', 'dm', 'message'].includes(normalized)) return ContactMethod.CHAT;
  return Object.values(ContactMethod).includes(normalized as ContactMethod)
    ? normalized as ContactMethod
    : ContactMethod.CHAT;
};

const parsePrintSides = (value: unknown): string => {
  if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') return 'single';
  const normalized = String(value || '').trim().toLowerCase();
  if (['double', 'double-sided', 'duplex', '2', '2-sided', 'two-sided'].includes(normalized)) return 'double';
  if (['single', 'single-sided', 'simplex', '1', '1-sided', 'one-sided'].includes(normalized)) return 'single';
  return 'single';
};

const parseBoundedNumber = (
  value: unknown,
  { min = 0, max = Number.MAX_SAFE_INTEGER, integer = false }: { min?: number; max?: number; integer?: boolean } = {},
): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const bounded = Math.min(max, Math.max(min, parsed));
  return integer ? Math.round(bounded) : bounded;
};

const parseTextField = (value: unknown, max = 255): string | null => {
  if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
  return text ? text.slice(0, max) : null;
};

const parseEmailField = (value: unknown): string | null => {
  if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') return null;
  const email = String(value ?? '').trim().toLowerCase();
  if (!email || email.length > 160 || /[\r\n\t\0]/.test(email) || /[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(email)) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
};

const parsePhoneField = (value: unknown): string | null => {
  if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') return null;
  const phone = String(value ?? '')
    .replace(/[^\d+()\-\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
  return /\d/.test(phone) ? phone : null;
};

const parseQueryFlag = (value: unknown): boolean => {
  if (value === true) return true;
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  return ['true', '1', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
};

const parseBooleanField = parseQueryFlag;

const parseQuotePrice = (value: unknown): number => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new BadRequestException('Үнийн саналын дүн буруу байна');
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 10_000_000_000) {
    throw new BadRequestException('Үнийн саналын дүн буруу байна');
  }
  return Math.round(parsed);
};

const parseQuoteSource = (value: unknown): 'manual' | 'auto_verified' => {
  if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') {
    throw new BadRequestException('Үнийн саналын эх сурвалж буруу байна');
  }
  const source = String(value || 'manual').trim().toLowerCase();
  if (source === 'manual' || source === 'auto_verified') return source;
  throw new BadRequestException('Үнийн саналын эх сурвалж буруу байна');
};

const parseInquiryStatus = (value: unknown): InquiryStatus => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new BadRequestException('Захиалгын төлөв буруу байна');
  }
  const status = String(value || '').trim().toLowerCase();
  if (Object.values(InquiryStatus).includes(status as InquiryStatus)) return status as InquiryStatus;
  throw new BadRequestException('Захиалгын төлөв буруу байна');
};

const parseOptionalEnumFilter = (value: unknown, allowed: string[], label: string): string | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value !== 'string' && typeof value !== 'number') throw new BadRequestException(`${label} буруу байна`);
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return undefined;
  if (allowed.includes(normalized)) return normalized;
  throw new BadRequestException(`${label} буруу байна`);
};

const safeUploadDisplayName = (value: unknown): string => {
  const rawName = typeof value === 'string' || typeof value === 'number' ? value : 'file';
  const name = basename(String(rawName || 'file'))
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[<>:"|?*]/g, '_')
    .trim()
    .slice(0, 180);
  return name || 'file';
};

const safeUploadMimeType = (file: Express.Multer.File): string => {
  const rawFilename = typeof file.filename === 'string' || typeof file.filename === 'number' ? String(file.filename || '') : '';
  const ext = safeInquiryUploadExtension(file.originalname) || extname(rawFilename).toLowerCase();
  return UPLOAD_MIME_BY_EXTENSION.get(ext) || 'application/octet-stream';
};

const safeUploadSize = (file: Express.Multer.File, maxBytes: number): number => {
  const parsed = typeof file.size === 'string' || typeof file.size === 'number'
    ? Number(file.size)
    : 0;
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(Math.round(parsed), maxBytes);
};

const safeUploadUrl = (file: Express.Multer.File): string => {
  const rawFilename = typeof file.filename === 'string' || typeof file.filename === 'number' ? file.filename : 'file';
  const cleaned = basename(String(rawFilename || 'file'))
    .replace(/[\r\n\t\0]/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[<>:"|?*]/g, '_')
    .trim()
    .slice(0, 220) || 'file';
  const ext = safeInquiryUploadExtension(cleaned) || safeInquiryUploadExtension(file.originalname) || '.bin';
  const stem = basename(cleaned, extname(cleaned))
    .replace(/[. ]+$/g, '')
    .slice(0, 180) || 'file';
  const filename = `${stem}${ext}`;
  return `/api/uploads/inquiries/${encodeURIComponent(filename)}`;
};

const senderRoleFromUser = (user?: any): string => {
  if (user?.role === 'admin' || user?.role === 'superadmin') return 'admin';
  if (['vendor', 'factory'].includes(user?.role)) return 'vendor';
  return 'customer';
};

const safeSenderName = (value: unknown): string => {
  const rawName = typeof value === 'string' || typeof value === 'number' ? value : 'Харилцагч';
  const name = String(rawName || 'Харилцагч')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[<>:"|?*\\/]/g, '_')
    .trim()
    .slice(0, 80);
  return name || 'Харилцагч';
};

const senderNameFromRequest = (body: any, user?: any): string => {
  if (!user?.id) return safeSenderName(body?.sender_name);
  return safeSenderName(user.name || user.full_name || user.company_name || user.email);
};

const isIdScalar = (value: unknown): boolean => typeof value === 'string' || typeof value === 'number';

const sanitizeRequestUserId = (req: any, label = 'user_id'): string | null => {
  if (req?.user?.id === null || req?.user?.id === undefined || req?.user?.id === '') return null;
  if (!isIdScalar(req.user.id)) throw new BadRequestException(`${label} буруу байна`);
  const id = String(req.user.id).trim();
  if (!id) return null;
  if (id.length > 120 || /[\\/\r\n\t\0]/.test(id) || /[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(id)) {
    throw new BadRequestException(`${label} буруу байна`);
  }
  return id;
};

const requestUserId = (req: any): string => {
  const id = sanitizeRequestUserId(req);
  if (!id) throw new UnauthorizedException('Нэвтэрсэн хэрэглэгч олдсонгүй');
  return id;
};

const parseOptionalRequestUserId = (req: any): string | null => sanitizeRequestUserId(req, 'customer_id');

const requestUserContext = (req: any, required = false): any | undefined => {
  const id = sanitizeRequestUserId(req);
  if (!id) {
    if (required) throw new UnauthorizedException('Нэвтэрсэн хэрэглэгч олдсонгүй');
    return undefined;
  }
  return { ...req.user, id };
};

const parseRequiredId = (value: unknown, label: string): string => {
  if (!isIdScalar(value)) throw new BadRequestException(`${label} буруу байна`);
  const id = String(value || '').trim();
  if (!id) throw new BadRequestException(`${label} хоосон байна`);
  if (id.length > 120 || /[\\/\r\n\t\0]/.test(id) || /[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(id)) {
    throw new BadRequestException(`${label} буруу байна`);
  }
  return id;
};

const parseOptionalId = (value: unknown, label: string): string | null => {
  if (value === null || value === undefined || value === '') return null;
  if (!isIdScalar(value)) throw new BadRequestException(`${label} буруу байна`);
  const id = String(value || '').trim();
  if (!id) return null;
  return parseRequiredId(id, label);
};

const parseRouteId = (value: unknown, label = 'id'): string => {
  if (!isIdScalar(value)) throw new BadRequestException(`${label} буруу байна`);
  const id = String(value || '').trim();
  if (!id) throw new BadRequestException(`${label} хоосон байна`);
  if (id.length > 120 || /[\\/\r\n\t\0]/.test(id) || /[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(id)) {
    throw new BadRequestException(`${label} буруу байна`);
  }
  return id;
};

const parseTrackingNumber = (value: unknown): string => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new BadRequestException('tracking_number буруу байна');
  }
  const number = String(value || '').trim().toUpperCase();
  if (!number) throw new BadRequestException('tracking_number хоосон байна');
  if (number.length > 80 || !/^[A-Z0-9-]+$/.test(number)) {
    throw new BadRequestException('tracking_number буруу байна');
  }
  return number;
};

const parseMessageContent = (value: unknown): string => {
  if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') return '';
  const raw = value === undefined || value === null ? '' : String(value);
  if (raw.length > 5000) throw new BadRequestException('Мессеж 5000 тэмдэгтээс их байж болохгүй');
  return raw
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

@Controller('inquiries')
export class PrintInquiryController {
  constructor(private readonly svc: PrintInquiryService) {}

  // — PUBLIC: Create inquiry —
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', MAX_INQUIRY_UPLOAD_COUNT, {
    storage: uploadStorage, fileFilter,
    limits: { fileSize: MAX_INQUIRY_UPLOAD_BYTES },
  }))
  async create(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any,
  ) {
    const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    const rawUploadFiles = Array.isArray(files) ? files : [];
    if (rawUploadFiles.length > MAX_INQUIRY_UPLOAD_COUNT) {
      throw new BadRequestException('Файлын тоо 5-аас их байж болохгүй');
    }
    const uploadFiles = rawUploadFiles.filter(f => f && typeof f === 'object') as Express.Multer.File[];
    const uploadedFiles = uploadFiles.map(f => ({
      name: safeUploadDisplayName(f.originalname), size: safeUploadSize(f, MAX_INQUIRY_UPLOAD_BYTES), type: safeUploadMimeType(f),
      url: safeUploadUrl(f),
      uploaded_at: new Date().toISOString(),
    }));

    return this.svc.create({
      customer_id: parseOptionalRequestUserId(req),
      customer_name: parseTextField(input.customer_name),
      customer_phone: parsePhoneField(input.customer_phone),
      customer_email: parseEmailField(input.customer_email),
      customer_company: parseTextField(input.customer_company),
      viber_number: parsePhoneField(input.viber_number),
      product_id: parseOptionalId(input.product_id, 'product_id'),
      product_name: parseTextField(input.product_name),
      category: parseTextField(input.category, 120),
      quantity: parseBoundedNumber(input.quantity, { min: 1, max: 1000000, integer: true }),
      size_label: parseTextField(input.size_label, 80),
      width_mm: parseBoundedNumber(input.width_mm, { min: 1, max: 100000, integer: true }),
      height_mm: parseBoundedNumber(input.height_mm, { min: 1, max: 100000, integer: true }),
      paper_type: parseTextField(input.paper_type),
      color_mode: parseTextField(input.color_mode, 80),
      sides: parsePrintSides(input.sides),
      notes: parseTextField(input.notes, 5000),
      estimated_price: parseBoundedNumber(input.estimated_price, { min: 0, max: 10000000000, integer: true }),
      has_design: parseBooleanField(input.has_design),
      needs_design: parseBooleanField(input.needs_design),
      preferred_contact: parseContactMethod(input.preferred_contact),
      delivery_address: parseTextField(input.delivery_address, 500),
      delivery_district: parseTextField(input.delivery_district, 120),
      finishing: parseStringArrayField(input.finishing),
      pricing_snapshot: parseJsonField<Record<string, any> | null>(input.pricing_snapshot, null),
      files: uploadedFiles,
    });
  }

  // — PUBLIC: Track by number —
  @Get('track/:number')
  async track(@Param('number') number: string) {
    return this.svc.trackByNumber(parseTrackingNumber(number));
  }

  // — CUSTOMER —
  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMy(@Request() req: any) {
    return this.svc.findByCustomer(requestUserId(req));
  }

  // — VENDOR —
  @Get('vendor/pending-count')
  @UseGuards(JwtAuthGuard)
  async vendorPendingCount(@Request() req: any) {
    const count = await this.svc.getVendorPendingCount(requestUserId(req));
    return { count };
  }

  @Get('vendor/my')
  @UseGuards(JwtAuthGuard)
  vendorInquiries(@Request() req: any) {
    return this.svc.findForVendor(requestUserId(req));
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.svc.findOneForUser(parseRouteId(id), requestUserContext(req));
  }

  // — CHAT —
  @Get(':id/messages')
  @UseGuards(OptionalJwtAuthGuard)
  getMessages(@Param('id') id: string, @Request() req: any) {
    return this.svc.getMessagesForUser(parseRouteId(id), requestUserContext(req));
  }

  @Post(':id/messages')
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(FilesInterceptor('attachments', MAX_MESSAGE_ATTACHMENT_COUNT, {
    storage: uploadStorage, fileFilter,
    limits: { fileSize: MAX_MESSAGE_UPLOAD_BYTES },
  }))
  async sendMessage(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any,
  ) {
    const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    const rawUploadFiles = Array.isArray(files) ? files : [];
    const userContext = requestUserContext(req);
    const inquiryId = parseRouteId(id);
    if (rawUploadFiles.length > MAX_MESSAGE_ATTACHMENT_COUNT) {
      throw new BadRequestException('Хавсралтын тоо 3-аас их байж болохгүй');
    }
    const uploadFiles = rawUploadFiles.filter(f => f && typeof f === 'object') as Express.Multer.File[];
    const attachments = uploadFiles.map(f => ({
      name: safeUploadDisplayName(f.originalname), type: safeUploadMimeType(f),
      url: safeUploadUrl(f),
    }));
    return this.svc.sendMessage({
      inquiryId,
      senderId: userContext?.id || 'guest',
      senderName: senderNameFromRequest(input, userContext),
      senderRole: senderRoleFromUser(userContext),
      content: parseMessageContent(input.content),
      attachments,
    }, userContext);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@Param('id') id: string, @Request() req: any) {
    return this.svc.markReadForUser(parseRouteId(id), requestUserContext(req, true));
  }

  // — ADMIN —
  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('sla_overdue') slaOverdue?: string,
    @Query('pricing_delta') pricingDelta?: string,
    @Query('pricing_delta_severity') pricingDeltaSeverity?: string,
    @Query('pricing_verified') pricingVerified?: string,
    @Query('pricing_unverified') pricingUnverified?: string,
    @Query('pricing_unverified_reason') pricingUnverifiedReason?: string,
    @Query('pricing_manual_review') pricingManualReview?: string,
    @Query('pricing_snapshot_missing') pricingSnapshotMissing?: string,
    @Query('pricing_action_required') pricingActionRequired?: string,
  ) {
    return this.svc.findAll({
      status: parseOptionalEnumFilter(status, Object.values(InquiryStatus), 'status'),
      category: parseTextField(category, 120) || undefined,
      slaOverdue: parseQueryFlag(slaOverdue),
      pricingDelta: parseQueryFlag(pricingDelta),
      pricingDeltaSeverity: parseOptionalEnumFilter(pricingDeltaSeverity, ['minor', 'warning', 'critical'], 'pricing_delta_severity'),
      pricingVerified: parseQueryFlag(pricingVerified),
      pricingUnverified: parseQueryFlag(pricingUnverified),
      pricingUnverifiedReason: parseOptionalEnumFilter(pricingUnverifiedReason, ['missing_size', 'missing_material'], 'pricing_unverified_reason'),
      pricingManualReview: parseQueryFlag(pricingManualReview),
      pricingSnapshotMissing: parseQueryFlag(pricingSnapshotMissing),
      pricingActionRequired: parseQueryFlag(pricingActionRequired),
    });
  }

  @Get('admin/summary')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getSummary() {
    return this.svc.getSummary();
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, AdminGuard)
  assign(@Param('id') id: string, @Body('admin_id') adminId: string) {
    return this.svc.assign(parseRouteId(id), parseRequiredId(adminId, 'admin_id'));
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: InquiryStatus,
    @Body('note') note?: string,
  ) {
    return this.svc.updateStatus(parseRouteId(id), parseInquiryStatus(status), parseTextField(note, 1000) || undefined);
  }

  @Post(':id/quote')
  @UseGuards(JwtAuthGuard, AdminGuard)
  sendQuote(
    @Param('id') id: string,
    @Body('price') price: number,
    @Body('notes') notes: string,
    @Body('source') source?: 'manual' | 'auto_verified',
  ) {
    return this.svc.sendQuote(parseRouteId(id), parseQuotePrice(price), parseTextField(notes, 1000) || '', parseQuoteSource(source));
  }

  // ─── Admin assigns inquiry to a specific vendor ───
  @Post(':id/reprice')
  @UseGuards(JwtAuthGuard, AdminGuard)
  reprice(@Param('id') id: string) {
    return this.svc.reprice(parseRouteId(id));
  }

  @Post(':id/assign-vendor')
  @UseGuards(JwtAuthGuard, AdminGuard)
  assignVendor(
    @Param('id') id: string,
    @Body('vendorId') vendorId: string,
    @Body('note') note?: string,
  ) {
    return this.svc.assignVendor(parseRouteId(id), parseRequiredId(vendorId, 'vendorId'), parseTextField(note, 1000) || undefined);
  }

  // ─── Admin multi-vendor broadcast (race flow) ───
  @Post(':id/broadcast')
  @UseGuards(JwtAuthGuard, AdminGuard)
  broadcast(@Param('id') id: string, @Body('vendorIds') vendorIds: string[]) {
    if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
      throw new BadRequestException('vendorIds хоосон байна');
    }
    if (vendorIds.length > 50) {
      throw new BadRequestException('vendorIds 50-аас их байж болохгүй');
    }
    const safeVendorIds = Array.from(new Set(vendorIds.map(vendorId => parseRouteId(vendorId, 'vendorIds'))));
    return this.svc.broadcastToVendors(parseRouteId(id), safeVendorIds);
  }

  // ─── Admin force SLA re-assign ───
  @Post(':id/force-reassign')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async forceReassign(@Param('id') id: string) {
    const inquiryId = parseRouteId(id);
    const inquiry = await this.svc.findOne(inquiryId);
    if (!inquiry) throw new NotFoundException('Захиалга олдсонгүй');
    if (!inquiry.vendor_id) throw new BadRequestException('Vendor оноогдоогүй захиалгыг дахин оноох боломжгүй');
    await this.svc.checkSLATimeout(inquiryId, inquiry.vendor_id);
    return { ok: true };
  }

  // ─── Vendor accept/reject workflow ───
  @Post(':id/vendor-accept')
  @UseGuards(JwtAuthGuard)
  vendorAccept(@Param('id') id: string, @Request() req: any) {
    return this.svc.vendorAccept(parseRouteId(id), requestUserId(req));
  }

  @Post(':id/vendor-reject')
  @UseGuards(JwtAuthGuard)
  vendorReject(@Param('id') id: string, @Request() req: any) {
    return this.svc.vendorReject(parseRouteId(id), requestUserId(req));
  }
}
