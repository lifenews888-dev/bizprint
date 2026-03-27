import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import {
  CreatorApplication,
  ApplicationStatus,
} from './entities/creator-application.entity';
import {
  UgcRequest,
  UgcRequestStatus,
  UgcPackage as UgcPackageEnum,
} from './entities/ugc-request.entity';
import { UgcPackage } from './entities/ugc-package.entity';
import { LiveBooking, LiveBookingStatus } from './entities/live-booking.entity';
import { CreatorRating, CreatorType, VALID_CAPABILITIES } from './entities/creator-rating.entity';
import { ServicePricing } from './entities/service-pricing.entity';
import { CreatorPortfolio } from './entities/creator-portfolio.entity';
import { CreatorContract, ContractStatus } from './entities/creator-contract.entity';
import { CreatorPenalty, PenaltyType, PenaltyReason } from './entities/creator-penalty.entity';
import { CreatorPermission } from './entities/creator-permission.entity';
import { OrderComment, CommentRole } from './entities/order-comment.entity';

/** Package pricing in MNT */
const PACKAGE_PRICES: Record<string, number> = {
  starter: 99000,
  growth: 249000,
  pro: 599000,
  custom: 0,
  per_piece: 0, // per-piece uses unit_price * quantity
};

/** Per-piece pricing in MNT */
const PIECE_PRICES: Record<string, number> = {
  poster: 35000,
  flyer: 25000,
  banner: 45000,
  social_post: 15000,
  story_reel: 20000,
  logo: 80000,
  brochure: 40000,
  business_card: 20000,
  menu: 35000,
  invitation: 25000,
  video: 150000,
  photo: 30000,
  other: 30000,
};

/** Platform commission rate */
const PLATFORM_FEE_RATE = 0.2; // 20%

@Injectable()
export class CreatorService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(CreatorApplication)
    private applicationRepo: Repository<CreatorApplication>,
    @InjectRepository(UgcRequest)
    private ugcRepo: Repository<UgcRequest>,
    @InjectRepository(UgcPackage)
    private packageRepo: Repository<UgcPackage>,
    @InjectRepository(LiveBooking)
    private liveRepo: Repository<LiveBooking>,
    @InjectRepository(CreatorRating)
    private ratingRepo: Repository<CreatorRating>,
    @InjectRepository(ServicePricing)
    private pricingRepo: Repository<ServicePricing>,
    @InjectRepository(CreatorPortfolio)
    private portfolioRepo: Repository<CreatorPortfolio>,
    @InjectRepository(CreatorContract)
    private contractRepo: Repository<CreatorContract>,
    @InjectRepository(CreatorPenalty)
    private penaltyRepo: Repository<CreatorPenalty>,
    @InjectRepository(CreatorPermission)
    private permissionRepo: Repository<CreatorPermission>,
    @InjectRepository(OrderComment)
    private commentRepo: Repository<OrderComment>,
  ) {}

  /* ═══════════════════════════════════════
   *  CREATOR APPLICATION
   * ═══════════════════════════════════════ */

  async applyForCreator(userId: string, data: {
    bio?: string;
    skills?: string[];
    capabilities?: string[];
    portfolio_url?: string;
    sample_urls?: string[];
    motivation?: string;
  }) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Хэрэглэгч олдсонгүй');

    if (user.is_creator) {
      throw new BadRequestException('Та аль хэдийн Creator болсон байна');
    }

    // Check for existing pending application
    const existing = await this.applicationRepo.findOne({
      where: { user_id: userId, status: ApplicationStatus.PENDING },
    });
    if (existing) {
      throw new BadRequestException('Танд хүлээгдэж буй өргөдөл байна');
    }

    // Validate capabilities
    const caps = data.capabilities?.length ? data.capabilities : ['ugc'];
    const invalid = caps.filter(c => !VALID_CAPABILITIES.includes(c as any));
    if (invalid.length) {
      throw new BadRequestException(`Буруу чадвар: ${invalid.join(', ')}`);
    }

    const app = this.applicationRepo.create({
      user_id: userId,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      bio: data.bio,
      skills: data.skills,
      capabilities: caps,
      portfolio_url: data.portfolio_url,
      sample_urls: data.sample_urls,
      motivation: data.motivation,
    });

    user.creator_status = 'pending';
    await this.userRepo.save(user);

    return this.applicationRepo.save(app);
  }

  async getMyApplication(userId: string) {
    return this.applicationRepo.findOne({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  /** Admin: list all applications */
  async listApplications(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.applicationRepo.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  /** Admin: approve application */
  async approveApplication(appId: string, adminId: string) {
    const app = await this.applicationRepo.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException('Өргөдөл олдсонгүй');
    if (app.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('Зөвхөн хүлээгдэж буй өргөдлийг батлах боломжтой');
    }

    app.status = ApplicationStatus.APPROVED;
    app.reviewed_by = adminId;
    app.reviewed_at = new Date();
    await this.applicationRepo.save(app);

    // Upgrade user
    const user = await this.userRepo.findOne({ where: { id: app.user_id } });
    if (user) {
      user.is_creator = true;
      user.creator_status = 'approved';
      user.creator_approved_at = new Date();
      user.creator_bio = app.bio;
      user.creator_skills = app.skills;
      user.creator_capabilities = app.capabilities?.length ? app.capabilities : ['ugc'];
      user.portfolio_url = app.portfolio_url;
      await this.userRepo.save(user);
    }

    return app;
  }

  /** Admin: reject application */
  async rejectApplication(appId: string, adminId: string, reason: string) {
    const app = await this.applicationRepo.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException('Өргөдөл олдсонгүй');

    app.status = ApplicationStatus.REJECTED;
    app.reviewed_by = adminId;
    app.reviewed_at = new Date();
    app.reject_reason = reason;
    await this.applicationRepo.save(app);

    const user = await this.userRepo.findOne({ where: { id: app.user_id } });
    if (user) {
      user.creator_status = 'rejected';
      await this.userRepo.save(user);
    }

    return app;
  }

  /* ═══════════════════════════════════════
   *  UGC REQUESTS
   * ═══════════════════════════════════════ */

  /** Customer creates a UGC request */
  async createUgcRequest(customerId: string, data: {
    title: string;
    description: string;
    content_type: string;
    creator_type?: string;
    package: string;
    quantity?: number;
    deadline?: string;
    reference_urls?: string[];
    brand_notes?: string;
    budget?: number;
  }) {
    const user = await this.userRepo.findOne({ where: { id: customerId } });
    if (!user) throw new NotFoundException('Хэрэглэгч олдсонгүй');

    const pkgStr = data.package || 'per_piece';
    const qty = data.quantity || 1;

    let budget: number;
    let maxRevisions: number;
    let pkgLabel = pkgStr;

    // Check if package is a UUID (DB package ID)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pkgStr);

    if (isUuid) {
      // DB package mode — look up the package
      const dbPkg = await this.packageRepo.findOne({ where: { id: pkgStr } });
      if (dbPkg) {
        budget = data.budget || Number(dbPkg.discount_price || dbPkg.price) || 0;
        maxRevisions = 3;
        pkgLabel = dbPkg.slug || dbPkg.name || 'custom';
      } else {
        budget = data.budget || 0;
        maxRevisions = 2;
        pkgLabel = 'custom';
      }
    } else if (pkgStr === 'per_piece' || data.budget) {
      // Per-piece mode: unit_price * quantity
      const unitPrice = PIECE_PRICES[data.content_type] || 30000;
      budget = data.budget || (unitPrice * qty);
      maxRevisions = 2;
    } else {
      // Legacy package mode: fixed price by key
      budget = PACKAGE_PRICES[pkgStr] || data.budget || 0;
      maxRevisions = pkgStr === 'pro' ? 5 : pkgStr === 'growth' ? 3 : 2;
    }

    const platformFee = Math.round(budget * PLATFORM_FEE_RATE);
    const creatorPayout = budget - platformFee;

    const request = this.ugcRepo.create({
      customer_id: customerId,
      customer_name: user.full_name,
      customer_email: user.email,
      title: data.title,
      description: data.description,
      content_type: data.content_type as any,
      package: isUuid ? 'custom' : pkgStr,
      quantity: qty,
      budget,
      platform_fee: platformFee,
      creator_payout: creatorPayout,
      status: UgcRequestStatus.OPEN,
      deadline: data.deadline ? new Date(data.deadline) : null,
      reference_urls: data.reference_urls,
      brand_notes: data.brand_notes,
      max_revisions: maxRevisions,
      creator_type: data.creator_type || 'social',
    });

    return this.ugcRepo.save(request);
  }

  /** Customer: list my requests */
  async getCustomerRequests(customerId: string) {
    return this.ugcRepo.find({
      where: { customer_id: customerId },
      order: { created_at: 'DESC' },
    });
  }

  /** Creator: list available jobs (OPEN status) */
  async getAvailableJobs() {
    return this.ugcRepo.find({
      where: { status: UgcRequestStatus.OPEN },
      order: { created_at: 'DESC' },
    });
  }

  /** Creator: list my projects */
  async getCreatorProjects(creatorId: string) {
    return this.ugcRepo.find({
      where: { creator_id: creatorId },
      order: { created_at: 'DESC' },
    });
  }

  /** Creator: accept a job */
  async acceptJob(requestId: string, creatorId: string) {
    const request = await this.ugcRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Хүсэлт олдсонгүй');
    if (request.status !== UgcRequestStatus.OPEN) {
      throw new BadRequestException('Энэ ажлыг авах боломжгүй');
    }

    const creator = await this.userRepo.findOne({ where: { id: creatorId } });
    if (!creator?.is_creator) {
      throw new ForbiddenException('Зөвхөн Creator-ууд ажил авах боломжтой');
    }

    request.creator_id = creatorId;
    request.creator_name = creator.full_name;
    request.status = UgcRequestStatus.ASSIGNED;
    return this.ugcRepo.save(request);
  }

  /** Creator: start working */
  async startWork(requestId: string, creatorId: string) {
    const request = await this.findAndVerifyCreator(requestId, creatorId);
    if (request.status !== UgcRequestStatus.ASSIGNED) {
      throw new BadRequestException('Зөвхөн хуваарилагдсан ажлыг эхлүүлэх боломжтой');
    }
    request.status = UgcRequestStatus.IN_PROGRESS;
    return this.ugcRepo.save(request);
  }

  /** Creator: submit deliverables */
  async submitDeliverables(requestId: string, creatorId: string, deliverableUrls: string[]) {
    const request = await this.findAndVerifyCreator(requestId, creatorId);
    if (![UgcRequestStatus.IN_PROGRESS, UgcRequestStatus.REVISION].includes(request.status)) {
      throw new BadRequestException('Одоогоор ажил илгээх боломжгүй');
    }
    request.deliverable_urls = deliverableUrls;
    request.status = UgcRequestStatus.SUBMITTED;
    request.approval_stage = 'review';
    return this.ugcRepo.save(request);
  }

  /* ═══════════════════════════════════════
   *  ZOOM WORKFLOW (social & prepress)
   * ═══════════════════════════════════════ */

  /** Schedule Zoom screen share session */
  async scheduleZoom(requestId: string, creatorId: string, data: {
    scheduled_at: string;
    meeting_id?: string;
    join_url?: string;
    start_url?: string;
    password?: string;
  }) {
    const request = await this.findAndVerifyCreator(requestId, creatorId);
    request.zoom_scheduled_at = new Date(data.scheduled_at);
    request.zoom_meeting_id = data.meeting_id || null;
    request.zoom_join_url = data.join_url || null;
    request.zoom_start_url = data.start_url || null;
    request.zoom_password = data.password || null;
    request.approval_stage = 'screen_share';
    return this.ugcRepo.save(request);
  }

  /** Mark Zoom session as completed */
  async completeZoom(requestId: string, creatorId: string, recordingUrl?: string) {
    const request = await this.findAndVerifyCreator(requestId, creatorId);
    request.zoom_completed = true;
    if (recordingUrl) request.zoom_recording_url = recordingUrl;
    request.approval_stage = 'working';
    request.status = UgcRequestStatus.IN_PROGRESS;
    return this.ugcRepo.save(request);
  }

  /** Submit final production files (prepress) */
  async submitFinalFiles(requestId: string, creatorId: string, data: {
    final_file_urls: string[];
    prepress_specs?: string;
  }) {
    const request = await this.findAndVerifyCreator(requestId, creatorId);
    request.final_file_urls = data.final_file_urls;
    if (data.prepress_specs) request.prepress_specs = data.prepress_specs;
    request.approval_stage = 'final_check';
    request.status = UgcRequestStatus.SUBMITTED;
    return this.ugcRepo.save(request);
  }

  /** Admin/Customer: approve final check */
  async approveFinal(requestId: string, userId: string) {
    const request = await this.ugcRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Хүсэлт олдсонгүй');
    request.approval_stage = 'done';
    request.approved_by = userId;
    request.approved_at = new Date();
    request.status = UgcRequestStatus.APPROVED;
    return this.ugcRepo.save(request);
  }

  /** Customer: approve deliverables */
  async approveDeliverable(requestId: string, customerId: string, rating?: number, review?: string) {
    const request = await this.ugcRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Хүсэлт олдсонгүй');
    if (request.customer_id !== customerId) throw new ForbiddenException();
    if (request.status !== UgcRequestStatus.SUBMITTED) {
      throw new BadRequestException('Зөвхөн илгээсэн ажлыг батлах боломжтой');
    }

    request.status = UgcRequestStatus.APPROVED;
    if (rating) request.rating = rating;
    if (review) request.review = review;
    return this.ugcRepo.save(request);
  }

  /** Customer: request revision */
  async requestRevision(requestId: string, customerId: string, notes: string) {
    const request = await this.ugcRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Хүсэлт олдсонгүй');
    if (request.customer_id !== customerId) throw new ForbiddenException();
    if (request.status !== UgcRequestStatus.SUBMITTED) {
      throw new BadRequestException('Зөвхөн илгээсэн ажилд засвар хүсэх боломжтой');
    }
    if (request.revision_count >= request.max_revisions) {
      throw new BadRequestException(`Засварын дээд хэмжээ (${request.max_revisions}) хэтэрсэн байна`);
    }

    request.status = UgcRequestStatus.REVISION;
    request.revision_count += 1;
    request.revision_notes = notes;
    return this.ugcRepo.save(request);
  }

  /** Admin/System: release payment to creator */
  async releasePayment(requestId: string) {
    const request = await this.ugcRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Хүсэлт олдсонгүй');
    if (request.status !== UgcRequestStatus.APPROVED) {
      throw new BadRequestException('Зөвхөн батлагдсан ажлын төлбөрийг гаргах боломжтой');
    }

    request.status = UgcRequestStatus.COMPLETED;
    request.is_released = true;
    request.released_at = new Date();
    return this.ugcRepo.save(request);
  }

  /** Get single request detail */
  async getRequestDetail(requestId: string) {
    const request = await this.ugcRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Хүсэлт олдсонгүй');
    return request;
  }

  /* ═══════════════════════════════════════
   *  PAYMENT
   * ═══════════════════════════════════════ */

  /** Initiate payment for a UGC request */
  async initiatePayment(requestId: string, customerId: string, method: string) {
    const request = await this.ugcRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Хүсэлт олдсонгүй');
    if (request.customer_id !== customerId) throw new ForbiddenException();
    if (request.is_paid) throw new BadRequestException('Аль хэдийн төлөгдсөн');

    const invoiceNo = `UGC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    request.payment_method = method;
    request.payment_status = 'pending';
    request.invoice_no = invoiceNo;

    // For QR-based payment (QPay, SocialPay), generate placeholder
    // In production, this would call the payment provider API
    if (method === 'qpay' || method === 'socialpay') {
      request.qr_image = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23f3f4f6"/><text x="100" y="100" text-anchor="middle" font-size="14" fill="%23666">${invoiceNo}</text></svg>`;
    }

    await this.ugcRepo.save(request);

    return {
      request_id: request.id,
      invoice_no: invoiceNo,
      amount: Number(request.budget),
      method,
      qr_image: request.qr_image,
      payment_status: 'pending',
    };
  }

  /** Confirm payment (webhook or manual) */
  async confirmPayment(requestId: string, invoiceNo?: string) {
    const where: any = { id: requestId };
    const request = await this.ugcRepo.findOne({ where });
    if (!request) throw new NotFoundException('Хүсэлт олдсонгүй');

    request.is_paid = true;
    request.payment_status = 'paid';
    return this.ugcRepo.save(request);
  }

  /** Admin: list all UGC requests */
  async listAllRequests(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.ugcRepo.find({ where, order: { created_at: 'DESC' } });
  }

  /** Creator earnings summary */
  async getCreatorEarnings(creatorId: string) {
    const projects = await this.ugcRepo.find({
      where: { creator_id: creatorId },
    });

    const completed = projects.filter(p => p.status === UgcRequestStatus.COMPLETED);
    const pending = projects.filter(p =>
      [UgcRequestStatus.APPROVED, UgcRequestStatus.SUBMITTED].includes(p.status),
    );
    const active = projects.filter(p =>
      [UgcRequestStatus.ASSIGNED, UgcRequestStatus.IN_PROGRESS, UgcRequestStatus.REVISION].includes(p.status),
    );

    return {
      total_earned: completed.reduce((sum, p) => sum + Number(p.creator_payout), 0),
      pending_payout: pending.reduce((sum, p) => sum + Number(p.creator_payout), 0),
      active_jobs: active.length,
      completed_jobs: completed.length,
      total_jobs: projects.length,
      avg_rating: completed.length > 0
        ? completed.filter(p => p.rating).reduce((sum, p) => sum + p.rating, 0) /
          completed.filter(p => p.rating).length || 0
        : 0,
    };
  }

  /* ── helpers ── */

  private async findAndVerifyCreator(requestId: string, creatorId: string) {
    const request = await this.ugcRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Хүсэлт олдсонгүй');
    if (request.creator_id !== creatorId) {
      throw new ForbiddenException('Энэ ажил танд хуваарилагдаагүй');
    }
    return request;
  }

  /* ═══════════════════════════════════════
   *  UGC PACKAGES (Admin CRUD)
   * ═══════════════════════════════════════ */

  async createPackage(data: Partial<UgcPackage>) {
    const pkg = this.packageRepo.create(data);
    return this.packageRepo.save(pkg);
  }

  async updatePackage(id: string, data: Partial<UgcPackage>) {
    const pkg = await this.packageRepo.findOne({ where: { id } });
    if (!pkg) throw new NotFoundException('Багц олдсонгүй');
    Object.assign(pkg, data);
    return this.packageRepo.save(pkg);
  }

  async deletePackage(id: string) {
    const pkg = await this.packageRepo.findOne({ where: { id } });
    if (!pkg) throw new NotFoundException('Багц олдсонгүй');
    await this.packageRepo.remove(pkg);
    return { success: true };
  }

  async getPackages(activeOnly = false, serviceType?: string) {
    const where: any = {};
    if (activeOnly) where.is_active = true;
    if (serviceType) where.service_type = serviceType;
    return this.packageRepo.find({ where, order: { sort_order: 'ASC', price: 'ASC' } });
  }

  async getPackageBySlug(slug: string) {
    const pkg = await this.packageRepo.findOne({ where: { slug } });
    if (!pkg) throw new NotFoundException('Багц олдсонгүй');
    return pkg;
  }

  /* ═══════════════════════════════════════
   *  LIVE BOOKINGS
   * ═══════════════════════════════════════ */

  async createLiveBooking(customerId: string, data: {
    title: string;
    description?: string;
    platform: string;
    scheduled_at: string;
    duration_minutes?: number;
    budget?: number;
    product_name?: string;
    reference_urls?: string[];
  }) {
    const user = await this.userRepo.findOne({ where: { id: customerId } });
    if (!user) throw new NotFoundException('Хэрэглэгч олдсонгүй');

    const budget = data.budget || 200000;
    const platformFee = Math.round(budget * 0.2);

    const booking = this.liveRepo.create({
      customer_id: customerId,
      customer_name: user.full_name,
      title: data.title,
      description: data.description,
      platform: data.platform as any,
      scheduled_at: new Date(data.scheduled_at),
      duration_minutes: data.duration_minutes || 60,
      budget,
      platform_fee: platformFee,
      creator_payout: budget - platformFee,
      product_name: data.product_name,
      reference_urls: data.reference_urls,
    });

    return this.liveRepo.save(booking);
  }

  async getCustomerLiveBookings(customerId: string) {
    return this.liveRepo.find({
      where: { customer_id: customerId },
      order: { created_at: 'DESC' },
    });
  }

  async getCreatorLiveBookings(creatorId: string) {
    return this.liveRepo.find({
      where: { creator_id: creatorId },
      order: { scheduled_at: 'ASC' },
    });
  }

  async getAvailableLiveJobs() {
    return this.liveRepo.find({
      where: { status: LiveBookingStatus.PENDING },
      order: { scheduled_at: 'ASC' },
    });
  }

  async acceptLiveJob(bookingId: string, creatorId: string) {
    const booking = await this.liveRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Захиалга олдсонгүй');
    if (booking.status !== LiveBookingStatus.PENDING) throw new BadRequestException('Энэ захиалгыг авах боломжгүй');

    const creator = await this.userRepo.findOne({ where: { id: creatorId } });
    if (!creator?.is_creator || !creator.creator_capabilities?.includes('live')) {
      throw new ForbiddenException('Live чадвартай Creator шаардлагатай');
    }

    booking.creator_id = creatorId;
    booking.creator_name = creator.full_name;
    booking.status = LiveBookingStatus.CONFIRMED;
    return this.liveRepo.save(booking);
  }

  async completeLiveBooking(bookingId: string, creatorId: string, data: {
    stream_url?: string;
    recording_url?: string;
    viewer_count?: number;
  }) {
    const booking = await this.liveRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Захиалга олдсонгүй');
    if (booking.creator_id !== creatorId) throw new ForbiddenException();

    booking.status = LiveBookingStatus.COMPLETED;
    if (data.stream_url) booking.stream_url = data.stream_url;
    if (data.recording_url) booking.recording_url = data.recording_url;
    if (data.viewer_count) booking.viewer_count = data.viewer_count;
    return this.liveRepo.save(booking);
  }

  async getAllLiveBookings() {
    return this.liveRepo.find({ order: { created_at: 'DESC' } });
  }

  /* ═══════════════════════════════════════
   *  CREATOR RATINGS
   * ═══════════════════════════════════════ */

  async submitRating(customerId: string, data: {
    creator_id: string;
    job_id: string;
    creator_type: string;
    overall: number;
    content_quality?: number;
    creativity?: number;
    engagement_potential?: number;
    design_quality?: number;
    deadline_adherence?: number;
    communication?: number;
    live_performance?: number;
    sales_ability?: number;
    audience_engagement?: number;
    review?: string;
  }) {
    const customer = await this.userRepo.findOne({ where: { id: customerId } });

    // Check for existing rating for this job
    const existing = await this.ratingRepo.findOne({
      where: { job_id: data.job_id, customer_id: customerId },
    });
    if (existing) throw new BadRequestException('Та энэ ажлыг аль хэдийн үнэлсэн');

    const rating = this.ratingRepo.create({
      ...data,
      creator_type: data.creator_type as CreatorType,
      customer_id: customerId,
      customer_name: customer?.full_name || '',
    });

    return this.ratingRepo.save(rating);
  }

  async getCreatorRatings(creatorId: string, type?: string) {
    const where: any = { creator_id: creatorId };
    if (type) where.creator_type = type;
    return this.ratingRepo.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async getCreatorRatingStats(creatorId: string) {
    const ratings = await this.ratingRepo.find({ where: { creator_id: creatorId } });
    if (ratings.length === 0) return { avg: 0, count: 0, byType: {} };

    const avg = ratings.reduce((s, r) => s + Number(r.overall), 0) / ratings.length;

    // Group by type
    const byType: Record<string, { avg: number; count: number; metrics: Record<string, number> }> = {};

    for (const type of ['social', 'prepress', 'live', 'ugc', 'design']) {
      const typeRatings = ratings.filter(r => r.creator_type === type);
      if (typeRatings.length === 0) continue;

      const typeAvg = typeRatings.reduce((s, r) => s + Number(r.overall), 0) / typeRatings.length;
      const metrics: Record<string, number> = {};

      // Compute average for each metric
      const metricKeys = type === 'social' || type === 'ugc'
        ? ['content_quality', 'creativity', 'engagement_potential']
        : type === 'prepress' || type === 'design'
        ? ['design_quality', 'deadline_adherence', 'communication', 'file_accuracy', 'zoom_session_quality']
        : ['live_performance', 'sales_ability', 'audience_engagement'];

      for (const key of metricKeys) {
        const vals = typeRatings.filter(r => (r as any)[key] != null).map(r => Number((r as any)[key]));
        metrics[key] = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      }

      byType[type] = { avg: typeAvg, count: typeRatings.length, metrics };
    }

    // Rating distribution (1-5)
    const distribution = [0, 0, 0, 0, 0];
    ratings.forEach(r => {
      const bucket = Math.min(Math.max(Math.round(Number(r.overall)), 1), 5) - 1;
      distribution[bucket]++;
    });

    return { avg: Math.round(avg * 10) / 10, count: ratings.length, byType, distribution };
  }

  /** Get top creators by rating */
  async getTopCreators(type?: string, limit = 10) {
    // Get all approved creators
    const creators = await this.applicationRepo.find({
      where: { status: 'approved' as any },
    });

    const results = [];
    for (const creator of creators) {
      const stats = await this.getCreatorRatingStats(creator.user_id);
      if (stats.count === 0) continue;

      results.push({
        user_id: creator.user_id,
        full_name: creator.full_name,
        email: creator.email,
        skills: creator.skills,
        capabilities: (creator as any).capabilities,
        rating: stats.avg,
        rating_count: stats.count,
        byType: stats.byType,
      });
    }

    // Sort by rating descending
    results.sort((a, b) => b.rating - a.rating);
    return results.slice(0, limit);
  }

  /** Get rating analytics */
  async getRatingAnalytics() {
    const allRatings = await this.ratingRepo.find();
    const totalCount = allRatings.length;
    if (totalCount === 0) return { totalCount: 0, avgRating: 0, byType: {}, distribution: [0,0,0,0,0], recentTrend: [] };

    const avgRating = allRatings.reduce((s, r) => s + Number(r.overall), 0) / totalCount;

    const byType: Record<string, { avg: number; count: number }> = {};
    for (const type of ['social', 'prepress', 'live', 'ugc', 'design']) {
      const typeR = allRatings.filter(r => r.creator_type === type);
      if (typeR.length > 0) {
        byType[type] = {
          avg: typeR.reduce((s, r) => s + Number(r.overall), 0) / typeR.length,
          count: typeR.length,
        };
      }
    }

    const distribution = [0, 0, 0, 0, 0];
    allRatings.forEach(r => {
      const bucket = Math.min(Math.max(Math.round(Number(r.overall)), 1), 5) - 1;
      distribution[bucket]++;
    });

    return {
      totalCount,
      avgRating: Math.round(avgRating * 10) / 10,
      byType,
      distribution,
    };
  }

  /* ═══════════════════════════════════════
   *  SERVICE PRICING (Admin)
   * ═══════════════════════════════════════ */

  async getPricingList(serviceType?: string) {
    const where: any = {};
    if (serviceType) where.service_type = serviceType;
    return this.pricingRepo.find({ where, order: { service_type: 'ASC', sort_order: 'ASC' } });
  }

  async upsertPricing(data: Partial<ServicePricing>) {
    // Auto-calculate final price
    if (data.base_price != null && data.margin_percent != null) {
      data.final_price = Number(data.base_price) * (1 + Number(data.margin_percent) / 100);
    }

    if (data.id) {
      const existing = await this.pricingRepo.findOne({ where: { id: data.id } });
      if (existing) {
        Object.assign(existing, data);
        return this.pricingRepo.save(existing);
      }
    }

    // Check for existing by service_type + content_type
    if (data.service_type && data.content_type) {
      const existing = await this.pricingRepo.findOne({
        where: { service_type: data.service_type, content_type: data.content_type },
      });
      if (existing) {
        Object.assign(existing, data);
        return this.pricingRepo.save(existing);
      }
    }

    const pricing = this.pricingRepo.create(data);
    return this.pricingRepo.save(pricing);
  }

  async deletePricing(id: string) {
    await this.pricingRepo.delete(id);
    return { success: true };
  }

  /** Get customer-facing price for a content type */
  async getPrice(serviceType: string, contentType: string, isRush = false) {
    const pricing = await this.pricingRepo.findOne({
      where: { service_type: serviceType, content_type: contentType, is_active: true },
    });
    if (!pricing) return null;

    const basePrice = Number(pricing.final_price);
    const rushMultiplier = isRush ? Number(pricing.rush_multiplier) : 1;

    return {
      base_price: Number(pricing.base_price),
      margin_percent: Number(pricing.margin_percent),
      final_price: basePrice,
      rush_price: Math.round(basePrice * rushMultiplier),
      revision_cost: Number(pricing.revision_cost),
      free_revisions: pricing.free_revisions,
      bonus_commission: Number(pricing.bonus_commission),
    };
  }

  /** Seed default pricing if empty */
  async seedDefaultPricing() {
    const count = await this.pricingRepo.count();
    if (count > 0) return { message: 'Pricing already exists' };

    const defaults = [
      // Social content
      { service_type: 'social', content_type: 'poster', label: 'Постер', base_price: 28000, margin_percent: 25, revision_cost: 5000, free_revisions: 2, sort_order: 1 },
      { service_type: 'social', content_type: 'flyer', label: 'Флаер', base_price: 20000, margin_percent: 25, revision_cost: 4000, free_revisions: 2, sort_order: 2 },
      { service_type: 'social', content_type: 'banner', label: 'Баннер', base_price: 36000, margin_percent: 25, revision_cost: 6000, free_revisions: 2, sort_order: 3 },
      { service_type: 'social', content_type: 'social_post', label: 'Соц.Пост', base_price: 12000, margin_percent: 25, revision_cost: 3000, free_revisions: 2, sort_order: 4 },
      { service_type: 'social', content_type: 'story_reel', label: 'Story/Reel', base_price: 16000, margin_percent: 25, revision_cost: 4000, free_revisions: 2, sort_order: 5 },
      { service_type: 'social', content_type: 'logo', label: 'Лого', base_price: 64000, margin_percent: 25, revision_cost: 10000, free_revisions: 3, sort_order: 6 },
      // Prepress
      { service_type: 'prepress', content_type: 'business_card', label: 'Нэрийн хуудас', base_price: 16000, margin_percent: 25, revision_cost: 3000, free_revisions: 2, sort_order: 1 },
      { service_type: 'prepress', content_type: 'brochure', label: 'Брошур', base_price: 32000, margin_percent: 25, revision_cost: 6000, free_revisions: 2, sort_order: 2 },
      { service_type: 'prepress', content_type: 'menu', label: 'Цэс/Меню', base_price: 28000, margin_percent: 25, revision_cost: 5000, free_revisions: 2, sort_order: 3 },
      { service_type: 'prepress', content_type: 'banner_print', label: 'Хэвлэл баннер', base_price: 40000, margin_percent: 25, revision_cost: 8000, free_revisions: 2, sort_order: 4 },
      // Live
      { service_type: 'live', content_type: 'hourly', label: 'Цагийн үнэ', base_price: 160000, margin_percent: 25, bonus_commission: 5, min_duration: 60, revision_cost: 0, free_revisions: 0, sort_order: 1 },
      { service_type: 'live', content_type: 'half_hour', label: '30 минут', base_price: 100000, margin_percent: 25, bonus_commission: 5, min_duration: 30, revision_cost: 0, free_revisions: 0, sort_order: 2 },
      // AI Creator
      { service_type: 'ai', content_type: 'ai_image', label: 'AI зураг', base_price: 24000, margin_percent: 25, revision_cost: 5000, free_revisions: 2, sort_order: 1 },
      { service_type: 'ai', content_type: 'ai_video', label: 'AI видео', base_price: 80000, margin_percent: 25, revision_cost: 15000, free_revisions: 1, sort_order: 2 },
      { service_type: 'ai', content_type: 'ai_avatar', label: 'AI аватар', base_price: 40000, margin_percent: 25, revision_cost: 8000, free_revisions: 2, sort_order: 3 },
      { service_type: 'ai', content_type: 'photo_restore', label: 'Зураг сэргээх', base_price: 24000, margin_percent: 25, revision_cost: 5000, free_revisions: 2, sort_order: 4 },
      { service_type: 'ai', content_type: 'memory_photo', label: 'Дурсамж зураг', base_price: 32000, margin_percent: 25, revision_cost: 6000, free_revisions: 2, sort_order: 5 },
    ];

    for (const d of defaults) {
      const pricing = this.pricingRepo.create({
        ...d,
        final_price: d.base_price * (1 + d.margin_percent / 100),
        rush_multiplier: 1.5,
        is_active: true,
      });
      await this.pricingRepo.save(pricing);
    }

    return { message: 'Default pricing seeded', count: defaults.length };
  }

  /* ═══════════════════════════════════════
   *  PORTFOLIO
   * ═══════════════════════════════════════ */

  async addPortfolioItem(creatorId: string, data: Partial<CreatorPortfolio>) {
    const item = this.portfolioRepo.create({ ...data, creator_id: creatorId });
    return this.portfolioRepo.save(item);
  }

  async getCreatorPortfolio(creatorId: string) {
    return this.portfolioRepo.find({
      where: { creator_id: creatorId, is_active: true },
      order: { sort_order: 'ASC', created_at: 'DESC' },
    });
  }

  async updatePortfolioItem(itemId: string, creatorId: string, data: Partial<CreatorPortfolio>) {
    const item = await this.portfolioRepo.findOne({ where: { id: itemId, creator_id: creatorId } });
    if (!item) throw new NotFoundException('Portfolio зүйл олдсонгүй');
    Object.assign(item, data);
    return this.portfolioRepo.save(item);
  }

  async deletePortfolioItem(itemId: string, creatorId: string) {
    const item = await this.portfolioRepo.findOne({ where: { id: itemId, creator_id: creatorId } });
    if (!item) throw new NotFoundException('Portfolio зүйл олдсонгүй');
    await this.portfolioRepo.remove(item);
    return { success: true };
  }

  async incrementPortfolioView(itemId: string) {
    await this.portfolioRepo.increment({ id: itemId }, 'views', 1);
    return { success: true };
  }

  async likePortfolioItem(itemId: string) {
    await this.portfolioRepo.increment({ id: itemId }, 'likes', 1);
    return { success: true };
  }

  /** Browse all portfolio items (public) */
  async browsePortfolio(category?: string, limit = 20) {
    const where: any = { is_active: true };
    if (category) where.category = category;
    return this.portfolioRepo.find({
      where,
      order: { likes: 'DESC', views: 'DESC' },
      take: limit,
    });
  }

  /* ═══════════════════════════════════════
   *  ORDER MATCHING ALGORITHM
   * ═══════════════════════════════════════ */

  async matchCreators(data: {
    service_type: string;
    content_type?: string;
    budget?: number;
    deadline?: string;
  }) {
    // Get all approved creators
    const allApps = await this.applicationRepo.find({
      where: { status: 'approved' as any },
    });

    const results: any[] = [];

    for (const app of allApps) {
      const user = await this.userRepo.findOne({ where: { id: app.user_id } });
      if (!user || !user.is_creator) continue;

      const caps = user.creator_capabilities || [];
      const skills = user.creator_skills || [];

      // 1. Capability match
      let capMatch = false;
      if (data.service_type === 'ai' && caps.includes('ai')) capMatch = true;
      else if (data.service_type === 'social' && (caps.includes('social') || caps.includes('ugc'))) capMatch = true;
      else if (data.service_type === 'prepress' && (caps.includes('prepress') || caps.includes('design'))) capMatch = true;
      else if (data.service_type === 'live' && caps.includes('live')) capMatch = true;
      if (!capMatch) continue;

      // 2. Skill match (for content_type)
      let skillScore = 0.5; // default
      if (data.content_type && skills.includes(data.content_type)) skillScore = 1;

      // 3. Rating
      const ratings = await this.ratingRepo.find({ where: { creator_id: app.user_id } });
      const avgRating = ratings.length > 0
        ? ratings.reduce((s, r) => s + Number(r.overall), 0) / ratings.length
        : 3; // default rating
      const ratingScore = avgRating / 5;

      // 4. Completed jobs count
      const jobs = await this.ugcRepo.find({ where: { creator_id: app.user_id, status: 'completed' as any } });
      const jobScore = Math.min(jobs.length / 10, 1); // cap at 10 jobs

      // 5. Portfolio items count
      const portfolio = await this.portfolioRepo.count({ where: { creator_id: app.user_id, is_active: true } });
      const portfolioScore = Math.min(portfolio / 5, 1); // cap at 5 items

      // Calculate final score
      const score =
        (skillScore * 0.3) +
        (ratingScore * 0.25) +
        (jobScore * 0.2) +
        (portfolioScore * 0.15) +
        (0.5 * 0.1); // activity placeholder

      results.push({
        creator_id: app.user_id,
        full_name: user.full_name,
        email: user.email,
        avatar_url: user.avatar_url,
        capabilities: caps,
        skills,
        rating: Math.round(avgRating * 10) / 10,
        rating_count: ratings.length,
        completed_jobs: jobs.length,
        portfolio_count: portfolio,
        score: Math.round(score * 100) / 100,
        bio: user.creator_bio,
      });
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 10);
  }

  /* ═══════════════════════════════════════
   *  CREATOR SCORE & AUTO-LEVEL
   * ═══════════════════════════════════════ */

  /** Calculate creator score (0-100) and determine level */
  async calculateCreatorScore(creatorId: string): Promise<{
    score: number; level: string; breakdown: Record<string, number>;
    ratingScore: number; performanceScore: number; activityScore: number;
  }> {
    const projects = await this.ugcRepo.find({ where: { creator_id: creatorId } });
    const ratings = await this.ratingRepo.find({ where: { creator_id: creatorId } });
    const completed = projects.filter(p => p.status === UgcRequestStatus.COMPLETED);
    const cancelled = projects.filter(p => p.status === UgcRequestStatus.CANCELLED);
    const totalJobs = projects.length;

    // 1. Customer Rating (40%) — avg rating normalized to 0-100
    const avgRating = ratings.length > 0
      ? ratings.reduce((s, r) => s + Number(r.overall), 0) / ratings.length
      : 0;
    const ratingScore = avgRating > 0 ? (avgRating / 5) * 100 : 0;

    // 2. Performance (25%) — deadline adherence + low cancellation
    const cancellationRate = totalJobs > 0 ? cancelled.length / totalJobs : 0;
    const deadlineAdherence = completed.length > 0
      ? completed.filter(p => p.deadline && new Date(p.updated_at) <= new Date(p.deadline)).length / completed.length
      : 0.5; // neutral if no deadline data
    const performanceScore = ((1 - cancellationRate) * 50) + (deadlineAdherence * 50);

    // 3. Activity (20%) — completed jobs (capped at 50 = 100%)
    const activityScore = Math.min(completed.length / 50, 1) * 100;

    // 4. Weighted final score
    const score = Math.round(
      (ratingScore * 0.4) +
      (performanceScore * 0.25) +
      (activityScore * 0.2) +
      // Self-eval placeholder (10%) + admin (5%) = 15% neutral baseline
      (50 * 0.15)
    );

    // Determine level
    let level = 'starter';
    if (score >= 80 && completed.length >= 30) level = 'elite';
    else if (score >= 60 && completed.length >= 15) level = 'expert';
    else if (score >= 40 && completed.length >= 5) level = 'pro';

    return {
      score: Math.min(score, 100),
      level,
      breakdown: {
        rating: Math.round(ratingScore),
        performance: Math.round(performanceScore),
        activity: Math.round(activityScore),
      },
      ratingScore: Math.round(ratingScore),
      performanceScore: Math.round(performanceScore),
      activityScore: Math.round(activityScore),
    };
  }

  /** Calculate dynamic ranking score (0-100) — short-term performance */
  async calculateRankScore(creatorId: string, periodDays = 30): Promise<{
    rankScore: number; breakdown: Record<string, number>;
  }> {
    const since = new Date(Date.now() - periodDays * 86400000);
    const allProjects = await this.ugcRepo.find({ where: { creator_id: creatorId } });
    const recentProjects = allProjects.filter(p => new Date(p.created_at) >= since);
    const recentCompleted = recentProjects.filter(p => p.status === UgcRequestStatus.COMPLETED);
    const recentTotal = recentProjects.length;

    const ratings = await this.ratingRepo.find({ where: { creator_id: creatorId } });
    const recentRatings = ratings.filter(r => new Date(r.created_at) >= since);

    // 1. Recent performance (35%) — completion rate in period
    const recentPerformance = recentTotal > 0
      ? (recentCompleted.length / recentTotal) * 100
      : 0;

    // 2. Customer rating (25%) — recent or all-time
    const ratingPool = recentRatings.length >= 3 ? recentRatings : ratings;
    const avgRating = ratingPool.length > 0
      ? ratingPool.reduce((s, r) => s + Number(r.overall), 0) / ratingPool.length
      : 0;
    const customerRating = (avgRating / 5) * 100;

    // 3. Conversion rate (15%) — assigned or completed / total received
    const assigned = allProjects.filter(p => !['cancelled', 'draft', 'open'].includes(p.status));
    const conversionRate = allProjects.length > 0
      ? (assigned.length / allProjects.length) * 100
      : 0;

    // 4. Activity (15%) — recent jobs weighted
    const activityScore = Math.min(recentCompleted.length / 10, 1) * 100;

    // 5. Response speed (10%) — placeholder (would need message timestamps)
    const responseSpeed = 70; // neutral default

    const rankScore = Math.round(
      (recentPerformance * 0.35) +
      (customerRating * 0.25) +
      (conversionRate * 0.15) +
      (activityScore * 0.15) +
      (responseSpeed * 0.10)
    );

    return {
      rankScore: Math.min(rankScore, 100),
      breakdown: {
        recentPerformance: Math.round(recentPerformance),
        customerRating: Math.round(customerRating),
        conversionRate: Math.round(conversionRate),
        activity: Math.round(activityScore),
        responseSpeed,
      },
    };
  }

  /** Get leaderboard — top creators ranked */
  async getLeaderboard(periodDays = 30, limit = 20) {
    const apps = await this.applicationRepo.find({
      where: { status: ApplicationStatus.APPROVED },
    });

    const results: any[] = [];
    for (const app of apps) {
      const { rankScore, breakdown } = await this.calculateRankScore(app.user_id, periodDays);
      const { score, level } = await this.calculateCreatorScore(app.user_id);
      const projects = await this.ugcRepo.find({ where: { creator_id: app.user_id } });
      const completed = projects.filter(p => p.status === UgcRequestStatus.COMPLETED);

      results.push({
        creator_id: app.user_id,
        name: app.full_name,
        email: app.email,
        level,
        levelScore: score,
        rankScore,
        breakdown,
        completedJobs: completed.length,
        totalEarned: completed.reduce((s, p) => s + Number(p.creator_payout), 0),
        capabilities: app.capabilities,
      });
    }

    results.sort((a, b) => b.rankScore - a.rankScore);
    return results.slice(0, limit).map((r, i) => ({ ...r, rank: i + 1 }));
  }

  /** Recalculate and auto-update creator level */
  async refreshCreatorLevel(creatorId: string) {
    const { score, level } = await this.calculateCreatorScore(creatorId);
    // Update user's level (stored on application or user entity)
    const app = await this.applicationRepo.findOne({
      where: { user_id: creatorId, status: ApplicationStatus.APPROVED },
      order: { created_at: 'DESC' },
    });
    if (app) {
      (app as any).level = level;
      (app as any).score = score;
      await this.applicationRepo.save(app);
    }
    return { score, level };
  }

  /* ═══════════════════════════════════════
   *  GOVERNANCE: PERMISSIONS
   * ═══════════════════════════════════════ */

  async getPermissions(creatorId: string) {
    let perm = await this.permissionRepo.findOne({ where: { creator_id: creatorId } });
    if (!perm) {
      perm = this.permissionRepo.create({ creator_id: creatorId });
      await this.permissionRepo.save(perm);
    }
    return perm;
  }

  async updatePermissions(creatorId: string, data: Partial<CreatorPermission>) {
    let perm = await this.permissionRepo.findOne({ where: { creator_id: creatorId } });
    if (!perm) {
      perm = this.permissionRepo.create({ creator_id: creatorId, ...data });
    } else {
      Object.assign(perm, data);
    }
    return this.permissionRepo.save(perm);
  }

  /* ═══════════════════════════════════════
   *  GOVERNANCE: CONTRACTS
   * ═══════════════════════════════════════ */

  async getContract(creatorId: string) {
    return this.contractRepo.findOne({
      where: { creator_id: creatorId },
      order: { created_at: 'DESC' },
    });
  }

  async getAllContracts() {
    return this.contractRepo.find({ order: { created_at: 'DESC' } });
  }

  async signContract(creatorId: string, data: {
    signature?: string;
    commission_rate?: number;
    tax_rate?: number;
  }) {
    const existing = await this.contractRepo.findOne({
      where: { creator_id: creatorId, status: ContractStatus.ACTIVE },
    });
    if (existing) {
      throw new BadRequestException('Идэвхтэй гэрээ аль хэдийн байна');
    }

    const contract = this.contractRepo.create({
      creator_id: creatorId,
      commission_rate: data.commission_rate ?? 20,
      tax_rate: data.tax_rate ?? 10,
      signature: data.signature,
      terms_accepted: true,
      signed_at: new Date(),
    });
    return this.contractRepo.save(contract);
  }

  async terminateContract(creatorId: string, reason: string) {
    const contract = await this.contractRepo.findOne({
      where: { creator_id: creatorId, status: ContractStatus.ACTIVE },
    });
    if (!contract) throw new NotFoundException('Идэвхтэй гэрээ олдсонгүй');

    contract.status = ContractStatus.TERMINATED;
    contract.terminated_at = new Date();
    contract.termination_reason = reason;
    return this.contractRepo.save(contract);
  }

  /** Calculate payout breakdown for a given amount */
  calculatePayout(totalAmount: number, commissionRate = 20, taxRate = 10) {
    const commission = Math.round(totalAmount * (commissionRate / 100));
    const afterCommission = totalAmount - commission;
    const tax = Math.round(afterCommission * (taxRate / 100));
    const creatorReceives = afterCommission - tax;
    return { totalAmount, commission, tax, creatorReceives, commissionRate, taxRate };
  }

  /* ═══════════════════════════════════════
   *  GOVERNANCE: PENALTIES
   * ═══════════════════════════════════════ */

  async getPenalties(creatorId: string) {
    return this.penaltyRepo.find({
      where: { creator_id: creatorId },
      order: { created_at: 'DESC' },
    });
  }

  async getAllPenalties() {
    return this.penaltyRepo.find({ order: { created_at: 'DESC' } });
  }

  async getStrikeCount(creatorId: string) {
    return this.penaltyRepo.count({
      where: { creator_id: creatorId, type: PenaltyType.STRIKE, resolved: false },
    });
  }

  async addPenalty(creatorId: string, data: {
    type: string;
    reason: string;
    description?: string;
    reference_id?: string;
    issued_by?: string;
  }) {
    const penalty = this.penaltyRepo.create({
      creator_id: creatorId,
      type: data.type as PenaltyType,
      reason: data.reason as PenaltyReason,
      description: data.description,
      reference_id: data.reference_id,
      issued_by: data.issued_by,
    });
    const saved = await this.penaltyRepo.save(penalty);

    // Auto-actions based on strike count
    if (data.type === 'strike') {
      const strikes = await this.getStrikeCount(creatorId);
      if (strikes >= 3) {
        // Auto-suspend on 3 strikes
        await this.updatePermissions(creatorId, {
          can_receive_orders: false,
          can_show_profile: false,
          can_access_marketplace: false,
        });
      } else if (strikes >= 2) {
        // Reduce visibility on 2 strikes
        await this.updatePermissions(creatorId, {
          can_access_marketplace: false,
        });
      }
    }

    return saved;
  }

  async resolvePenalty(penaltyId: string) {
    const penalty = await this.penaltyRepo.findOne({ where: { id: penaltyId } });
    if (!penalty) throw new NotFoundException('Penalty олдсонгүй');
    penalty.resolved = true;
    penalty.resolved_at = new Date();
    return this.penaltyRepo.save(penalty);
  }

  async resetStrikes(creatorId: string) {
    await this.penaltyRepo.update(
      { creator_id: creatorId, resolved: false },
      { resolved: true, resolved_at: new Date() },
    );
    // Restore permissions
    await this.updatePermissions(creatorId, {
      can_receive_orders: true,
      can_show_profile: true,
      can_access_marketplace: true,
    });
    return { message: 'Бүх strike цэвэрлэгдлээ' };
  }

  /** Governance summary for a single creator */
  async getGovernanceSummary(creatorId: string) {
    const [permissions, contract, penalties, strikes] = await Promise.all([
      this.getPermissions(creatorId),
      this.getContract(creatorId),
      this.getPenalties(creatorId),
      this.getStrikeCount(creatorId),
    ]);
    return { permissions, contract, penalties, strikes };
  }

  /* ═══════════════════════════════════════
   *  ORDER COMMENTS (task-based communication)
   * ═══════════════════════════════════════ */

  async getComments(orderId: string) {
    return this.commentRepo.find({
      where: { order_id: orderId },
      order: { created_at: 'ASC' },
    });
  }

  async addComment(orderId: string, userId: string, data: {
    message: string;
    role: string;
    user_name?: string;
    attachment_urls?: string[];
    action?: string;
  }) {
    // Verify user has access to this order
    const order = await this.ugcRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Захиалга олдсонгүй');

    const isCustomer = order.customer_id === userId;
    const isCreator = order.creator_id === userId;
    // Admin check happens at controller level via AdminGuard

    if (!isCustomer && !isCreator && data.role !== CommentRole.ADMIN) {
      throw new ForbiddenException('Энэ захиалгад хандах эрхгүй');
    }

    const comment = this.commentRepo.create({
      order_id: orderId,
      user_id: userId,
      user_name: data.user_name,
      role: data.role as CommentRole,
      message: data.message,
      attachment_urls: data.attachment_urls,
      action: data.action,
    });

    const saved = await this.commentRepo.save(comment);

    // If action triggers workflow change
    if (data.action === 'revision_request' && isCustomer) {
      order.status = UgcRequestStatus.REVISION;
      order.revision_notes = data.message;
      order.revision_count = (order.revision_count || 0) + 1;
      await this.ugcRepo.save(order);
    } else if (data.action === 'approval' && isCustomer) {
      order.status = UgcRequestStatus.APPROVED;
      order.approved_at = new Date();
      order.approved_by = userId;
      await this.ugcRepo.save(order);
    }

    return saved;
  }

  async addSystemComment(orderId: string, message: string) {
    const comment = this.commentRepo.create({
      order_id: orderId,
      user_id: 'system',
      user_name: 'Систем',
      role: CommentRole.ADMIN,
      message,
      is_system: true,
    });
    return this.commentRepo.save(comment);
  }
}
