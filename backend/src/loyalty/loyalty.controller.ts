import {
  Controller, Get, Post, Patch, Body, Param, Req, UseGuards, Query,
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly svc: LoyaltyService) {}

  // ════════════════════════════════════
  //  PUBLIC
  // ════════════════════════════════════

  /** Get program info (public — for QR landing page) */
  @Get('program/:id')
  getProgram(@Param('id') id: string) {
    return this.svc.getProgram(id);
  }

  /** Discover active programs (public) */
  @Get('programs/discover')
  discoverPrograms() {
    return this.svc.getActivePrograms();
  }

  /** Public: Add stamp by phone (QR scan flow) */
  @Post('scan-phone')
  scanByPhone(@Body() body: { campaign_id: string; phone: string }) {
    return this.svc.addStampByPhone(body.campaign_id, body.phone);
  }

  /** Public: Check stamps by phone */
  @Get('check/:programId/:phone')
  checkByPhone(@Param('programId') programId: string, @Param('phone') phone: string) {
    return this.svc.getStampsByPhone(programId, phone);
  }

  /** Public: Redeem reward by phone */
  @Post('redeem-phone')
  redeemByPhone(@Body() body: { campaign_id: string; phone: string }) {
    return this.svc.redeemByPhone(body.campaign_id, body.phone);
  }

  /** My programs (any logged-in user who created programs) */
  @UseGuards(JwtAuthGuard)
  @Get('my-programs')
  myPrograms(@Req() req: any) {
    return this.svc.getProgramsByOwner(req.user.id);
  }

  /** Stats for my program (owner access) */
  @UseGuards(JwtAuthGuard)
  @Get('my-programs/:programId/stats')
  myProgramStats(@Req() req: any, @Param('programId') programId: string) {
    return this.svc.getProgramStatsForOwner(programId, req.user.id);
  }

  /** Create loyalty program (any logged-in user with subscription) */
  @UseGuards(JwtAuthGuard)
  @Post('my-programs')
  createMyProgram(@Req() req: any, @Body() dto: any) {
    return this.svc.createProgram(req.user.id, dto);
  }

  // ════════════════════════════════════
  //  CUSTOMER (JWT required)
  // ════════════════════════════════════

  /** Scan QR → add stamp */
  @UseGuards(JwtAuthGuard)
  @Post('scan')
  addStamp(@Req() req, @Body() body: { program_id: string }) {
    return this.svc.addStamp(req.user.id, body.program_id);
  }

  /** Redeem a reward */
  @UseGuards(JwtAuthGuard)
  @Post('redeem')
  redeem(@Req() req, @Body() body: { program_id: string }) {
    return this.svc.redeem(req.user.id, body.program_id);
  }

  /** All my loyalty cards */
  @UseGuards(JwtAuthGuard)
  @Get('my')
  myCards(@Req() req) {
    return this.svc.getUserCards(req.user.id);
  }

  /** My card for a specific program */
  @UseGuards(JwtAuthGuard)
  @Get('my/:programId')
  myCard(@Req() req, @Param('programId') programId: string) {
    return this.svc.getUserCard(req.user.id, programId);
  }

  /** Stamp history for a program */
  @UseGuards(JwtAuthGuard)
  @Get('history/:programId')
  history(@Req() req, @Param('programId') programId: string) {
    return this.svc.getHistory(req.user.id, programId);
  }

  // ════════════════════════════════════
  //  STAFF SESSION (Dynamic QR)
  // ════════════════════════════════════

  /** Staff generates a 60-second QR session */
  @UseGuards(JwtAuthGuard)
  @Post('session')
  createSession(@Req() req, @Body() body: { program_id: string }) {
    return this.svc.createSession(req.user.id, body.program_id);
  }

  /** Customer scans the dynamic QR token */
  @UseGuards(JwtAuthGuard)
  @Post('scan-session')
  scanSession(@Req() req, @Body() body: { token: string }) {
    return this.svc.scanSession(req.user.id, body.token);
  }

  /** Check session status (staff polls this) */
  @Get('session/:token/status')
  sessionStatus(@Param('token') token: string) {
    return this.svc.getSessionStatus(token);
  }

  // ════════════════════════════════════
  //  VENDOR
  // ════════════════════════════════════

  /** Auto-create loyalty from business card order */
  @UseGuards(JwtAuthGuard)
  @Post('from-card-order')
  createFromCardOrder(@Req() req, @Body() dto: any) {
    return this.svc.createFromCardOrder(req.user.id, dto);
  }

  /** Create a loyalty program */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor', 'admin', 'superadmin')
  @Post('program')
  createProgram(@Req() req, @Body() dto: any) {
    return this.svc.createProgram(req.user.id, dto);
  }

  /** Update a loyalty program */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor', 'admin', 'superadmin')
  @Patch('program/:id')
  updateProgram(@Param('id') id: string, @Req() req, @Body() dto: any) {
    return this.svc.updateProgram(id, req.user.id, dto);
  }

  /** Vendor's programs */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor', 'admin', 'superadmin')
  @Get('vendor/programs')
  vendorPrograms(@Req() req) {
    return this.svc.getVendorPrograms(req.user.id);
  }

  /** Program stats */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor', 'admin', 'superadmin')
  @Get('vendor/stats/:programId')
  programStats(@Param('programId') programId: string, @Req() req) {
    return this.svc.getProgramStats(programId, req.user.id);
  }
}
