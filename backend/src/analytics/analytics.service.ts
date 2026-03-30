import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private eventRepo: Repository<AnalyticsEvent>,
  ) {}

  // ─── TRACK EVENT ───
  async track(data: {
    entity_type: string;
    entity_id: string;
    event_type: string;
    user_id?: string;
    visitor_ip?: string;
    visitor_ua?: string;
    referrer?: string;
    metadata?: Record<string, any>;
  }) {
    const parsed = this.parseUserAgent(data.visitor_ua);
    const event = this.eventRepo.create({
      ...data,
      device_type: parsed.device,
      browser: parsed.browser,
      os: parsed.os,
    });
    return this.eventRepo.save(event);
  }

  // ─── USER DASHBOARD ANALYTICS ───
  async getUserStats(userId: string, days = 30) {
    const since = new Date(Date.now() - days * 86400000);

    const events = await this.eventRepo
      .createQueryBuilder('e')
      .select('e.entity_type', 'entity_type')
      .addSelect('e.event_type', 'event_type')
      .addSelect('COUNT(*)', 'count')
      .where('e.user_id = :userId', { userId })
      .andWhere('e.created_at >= :since', { since })
      .groupBy('e.entity_type')
      .addGroupBy('e.event_type')
      .getRawMany();

    // Daily breakdown
    const daily = await this.eventRepo
      .createQueryBuilder('e')
      .select("TO_CHAR(e.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('e.user_id = :userId', { userId })
      .andWhere('e.created_at >= :since', { since })
      .groupBy("TO_CHAR(e.created_at, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    return { events, daily };
  }

  // ─── ENTITY-SPECIFIC ANALYTICS ───
  async getEntityStats(entityType: string, entityId: string, days = 30) {
    const since = new Date(Date.now() - days * 86400000);

    const byType = await this.eventRepo
      .createQueryBuilder('e')
      .select('e.event_type', 'event_type')
      .addSelect('COUNT(*)', 'count')
      .where('e.entity_type = :entityType', { entityType })
      .andWhere('e.entity_id = :entityId', { entityId })
      .andWhere('e.created_at >= :since', { since })
      .groupBy('e.event_type')
      .getRawMany();

    const daily = await this.eventRepo
      .createQueryBuilder('e')
      .select("TO_CHAR(e.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('e.event_type', 'event_type')
      .addSelect('COUNT(*)', 'count')
      .where('e.entity_type = :entityType', { entityType })
      .andWhere('e.entity_id = :entityId', { entityId })
      .andWhere('e.created_at >= :since', { since })
      .groupBy("TO_CHAR(e.created_at, 'YYYY-MM-DD')")
      .addGroupBy('e.event_type')
      .orderBy('date', 'ASC')
      .getRawMany();

    const byDevice = await this.eventRepo
      .createQueryBuilder('e')
      .select('e.device_type', 'device')
      .addSelect('COUNT(*)', 'count')
      .where('e.entity_type = :entityType', { entityType })
      .andWhere('e.entity_id = :entityId', { entityId })
      .andWhere('e.created_at >= :since', { since })
      .groupBy('e.device_type')
      .getRawMany();

    const byReferrer = await this.eventRepo
      .createQueryBuilder('e')
      .select('e.referrer', 'referrer')
      .addSelect('COUNT(*)', 'count')
      .where('e.entity_type = :entityType', { entityType })
      .andWhere('e.entity_id = :entityId', { entityId })
      .andWhere('e.referrer IS NOT NULL')
      .andWhere('e.created_at >= :since', { since })
      .groupBy('e.referrer')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return { byType, daily, byDevice, byReferrer };
  }

  // ─── ADMIN PLATFORM ANALYTICS ───
  async getPlatformStats(days = 30) {
    const since = new Date(Date.now() - days * 86400000);

    const overview = await this.eventRepo
      .createQueryBuilder('e')
      .select('e.entity_type', 'entity_type')
      .addSelect('COUNT(*)', 'total_events')
      .addSelect('COUNT(DISTINCT e.entity_id)', 'unique_entities')
      .where('e.created_at >= :since', { since })
      .groupBy('e.entity_type')
      .getRawMany();

    const dailyTotals = await this.eventRepo
      .createQueryBuilder('e')
      .select("TO_CHAR(e.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('e.created_at >= :since', { since })
      .groupBy("TO_CHAR(e.created_at, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    const topEntities = await this.eventRepo
      .createQueryBuilder('e')
      .select('e.entity_type', 'entity_type')
      .addSelect('e.entity_id', 'entity_id')
      .addSelect('COUNT(*)', 'count')
      .where('e.created_at >= :since', { since })
      .groupBy('e.entity_type')
      .addGroupBy('e.entity_id')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();

    const deviceBreakdown = await this.eventRepo
      .createQueryBuilder('e')
      .select('e.device_type', 'device')
      .addSelect('COUNT(*)', 'count')
      .where('e.created_at >= :since', { since })
      .groupBy('e.device_type')
      .getRawMany();

    return { overview, dailyTotals, topEntities, deviceBreakdown };
  }

  // ─── HELPERS ───
  private parseUserAgent(ua?: string) {
    if (!ua) return { device: 'unknown', browser: 'unknown', os: 'unknown' };
    const device = /mobile/i.test(ua) ? 'mobile' : /tablet/i.test(ua) ? 'tablet' : 'desktop';
    const browser = /chrome/i.test(ua) ? 'Chrome' : /firefox/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Other';
    const os = /windows/i.test(ua) ? 'Windows' : /mac/i.test(ua) ? 'macOS' : /android/i.test(ua) ? 'Android' : /ios|iphone/i.test(ua) ? 'iOS' : 'Other';
    return { device, browser, os };
  }
}
