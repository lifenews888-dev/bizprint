import {
  Controller, Get, Post, Patch, Param, Body, Request,
  UseGuards, HttpCode, ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { DigitalCardService } from './digital-card.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { sanitizeCardUpdate, toPublicCard, toOwnerCard } from './dto/update-card.dto';

@Controller()
export class DigitalCardController {
  constructor(private svc: DigitalCardService) {}

  // ══════════════════════════════════════
  //  PUBLIC — /u/:slug (no auth)
  // ══════════════════════════════════════

  @Get('u/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async getPublicProfile(@Param('slug') slug: string, @Request() req: any) {
    const card = await this.svc.getBySlug(slug);
    if (!card) throw new NotFoundException('Карт олдсонгүй');

    const sub = await this.svc.getSubscriptionStatus(card.user_id);
    const isActive = sub.status === 'trial' || sub.status === 'active';
    const isOwner = req.user?.id === card.user_id;

    // Increment view (don't count owner views)
    if (!isOwner) await this.svc.incrementView(card.id);

    // Expired — only show name + company (no contact info leaked)
    if (!isActive) {
      return {
        status: 'expired',
        is_owner: isOwner,
        display_name: card.display_name,
        company_name: card.company_name,
        message: 'Дижитал картны хугацаа дууссан байна',
      };
    }

    return {
      status: 'active',
      is_owner: isOwner,
      card: isOwner ? toOwnerCard(card) : toPublicCard(card),
      subscription: {
        status: sub.status,
        is_trial: sub.is_trial,
        days_left: isOwner ? sub.days_left : undefined,
      },
    };
  }

  @Post('u/:slug/save-contact')
  @HttpCode(200)
  async trackSave(@Param('slug') slug: string) {
    const card = await this.svc.getBySlug(slug);
    if (card) await this.svc.incrementSave(card.id);
    return { ok: true };
  }

  // ══════════════════════════════════════
  //  USER — /digital-card/* (auth required)
  // ══════════════════════════════════════

  @Get('digital-card/my')
  @UseGuards(JwtAuthGuard)
  async getMyCard(@Request() req: any) {
    const card = await this.svc.getByUser(req.user.id);
    const sub = await this.svc.getSubscriptionStatus(req.user.id);
    const settings = await this.svc.getQrSettings();
    return { card: card ? toOwnerCard(card) : null, subscription: sub, settings };
  }

  @Post('digital-card')
  @UseGuards(JwtAuthGuard)
  async createOrUpdate(@Request() req: any, @Body() body: any) {
    const card = await this.svc.createCard(req.user.id, body);
    // Auto-create trial subscription
    await this.svc.createTrialSubscription(req.user.id, card.id);
    return card;
  }

  /** Update social links — ownership enforced via getByUser (MUST be before :id route) */
  @Patch('digital-card/socials')
  @UseGuards(JwtAuthGuard)
  async updateSocials(@Request() req: any, @Body() body: { social_links: { platform: string; value: string }[] }) {
    const card = await this.svc.getByUser(req.user.id);
    if (!card) throw new ForbiddenException('Карт олдсонгүй');
    const links = (body.social_links || []).slice(0, 10);
    return this.svc.updateCard(card.id, { social_links: links });
  }

  @Patch('digital-card/:id')
  @UseGuards(JwtAuthGuard)
  async updateCard(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const card = await this.svc.getCardById(id);
    if (!card) throw new NotFoundException('Карт олдсонгүй');
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (card.user_id !== req.user.id && !isAdmin) {
      throw new ForbiddenException('Зөвхөн өөрийн картыг засах боломжтой');
    }
    // Sanitize — only whitelisted fields pass through
    const safe = sanitizeCardUpdate(body);
    if (Object.keys(safe).length === 0) {
      throw new ForbiddenException('Зөвшөөрөгдөх талбар байхгүй');
    }
    return this.svc.updateCard(id, safe);
  }

  @Get('digital-card/qr-status')
  @UseGuards(JwtAuthGuard)
  async getQrStatus(@Request() req: any) {
    return this.svc.getSubscriptionStatus(req.user.id);
  }

  @Post('digital-card/subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(@Request() req: any, @Body() body: { payment_id?: string }) {
    return this.svc.activateSubscription(req.user.id, body.payment_id);
  }

  // ══════════════════════════════════════
  //  ADMIN — /digital-card/admin/*
  // ══════════════════════════════════════

  @Get('digital-card/admin/settings')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getSettings() {
    return this.svc.getQrSettings();
  }

  @Patch('digital-card/admin/settings')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateSettings(@Body() body: any) {
    return this.svc.updateQrSettings(body);
  }

  @Get('digital-card/admin/stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getStats() {
    return this.svc.getStats();
  }

  @Post('digital-card/admin/expire-check')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async expireCheck() {
    const count = await this.svc.expireOverdue();
    return { expired: count };
  }
}
