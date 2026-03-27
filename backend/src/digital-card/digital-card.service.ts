import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { DigitalCard } from './entities/digital-card.entity';
import { QrSubscription, QrSubStatus } from './entities/qr-subscription.entity';
import { SettingsService } from '../settings/settings.service';
import { EventBusService } from '../events/event-bus.service';

@Injectable()
export class DigitalCardService implements OnModuleInit {
  constructor(
    @InjectRepository(DigitalCard)
    private cardRepo: Repository<DigitalCard>,
    @InjectRepository(QrSubscription)
    private subRepo: Repository<QrSubscription>,
    private settings: SettingsService,
    private eventBus: EventBusService,
  ) {}

  onModuleInit() {
    this.eventBus.on('BUSINESS_CARD_ORDERED' as any, (data: any) => {
      this.onBusinessCardOrder(data.userId, data.orderData).catch(e =>
        console.log('Digital card auto-create error:', e?.message),
      );
    });
  }

  // ══════════════════════════════════════
  //  DIGITAL CARD CRUD
  // ══════════════════════════════════════

  async createCard(userId: string, data: Partial<DigitalCard>): Promise<DigitalCard> {
    const existing = await this.cardRepo.findOne({ where: { user_id: userId } });
    if (existing) return this.updateCard(existing.id, data);

    // Auto-fill from user profile if fields not provided
    if (!data.display_name || !data.email) {
      try {
        const userRepo = this.cardRepo.manager.connection.getRepository('User');
        const user: any = await userRepo.findOne({ where: { id: userId }, select: ['full_name', 'email', 'phone', 'company_name'] });
        if (user) {
          if (!data.display_name) data.display_name = user.full_name;
          if (!data.email) data.email = user.email;
          if (!data.phone) data.phone = user.phone;
          if (!data.company_name) data.company_name = user.company_name;
        }
      } catch {}
    }

    const slug = await this.generateSlug(data.display_name || userId);
    const card = this.cardRepo.create({ ...data, user_id: userId, slug });
    return this.cardRepo.save(card);
  }

  async updateCard(cardId: string, data: Partial<DigitalCard>): Promise<DigitalCard> {
    const card = await this.cardRepo.findOne({ where: { id: cardId } });
    if (!card) throw new NotFoundException('Дижитал карт олдсонгүй');
    Object.assign(card, data);
    return this.cardRepo.save(card);
  }

  async getByUser(userId: string): Promise<DigitalCard | null> {
    return this.cardRepo.findOne({ where: { user_id: userId } });
  }

  async getCardById(id: string): Promise<DigitalCard | null> {
    return this.cardRepo.findOne({ where: { id } });
  }

  async getBySlug(slug: string): Promise<DigitalCard | null> {
    return this.cardRepo.findOne({ where: { slug } });
  }

  async incrementView(cardId: string) {
    await this.cardRepo.increment({ id: cardId }, 'view_count', 1);
  }

  async incrementSave(cardId: string) {
    await this.cardRepo.increment({ id: cardId }, 'save_count', 1);
  }

  // ══════════════════════════════════════
  //  QR SUBSCRIPTION
  // ══════════════════════════════════════

  /** Create trial subscription (3 months free) */
  async createTrialSubscription(userId: string, cardId: string): Promise<QrSubscription> {
    const existing = await this.subRepo.findOne({ where: { user_id: userId, is_trial: true } });
    if (existing) return existing; // Already used trial

    const trialDays = await this.getTrialDays();
    const now = new Date();
    const end = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const sub = this.subRepo.create({
      user_id: userId,
      digital_card_id: cardId,
      status: QrSubStatus.TRIAL,
      is_trial: true,
      start_date: now,
      end_date: end,
    });
    return this.subRepo.save(sub);
  }

  /** Activate paid subscription (1 year) */
  async activateSubscription(userId: string, paymentId?: string): Promise<QrSubscription> {
    let card = await this.cardRepo.findOne({ where: { user_id: userId } });
    if (!card) throw new BadRequestException('Эхлээд дижитал карт үүсгэнэ үү');

    const price = await this.getYearlyPrice();
    const now = new Date();
    const end = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    // Check for existing active/trial sub to extend
    const existing = await this.subRepo.findOne({
      where: { user_id: userId },
      order: { end_date: 'DESC' },
    });

    if (existing && existing.status !== QrSubStatus.EXPIRED) {
      // Extend from current end date
      const extendFrom = new Date(existing.end_date) > now ? new Date(existing.end_date) : now;
      existing.end_date = new Date(extendFrom.getTime() + 365 * 24 * 60 * 60 * 1000);
      existing.status = QrSubStatus.ACTIVE;
      existing.is_trial = false;
      existing.payment_id = paymentId || null;
      existing.amount_paid = price;
      return this.subRepo.save(existing);
    }

    // Create new paid subscription
    const sub = this.subRepo.create({
      user_id: userId,
      digital_card_id: card.id,
      status: QrSubStatus.ACTIVE,
      is_trial: false,
      start_date: now,
      end_date: end,
      payment_id: paymentId || null,
      amount_paid: price,
    });
    return this.subRepo.save(sub);
  }

  /** Get current subscription status */
  async getSubscriptionStatus(userId: string) {
    const sub = await this.subRepo.findOne({
      where: { user_id: userId },
      order: { end_date: 'DESC' },
    });

    if (!sub) return { status: 'none', subscription: null };

    const now = new Date();
    if (new Date(sub.end_date) < now && sub.status !== QrSubStatus.EXPIRED) {
      sub.status = QrSubStatus.EXPIRED;
      await this.subRepo.save(sub);
    }

    const daysLeft = Math.max(0, Math.ceil((new Date(sub.end_date).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

    return {
      status: sub.status,
      is_trial: sub.is_trial,
      start_date: sub.start_date,
      end_date: sub.end_date,
      days_left: daysLeft,
      subscription: sub,
    };
  }

  /** Check if user has active QR access */
  async hasActiveQr(userId: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus(userId);
    return status.status === QrSubStatus.TRIAL || status.status === QrSubStatus.ACTIVE;
  }

  // ══════════════════════════════════════
  //  ORDER HOOK — auto-create card + trial
  // ══════════════════════════════════════

  /** Called when business card order is created */
  async onBusinessCardOrder(userId: string, orderData: any): Promise<{ card: DigitalCard; subscription: QrSubscription }> {
    // Create or get digital card
    let card = await this.getByUser(userId);
    if (!card) {
      card = await this.createCard(userId, {
        display_name: orderData.customer_name || orderData.form_data?.full_name,
        job_title: orderData.form_data?.job_title,
        company_name: orderData.form_data?.company_name || orderData.company_name,
        phone: orderData.customer_phone || orderData.form_data?.phone,
        email: orderData.customer_email || orderData.form_data?.email,
        website: orderData.form_data?.website,
        address: orderData.form_data?.address1,
        logo_url: orderData.logo_url,
        social_links: orderData.social || [],
      });
    }

    // Create trial subscription if none exists
    const sub = await this.createTrialSubscription(userId, card.id);
    return { card, subscription: sub };
  }

  // ══════════════════════════════════════
  //  EXPIRE CHECK (cron/manual)
  // ══════════════════════════════════════

  async expireOverdue(): Promise<number> {
    const result = await this.subRepo.update(
      { status: QrSubStatus.TRIAL, end_date: LessThan(new Date()) },
      { status: QrSubStatus.EXPIRED },
    );
    const result2 = await this.subRepo.update(
      { status: QrSubStatus.ACTIVE, end_date: LessThan(new Date()) },
      { status: QrSubStatus.EXPIRED },
    );
    return (result.affected || 0) + (result2.affected || 0);
  }

  // ══════════════════════════════════════
  //  ADMIN SETTINGS
  // ══════════════════════════════════════

  async getYearlyPrice(): Promise<number> {
    try {
      const val = await this.settings.get('qr_price_yearly');
      return Number(val) || 29900;
    } catch { return 29900; }
  }

  async getTrialDays(): Promise<number> {
    try {
      const val = await this.settings.get('qr_trial_days');
      return Number(val) || 90;
    } catch { return 90; }
  }

  async getTrialEnabled(): Promise<boolean> {
    try {
      const val = await this.settings.get('qr_trial_enabled');
      return val !== 'false';
    } catch { return true; }
  }

  async getQrSettings() {
    return {
      qr_price_yearly: await this.getYearlyPrice(),
      qr_trial_days: await this.getTrialDays(),
      qr_trial_enabled: await this.getTrialEnabled(),
    };
  }

  async updateQrSettings(data: { qr_price_yearly?: number; qr_trial_days?: number; qr_trial_enabled?: boolean }) {
    if (data.qr_price_yearly !== undefined)
      await this.settings.set('qr_price_yearly', String(data.qr_price_yearly), 'text', 'QR жилийн үнэ');
    if (data.qr_trial_days !== undefined)
      await this.settings.set('qr_trial_days', String(data.qr_trial_days), 'text', 'QR туршилтын хугацаа (өдөр)');
    if (data.qr_trial_enabled !== undefined)
      await this.settings.set('qr_trial_enabled', String(data.qr_trial_enabled), 'text', 'QR туршилт идэвхтэй эсэх');
    return this.getQrSettings();
  }

  // ══════════════════════════════════════
  //  ADMIN STATS
  // ══════════════════════════════════════

  async getStats() {
    const totalCards = await this.cardRepo.count();
    const totalSubs = await this.subRepo.count();
    const activeSubs = await this.subRepo.count({ where: { status: QrSubStatus.ACTIVE } });
    const trialSubs = await this.subRepo.count({ where: { status: QrSubStatus.TRIAL } });
    const expiredSubs = await this.subRepo.count({ where: { status: QrSubStatus.EXPIRED } });
    return { totalCards, totalSubs, activeSubs, trialSubs, expiredSubs };
  }

  // ══════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════

  private async generateSlug(name: string): Promise<string> {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';
    let slug = base;
    let i = 1;
    while (await this.cardRepo.findOne({ where: { slug } })) {
      slug = `${base}${i++}`;
    }
    return slug;
  }
}
