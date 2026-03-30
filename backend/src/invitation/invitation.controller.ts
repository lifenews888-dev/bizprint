import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class InvitationController {
  constructor(private readonly svc: InvitationService) {}

  // ════════════════════════════════════
  //  PUBLIC ROUTES (no auth)
  // ════════════════════════════════════

  /** Public invitation page by slug */
  @Get('invite/:slug')
  viewBySlug(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }

  /** Personalized invitation by token */
  @Get('invite/t/:token')
  viewByToken(@Param('token') token: string) {
    return this.svc.findByToken(token);
  }

  /** Public RSVP by token */
  @Post('invite/t/:token/rsvp')
  rsvpByToken(@Param('token') token: string, @Body() dto: any) {
    return this.svc.rsvpByToken(token, dto);
  }

  /** Public RSVP by slug (anonymous guest) */
  @Post('invite/:slug/rsvp')
  rsvpBySlug(@Param('slug') slug: string, @Body() dto: any) {
    return this.svc.rsvpBySlug(slug, dto);
  }

  /** Public RSVP stats */
  @Get('invite/:slug/stats')
  publicRsvpStats(@Param('slug') slug: string) {
    return this.svc.getPublicRsvpStats(slug);
  }

  /** Add gallery image (public) */
  @Post('invite/:slug/gallery')
  addGalleryImage(@Param('slug') slug: string, @Body() body: { image_url: string }) {
    return this.svc.addGalleryImage(slug, body.image_url);
  }

  /** Invitation templates (public) */
  @Get('invitation-templates')
  getTemplates(@Query('category') category?: string) {
    return this.svc.getTemplates(category);
  }

  // ════════════════════════════════════
  //  CUSTOMER ROUTES (auth required)
  // ════════════════════════════════════

  @UseGuards(JwtAuthGuard)
  @Get('invitations/my')
  myInvitations(@Req() req) {
    return this.svc.findByUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invitations')
  create(@Req() req, @Body() dto: any) {
    return this.svc.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('invitations/:id')
  update(@Param('id') id: string, @Req() req, @Body() dto: any) {
    return this.svc.update(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invitations/:id/publish')
  publish(@Param('id') id: string, @Req() req) {
    return this.svc.publish(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('invitations/:id')
  remove(@Param('id') id: string, @Req() req) {
    return this.svc.remove(id, req.user.id);
  }

  // ── Guest Management ──

  @UseGuards(JwtAuthGuard)
  @Post('invitations/:id/guests')
  addGuest(@Param('id') id: string, @Req() req, @Body() dto: any) {
    return this.svc.addGuest(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invitations/:id/guests/bulk')
  addGuestsBulk(@Param('id') id: string, @Req() req, @Body() body: { guests: any[] }) {
    return this.svc.addGuestsBulk(id, req.user.id, body.guests);
  }

  @UseGuards(JwtAuthGuard)
  @Get('invitations/:id/guests')
  getGuests(@Param('id') id: string, @Req() req) {
    return this.svc.getGuests(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('invitations/guests/:guestId')
  removeGuest(@Param('guestId') guestId: string, @Req() req) {
    return this.svc.removeGuest(guestId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('invitations/:id/rsvp-stats')
  rsvpStats(@Param('id') id: string, @Req() req) {
    return this.svc.getRsvpStats(id, req.user.id);
  }

  // ════════════════════════════════════
  //  ADMIN ROUTES
  // ════════════════════════════════════

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/invitations')
  adminList(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.svc.adminList(page, limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/invitations/stats')
  adminStats() {
    return this.svc.getStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Post('admin/invitation-templates')
  createTemplate(@Body() dto: any) {
    return this.svc.createTemplate(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Patch('admin/invitation-templates/:id')
  updateTemplate(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateTemplate(id, dto);
  }
}
