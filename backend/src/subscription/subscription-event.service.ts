import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { SubscriptionEvent, SubEventType, EventSeverity } from './entities/subscription-event.entity';

const EVENT_MESSAGES: Record<SubEventType, { title: string; message: string }> = {
  usage_threshold_reached: {
    title: 'Хязгаарт ойрхон байна',
    message: 'Таны ашиглалт 80%-д хүрсэн байна. Багцаа шинэчилнэ үү.',
  },
  limit_exceeded: {
    title: 'Хязгаар хэтэрсэн',
    message: 'Таны багцын хязгаар дууссан. Үргэлжлүүлэхийн тулд багцаа шинэчилнэ үү.',
  },
  subscription_expired: {
    title: 'Эрх дууссан',
    message: 'Таны багцын хугацаа дууссан. Сунгалт хийнэ үү.',
  },
  payment_failed: {
    title: 'Төлбөр амжилтгүй',
    message: 'Төлбөр хийхэд алдаа гарлаа. Дахин оролдоно уу.',
  },
  upgrade_success: {
    title: 'Багц шинэчлэгдлээ',
    message: 'Шинэ багц амжилттай идэвхжлээ!',
  },
  downgrade: {
    title: 'Багц бууруулагдлаа',
    message: 'Таны багц бууруулагдлаа.',
  },
  addon_purchased: {
    title: 'Нэмэлт худалдан авлаа',
    message: 'Нэмэлт амжилттай нэмэгдлээ.',
  },
  renewal: {
    title: 'Эрх сунгагдлаа',
    message: 'Таны багц амжилттай сунгагдлаа.',
  },
  cancellation: {
    title: 'Эрх цуцлагдлаа',
    message: 'Таны багц цуцлагдлаа.',
  },
};

@Injectable()
export class SubscriptionEventService {
  constructor(
    @InjectRepository(SubscriptionEvent)
    private eventRepo: Repository<SubscriptionEvent>,
  ) {}

  async logEvent(params: {
    user_id: string;
    event_type: SubEventType;
    severity?: EventSeverity;
    title?: string;
    message?: string;
    metadata?: Record<string, any>;
  }) {
    const defaults = EVENT_MESSAGES[params.event_type] || { title: params.event_type, message: '' };
    const event = this.eventRepo.create({
      user_id: params.user_id,
      event_type: params.event_type,
      severity: params.severity || this.getSeverity(params.event_type),
      title: params.title || defaults.title,
      message: params.message || defaults.message,
      metadata: params.metadata,
    });
    return this.eventRepo.save(event);
  }

  async getEventsForUser(userId: string, limit = 20) {
    return this.eventRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async getUnresolvedWarnings(userId: string) {
    return this.eventRepo.find({
      where: {
        user_id: userId,
        is_resolved: false,
        severity: 'warning' as any,
      },
      order: { created_at: 'DESC' },
    });
  }

  async hasRecentEvent(userId: string, eventType: SubEventType, featureKey: string, hoursAgo = 24): Promise<boolean> {
    const since = new Date(Date.now() - hoursAgo * 3600000);
    const existing = await this.eventRepo.findOne({
      where: {
        user_id: userId,
        event_type: eventType,
        created_at: MoreThan(since),
      },
    });
    if (!existing) return false;
    // Check if same feature_key in metadata
    return existing.metadata?.feature_key === featureKey;
  }

  async resolveEvents(userId: string, eventType?: SubEventType) {
    const where: any = { user_id: userId, is_resolved: false };
    if (eventType) where.event_type = eventType;
    await this.eventRepo.update(where, { is_resolved: true });
  }

  private getSeverity(type: SubEventType): EventSeverity {
    switch (type) {
      case 'limit_exceeded':
      case 'subscription_expired':
      case 'payment_failed':
        return 'critical';
      case 'usage_threshold_reached':
      case 'cancellation':
        return 'warning';
      default:
        return 'info';
    }
  }
}
