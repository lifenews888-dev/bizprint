import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { MarketingCampaign } from './marketing-campaign.entity';
import { MarketingEmailCampaign } from './email-campaign.entity';
import { MarketingEmailContact } from './email-contact.entity';
import { MarketingEmailSendLog } from './email-send-log.entity';
import { User } from '../users/user.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class MarketingService {
  constructor(
    @InjectRepository(MarketingCampaign)
    private repo: Repository<MarketingCampaign>,
    @InjectRepository(MarketingEmailContact)
    private contacts: Repository<MarketingEmailContact>,
    @InjectRepository(MarketingEmailCampaign)
    private emailCampaigns: Repository<MarketingEmailCampaign>,
    @InjectRepository(MarketingEmailSendLog)
    private sendLogs: Repository<MarketingEmailSendLog>,
    @InjectRepository(User)
    private users: Repository<User>,
    private mail: MailService,
  ) {}

  findAll() {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  create(data: Partial<MarketingCampaign>) {
    const campaign = this.repo.create(data);
    return this.repo.save(campaign);
  }

  async update(id: string, data: Partial<MarketingCampaign>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { success: true };
  }

  private normalizeEmail(email?: string) {
    return String(email || '').trim().toLowerCase();
  }

  private isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private parseCsvRows(raw: string) {
    const lines = String(raw || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) return [];
    const split = (line: string) => line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
    const first = split(lines[0]).map(v => v.toLowerCase());
    const hasHeader = first.includes('email');
    const headers = hasHeader ? first : ['email', 'name', 'company', 'phone'];
    const body = hasHeader ? lines.slice(1) : lines;
    return body.map(line => {
      const values = split(line);
      return headers.reduce((acc, key, index) => ({ ...acc, [key]: values[index] || '' }), {} as Record<string, string>);
    });
  }

  private renderTemplate(template: string, data: Record<string, string>) {
    return String(template || '').replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
  }

  async emailSummary() {
    const [total, subscribed, unsubscribed, campaigns, sent, failed] = await Promise.all([
      this.contacts.count(),
      this.contacts.count({ where: { status: 'subscribed' } }),
      this.contacts.count({ where: { status: 'unsubscribed' } }),
      this.emailCampaigns.count(),
      this.sendLogs.count({ where: { status: 'sent' } }),
      this.sendLogs.count({ where: { status: 'failed' } }),
    ]);
    return { total, subscribed, unsubscribed, campaigns, sent, failed };
  }

  findEmailContacts(filters: { search?: string; status?: string; source?: string; tag?: string } = {}) {
    const search = String(filters.search || '').trim();
    const status = String(filters.status || '').trim();
    const source = String(filters.source || '').trim();
    const tag = String(filters.tag || '').trim();
    const base: FindOptionsWhere<MarketingEmailContact> = {};
    if (status) base.status = status;
    if (source) base.source = source;
    const where = search
      ? [
          { ...base, email: ILike(`%${search}%`) },
          { ...base, name: ILike(`%${search}%`) },
          { ...base, company: ILike(`%${search}%`) },
        ]
      : base;
    const s = String(search || '').trim();
    return this.contacts.find({
      where: s ? where as FindOptionsWhere<MarketingEmailContact>[] : where,
      order: { created_at: 'DESC' },
      take: 500,
    }).then(rows => tag ? rows.filter(row => (row.tags || []).includes(tag)) : rows);
  }

  async upsertEmailContact(data: Partial<MarketingEmailContact>) {
    const email = this.normalizeEmail(data.email);
    if (!this.isValidEmail(email)) throw new BadRequestException('Valid email required');
    const existing = await this.contacts.findOne({ where: { email } });
    const patch = {
      email,
      name: data.name || existing?.name || '',
      company: data.company || existing?.company || '',
      phone: data.phone || existing?.phone || '',
      user_id: data.user_id || existing?.user_id || null,
      source: data.source || existing?.source || 'manual',
      status: data.status || existing?.status || 'subscribed',
      tags: data.tags || existing?.tags || [],
      metadata: data.metadata || existing?.metadata || {},
      last_synced_at: data.last_synced_at || existing?.last_synced_at || null,
    };
    if (existing) {
      await this.contacts.update(existing.id, patch);
      return this.contacts.findOne({ where: { id: existing.id } });
    }
    return this.contacts.save(this.contacts.create(patch));
  }

  async importEmailContacts(body: { csv?: string; source?: string; tag?: string }) {
    const rows = this.parseCsvRows(body.csv || '');
    let imported = 0, updated = 0, skipped = 0;
    const errors: string[] = [];
    for (const row of rows) {
      const email = this.normalizeEmail(row.email);
      if (!this.isValidEmail(email)) {
        skipped++;
        errors.push(`${row.email || '(empty)'}: invalid email`);
        continue;
      }
      const existed = await this.contacts.findOne({ where: { email } });
      await this.upsertEmailContact({
        email,
        name: row.name || row.full_name,
        company: row.company || row.org || row.organization,
        phone: row.phone,
        source: body.source || 'csv',
        tags: body.tag ? [body.tag] : existed?.tags || [],
      });
      existed ? updated++ : imported++;
    }
    return { imported, updated, skipped, errors };
  }

  async syncRegisteredUsers() {
    const users = await this.users.find({ select: ['id', 'email', 'full_name', 'phone', 'company_name', 'created_at'] as any });
    let imported = 0, updated = 0, skipped = 0;
    for (const user of users) {
      const email = this.normalizeEmail(user.email);
      if (!this.isValidEmail(email)) { skipped++; continue; }
      const existed = await this.contacts.findOne({ where: { email } });
      await this.upsertEmailContact({
        email,
        name: user.full_name,
        phone: user.phone,
        company: user.company_name,
        user_id: user.id,
        source: 'registered_user',
        tags: ['registered'],
        last_synced_at: new Date(),
      });
      existed ? updated++ : imported++;
    }
    return { imported, updated, skipped };
  }

  listEmailCampaigns() {
    return this.emailCampaigns.find({ order: { created_at: 'DESC' }, take: 100 });
  }

  createEmailCampaign(data: Partial<MarketingEmailCampaign>) {
    if (!data.name?.trim()) throw new BadRequestException('Campaign name required');
    if (!data.subject?.trim()) throw new BadRequestException('Subject required');
    if (!data.html?.trim()) throw new BadRequestException('HTML body required');
    return this.emailCampaigns.save(this.emailCampaigns.create({
      ...data,
      status: data.status || 'draft',
      batch_size: Number(data.batch_size || 40),
      delay_ms: Number(data.delay_ms || 2000),
    }));
  }

  private async contactsForCampaign(campaign: MarketingEmailCampaign, limit: number) {
    const segment = String(campaign.segment || 'all').trim();
    const where: FindOptionsWhere<MarketingEmailContact> = { status: 'subscribed' };
    if (segment === 'registered') where.source = 'registered_user';
    if (segment === 'manual') where.source = 'manual';
    if (segment === 'imported') where.source = 'admin_upload';
    if (segment.startsWith('source:')) where.source = segment.slice('source:'.length);
    const contacts = await this.contacts.find({ where, order: { created_at: 'ASC' }, take: limit });
    if (segment.startsWith('tag:')) {
      const tag = segment.slice('tag:'.length);
      return contacts.filter(contact => (contact.tags || []).includes(tag));
    }
    return contacts;
  }

  async sendEmailCampaign(id: string, body: { dry_run?: boolean; limit?: number }) {
    const campaign = await this.emailCampaigns.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Email campaign not found');
    const dryRun = body.dry_run !== false;
    const limit = Math.max(1, Math.min(Number(body.limit || 50), 500));
    const contacts = await this.contactsForCampaign(campaign, limit);
    let sent = 0, failed = 0, skipped = 0, dry = 0;
    for (const contact of contacts) {
      const unsubscribeUrl = `${process.env.FRONTEND_URL || 'https://bizprint.mn'}/email/unsubscribe?email=${encodeURIComponent(contact.email)}`;
      const html = this.renderTemplate(campaign.html, {
        email: contact.email,
        name: contact.name || 'Харилцагч',
        company: contact.company || '',
        phone: contact.phone || '',
        unsubscribe_url: unsubscribeUrl,
      });
      if (dryRun) {
        dry++;
        await this.sendLogs.save(this.sendLogs.create({ campaign_id: id, contact_id: contact.id, email: contact.email, status: 'dry_run' }));
        continue;
      }
      try {
        const info = await this.mail.sendMarketingEmail({
          to: contact.email,
          name: contact.name || 'Харилцагч',
          subject: campaign.subject,
          html,
          unsubscribeUrl,
          fromName: campaign.sender_name,
          fromEmail: campaign.sender_email,
        });
        sent++;
        await this.sendLogs.save(this.sendLogs.create({ campaign_id: id, contact_id: contact.id, email: contact.email, status: 'sent', message_id: info?.messageId || '' }));
      } catch (e: any) {
        failed++;
        await this.sendLogs.save(this.sendLogs.create({ campaign_id: id, contact_id: contact.id, email: contact.email, status: 'failed', error: e?.message || 'send failed' }));
      }
    }
    if (!contacts.length) skipped = 1;
    await this.emailCampaigns.update(id, {
      status: dryRun ? campaign.status : 'sent',
      total_recipients: contacts.length,
      sent_count: campaign.sent_count + sent,
      failed_count: campaign.failed_count + failed,
      dry_run_count: campaign.dry_run_count + dry,
      last_sent_at: dryRun ? campaign.last_sent_at : new Date(),
    });
    return { dry_run: dryRun, recipients: contacts.length, sent, failed, skipped, dry_run_count: dry };
  }

  async unsubscribeEmail(email: string) {
    const normalized = this.normalizeEmail(email);
    if (!this.isValidEmail(normalized)) throw new BadRequestException('Valid email required');
    const contact = await this.contacts.findOne({ where: { email: normalized } });
    if (!contact) return { success: true };
    await this.contacts.update(contact.id, { status: 'unsubscribed', unsubscribed_at: new Date() });
    return { success: true };
  }
}
