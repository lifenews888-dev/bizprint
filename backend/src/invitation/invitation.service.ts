import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation } from './entities/invitation.entity';
import { InvitationGuest } from './entities/invitation-guest.entity';
import { InvitationTemplate } from './entities/invitation-template.entity';
import { UsageService } from '../subscription/usage.service';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(Invitation)
    private invitationRepo: Repository<Invitation>,
    @InjectRepository(InvitationGuest)
    private guestRepo: Repository<InvitationGuest>,
    @InjectRepository(InvitationTemplate)
    private templateRepo: Repository<InvitationTemplate>,
    private usageService: UsageService,
  ) {}

  // ─── CREATE ───
  async create(userId: string, dto: Partial<Invitation>) {
    // Check subscription limit before creating
    await this.usageService.checkAndEnforce(userId, 'invitations');
    const slug = this.generateSlug(dto.title || 'invitation');
    const invitation = this.invitationRepo.create({
      ...dto,
      user_id: userId,
      slug,
      status: 'draft',
    });
    const saved = await this.invitationRepo.save(invitation);
    // Log usage
    await this.usageService.logUsage(userId, 'invitations', 'create', saved.id);
    return saved;
  }

  // ─── UPDATE ───
  async update(id: string, userId: string, dto: Partial<Invitation>) {
    const inv = await this.findOneOwned(id, userId);
    Object.assign(inv, dto);
    return this.invitationRepo.save(inv);
  }

  // ─── PUBLISH (activate) ───
  async publish(id: string, userId: string) {
    const inv = await this.findOneOwned(id, userId);
    if (!inv.event_date) throw new BadRequestException('Event date шаардлагатай');
    if (!inv.title) throw new BadRequestException('Гарчиг шаардлагатай');
    inv.status = 'active';
    return this.invitationRepo.save(inv);
  }

  // ─── LIST (user's invitations) ───
  async findByUser(userId: string) {
    return this.invitationRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  // ─── PUBLIC VIEW (by slug) ───
  async findBySlug(slug: string) {
    const inv = await this.invitationRepo.findOne({ where: { slug } });
    if (!inv) throw new NotFoundException('Урилга олдсонгүй');
    if (inv.status !== 'active') throw new NotFoundException('Урилга идэвхгүй байна');
    // increment view
    await this.invitationRepo.increment({ id: inv.id }, 'view_count', 1);
    return inv;
  }

  // ─── PUBLIC VIEW (by token — personalized) ───
  async findByToken(token: string) {
    const guest = await this.guestRepo.findOne({
      where: { invite_token: token },
      relations: ['invitation'],
    });
    if (!guest) throw new NotFoundException('Урилга олдсонгүй');
    if (!guest.has_viewed) {
      guest.has_viewed = true;
      guest.viewed_at = new Date();
      await this.guestRepo.save(guest);
      await this.invitationRepo.increment({ id: guest.invitation_id }, 'view_count', 1);
    }
    return { invitation: guest.invitation, guest };
  }

  // ─── RSVP ───
  async rsvp(guestId: string, dto: { rsvp_status: string; guest_count?: number; plus_one_name?: string; dietary_notes?: string; message?: string; decline_reason?: string }) {
    const guest = await this.guestRepo.findOne({ where: { id: guestId } });
    if (!guest) throw new NotFoundException('Зочны мэдээлэл олдсонгүй');

    guest.rsvp_status = dto.rsvp_status as any;
    if (dto.guest_count) guest.guest_count = dto.guest_count;
    if (dto.plus_one_name) guest.plus_one_name = dto.plus_one_name;
    if (dto.dietary_notes) guest.dietary_notes = dto.dietary_notes;
    if (dto.message) guest.message = dto.message;
    if (dto.decline_reason) guest.decline_reason = dto.decline_reason;
    guest.responded_at = new Date();
    await this.guestRepo.save(guest);

    // Update RSVP count on invitation
    if (dto.rsvp_status === 'attending') {
      await this.invitationRepo.increment({ id: guest.invitation_id }, 'rsvp_count', 1);
    }
    return guest;
  }

  // ─── PUBLIC RSVP (by token) ───
  async rsvpByToken(token: string, dto: { rsvp_status: string; guest_count?: number; plus_one_name?: string; dietary_notes?: string; message?: string }) {
    const guest = await this.guestRepo.findOne({ where: { invite_token: token } });
    if (!guest) throw new NotFoundException('Урилгын токен олдсонгүй');
    return this.rsvp(guest.id, dto);
  }

  // ─── PUBLIC RSVP (by slug — anonymous guest) ───
  async rsvpBySlug(slug: string, dto: { name: string; rsvp_status: string; guest_count?: number; message?: string; decline_reason?: string }) {
    const inv = await this.invitationRepo.findOne({ where: { slug } });
    if (!inv) throw new NotFoundException('Урилга олдсонгүй');
    if (!inv.rsvp_enabled) throw new BadRequestException('RSVP идэвхгүй');

    const invite_token = randomBytes(16).toString('hex');
    const guest = this.guestRepo.create({
      invitation_id: inv.id,
      name: dto.name,
      rsvp_status: dto.rsvp_status as any,
      guest_count: dto.guest_count || 1,
      message: dto.message,
      decline_reason: dto.decline_reason,
      invite_token,
      has_viewed: true,
      viewed_at: new Date(),
      responded_at: new Date(),
    });
    await this.guestRepo.save(guest);

    if (dto.rsvp_status === 'attending') {
      await this.invitationRepo.increment({ id: inv.id }, 'rsvp_count', 1);
    }
    return guest;
  }

  // ─── PUBLIC RSVP STATS (by slug) ───
  async getPublicRsvpStats(slug: string) {
    const inv = await this.invitationRepo.findOne({ where: { slug } });
    if (!inv) throw new NotFoundException('Урилга олдсонгүй');
    const guests = await this.guestRepo.find({ where: { invitation_id: inv.id } });
    return {
      total: guests.length,
      attending: guests.filter(g => g.rsvp_status === 'attending').length,
      declined: guests.filter(g => g.rsvp_status === 'declined').length,
      total_guest_count: guests.filter(g => g.rsvp_status === 'attending').reduce((s, g) => s + g.guest_count, 0),
    };
  }

  // ─── ADD GALLERY IMAGE ───
  async addGalleryImage(slug: string, imageUrl: string) {
    const inv = await this.invitationRepo.findOne({ where: { slug } });
    if (!inv) throw new NotFoundException('Урилга олдсонгүй');
    const urls = inv.gallery_urls || [];
    urls.push(imageUrl);
    inv.gallery_urls = urls;
    return this.invitationRepo.save(inv);
  }

  // ─── GUEST MANAGEMENT ───
  async addGuest(invitationId: string, userId: string, dto: Partial<InvitationGuest>) {
    await this.findOneOwned(invitationId, userId);
    const invite_token = randomBytes(16).toString('hex');
    const guest = this.guestRepo.create({
      ...dto,
      invitation_id: invitationId,
      invite_token,
    });
    return this.guestRepo.save(guest);
  }

  async addGuestsBulk(invitationId: string, userId: string, guests: Partial<InvitationGuest>[]) {
    await this.findOneOwned(invitationId, userId);
    const entities = guests.map(g =>
      this.guestRepo.create({
        ...g,
        invitation_id: invitationId,
        invite_token: randomBytes(16).toString('hex'),
      }),
    );
    return this.guestRepo.save(entities);
  }

  async getGuests(invitationId: string, userId: string) {
    await this.findOneOwned(invitationId, userId);
    return this.guestRepo.find({
      where: { invitation_id: invitationId },
      order: { created_at: 'ASC' },
    });
  }

  async removeGuest(guestId: string, userId: string) {
    const guest = await this.guestRepo.findOne({
      where: { id: guestId },
      relations: ['invitation'],
    });
    if (!guest) throw new NotFoundException();
    if (guest.invitation.user_id !== userId) throw new ForbiddenException();
    return this.guestRepo.remove(guest);
  }

  // ─── RSVP STATS ───
  async getRsvpStats(invitationId: string, userId: string) {
    await this.findOneOwned(invitationId, userId);
    const guests = await this.guestRepo.find({ where: { invitation_id: invitationId } });
    return {
      total: guests.length,
      attending: guests.filter(g => g.rsvp_status === 'attending').length,
      declined: guests.filter(g => g.rsvp_status === 'declined').length,
      maybe: guests.filter(g => g.rsvp_status === 'maybe').length,
      pending: guests.filter(g => g.rsvp_status === 'pending').length,
      total_guest_count: guests.filter(g => g.rsvp_status === 'attending').reduce((s, g) => s + g.guest_count, 0),
      viewed: guests.filter(g => g.has_viewed).length,
    };
  }

  // ─── TEMPLATES ───
  async getTemplates(category?: string) {
    const where: any = { is_active: true };
    if (category) where.category = category;
    return this.templateRepo.find({ where, order: { sort_order: 'ASC' } });
  }

  async createTemplate(dto: Partial<InvitationTemplate>) {
    return this.templateRepo.save(this.templateRepo.create(dto));
  }

  async updateTemplate(id: string, dto: Partial<InvitationTemplate>) {
    await this.templateRepo.update(id, dto);
    return this.templateRepo.findOne({ where: { id } });
  }

  // ─── DELETE ───
  async remove(id: string, userId: string) {
    const inv = await this.findOneOwned(id, userId);
    await this.guestRepo.delete({ invitation_id: id });
    const result = await this.invitationRepo.remove(inv);
    // Log usage decrement
    await this.usageService.logUsage(userId, 'invitations', 'delete', id);
    return result;
  }

  // ─── ADMIN ───
  async adminList(page = 1, limit = 20) {
    return this.invitationRepo.findAndCount({
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['user'],
    });
  }

  async getStats() {
    const total = await this.invitationRepo.count();
    const active = await this.invitationRepo.count({ where: { status: 'active' } });
    const totalGuests = await this.guestRepo.count();
    const attending = await this.guestRepo.count({ where: { rsvp_status: 'attending' } });
    return { total, active, totalGuests, attending };
  }

  // ─── HELPERS ───
  private async findOneOwned(id: string, userId: string) {
    const inv = await this.invitationRepo.findOne({ where: { id } });
    if (!inv) throw new NotFoundException('Урилга олдсонгүй');
    if (inv.user_id !== userId) throw new ForbiddenException('Хандах эрхгүй');
    return inv;
  }

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9\u0400-\u04ff]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
    const suffix = randomBytes(4).toString('hex');
    return `${base}-${suffix}`;
  }
}
