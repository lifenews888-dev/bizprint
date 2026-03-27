import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { CreatorService } from './creator.service';
import { UploadService } from '../upload/upload.service';

@Controller('creator')
export class CreatorController {
  constructor(
    private readonly creatorService: CreatorService,
    private readonly uploadService: UploadService,
  ) {}

  /* ═══════════════════════════════════════
   *  CREATOR APPLICATION
   * ═══════════════════════════════════════ */

  /** Apply to become a creator */
  @UseGuards(JwtAuthGuard)
  @Post('apply')
  apply(@Request() req: any, @Body() body: any) {
    return this.creatorService.applyForCreator(req.user.id, body);
  }

  /** Get my application status */
  @UseGuards(JwtAuthGuard)
  @Get('application')
  getMyApplication(@Request() req: any) {
    return this.creatorService.getMyApplication(req.user.id);
  }

  /** Admin: list all applications */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('applications')
  listApplications(@Query('status') status?: string) {
    return this.creatorService.listApplications(status);
  }

  /** Admin: approve application */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('applications/:id/approve')
  approveApplication(@Param('id') id: string, @Request() req: any) {
    return this.creatorService.approveApplication(id, req.user.id);
  }

  /** Admin: reject application */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('applications/:id/reject')
  rejectApplication(
    @Param('id') id: string,
    @Request() req: any,
    @Body('reason') reason: string,
  ) {
    return this.creatorService.rejectApplication(id, req.user.id, reason);
  }

  /* ═══════════════════════════════════════
   *  UGC REQUESTS — CUSTOMER SIDE
   * ═══════════════════════════════════════ */

  /** Customer: create UGC request */
  @UseGuards(JwtAuthGuard)
  @Post('requests')
  createRequest(@Request() req: any, @Body() body: any) {
    return this.creatorService.createUgcRequest(req.user.id, body);
  }

  /** Customer: list my requests */
  @UseGuards(JwtAuthGuard)
  @Get('my-requests')
  getMyRequests(@Request() req: any) {
    return this.creatorService.getCustomerRequests(req.user.id);
  }

  /** Customer: approve deliverable */
  @UseGuards(JwtAuthGuard)
  @Patch('requests/:id/approve')
  approveDeliverable(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { rating?: number; review?: string },
  ) {
    return this.creatorService.approveDeliverable(id, req.user.id, body.rating, body.review);
  }

  /** Customer: request revision */
  @UseGuards(JwtAuthGuard)
  @Patch('requests/:id/revision')
  requestRevision(
    @Param('id') id: string,
    @Request() req: any,
    @Body('notes') notes: string,
  ) {
    return this.creatorService.requestRevision(id, req.user.id, notes);
  }

  /* ═══════════════════════════════════════
   *  UGC REQUESTS — CREATOR SIDE
   * ═══════════════════════════════════════ */

  /** Creator: list available jobs */
  @UseGuards(JwtAuthGuard)
  @Get('jobs')
  getAvailableJobs() {
    return this.creatorService.getAvailableJobs();
  }

  /** Creator: list my projects */
  @UseGuards(JwtAuthGuard)
  @Get('projects')
  getMyProjects(@Request() req: any) {
    return this.creatorService.getCreatorProjects(req.user.id);
  }

  /** Creator: accept a job */
  @UseGuards(JwtAuthGuard)
  @Patch('jobs/:id/accept')
  acceptJob(@Param('id') id: string, @Request() req: any) {
    return this.creatorService.acceptJob(id, req.user.id);
  }

  /** Creator: start working */
  @UseGuards(JwtAuthGuard)
  @Patch('jobs/:id/start')
  startWork(@Param('id') id: string, @Request() req: any) {
    return this.creatorService.startWork(id, req.user.id);
  }

  /** Creator: submit deliverables */
  @UseGuards(JwtAuthGuard)
  @Post('jobs/:id/submit')
  submitDeliverables(
    @Param('id') id: string,
    @Request() req: any,
    @Body('deliverable_urls') urls: string[],
  ) {
    return this.creatorService.submitDeliverables(id, req.user.id, urls);
  }

  /** Creator: schedule Zoom screen share */
  @UseGuards(JwtAuthGuard)
  @Post('jobs/:id/zoom')
  scheduleZoom(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.creatorService.scheduleZoom(id, req.user.id, body);
  }

  /** Creator: complete Zoom session */
  @UseGuards(JwtAuthGuard)
  @Patch('jobs/:id/zoom-complete')
  completeZoom(
    @Param('id') id: string,
    @Request() req: any,
    @Body('recording_url') recordingUrl?: string,
  ) {
    return this.creatorService.completeZoom(id, req.user.id, recordingUrl);
  }

  /** Creator: submit final production files */
  @UseGuards(JwtAuthGuard)
  @Post('jobs/:id/final-files')
  submitFinalFiles(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.creatorService.submitFinalFiles(id, req.user.id, body);
  }

  /** Approve final check */
  @UseGuards(JwtAuthGuard)
  @Patch('jobs/:id/approve-final')
  approveFinal(@Param('id') id: string, @Request() req: any) {
    return this.creatorService.approveFinal(id, req.user.id);
  }

  /** Initiate payment */
  @UseGuards(JwtAuthGuard)
  @Post('requests/:id/pay')
  initiatePayment(
    @Param('id') id: string,
    @Request() req: any,
    @Body('method') method: string,
  ) {
    return this.creatorService.initiatePayment(id, req.user.id, method || 'qpay');
  }

  /** Payment webhook / confirm */
  @Post('payment/callback')
  confirmPayment(@Body() body: any) {
    return this.creatorService.confirmPayment(body.request_id, body.invoice_no);
  }

  /** Creator: earnings summary */
  @UseGuards(JwtAuthGuard)
  @Get('earnings')
  getEarnings(@Request() req: any) {
    return this.creatorService.getCreatorEarnings(req.user.id);
  }

  /** Creator: stats for portfolio page */
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getStats(@Request() req: any) {
    const [earnings, portfolio] = await Promise.all([
      this.creatorService.getCreatorEarnings(req.user.id),
      this.creatorService.getCreatorPortfolio(req.user.id),
    ]);
    return {
      totalViews: portfolio.reduce((s: number, p: any) => s + (p.views || 0), 0),
      profileClicks: 0,
      orderCount: earnings.total_jobs || 0,
      rating: earnings.avg_rating || 0,
      level: 'starter',
    };
  }

  /* ═══════════════════════════════════════
   *  SHARED / ADMIN
   * ═══════════════════════════════════════ */

  /** Get request detail */
  @UseGuards(JwtAuthGuard)
  @Get('requests/:id')
  getRequestDetail(@Param('id') id: string) {
    return this.creatorService.getRequestDetail(id);
  }

  /** Admin: list all UGC requests */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('all-requests')
  listAllRequests(@Query('status') status?: string) {
    return this.creatorService.listAllRequests(status);
  }

  /** Admin: release payment */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('requests/:id/release')
  releasePayment(@Param('id') id: string) {
    return this.creatorService.releasePayment(id);
  }

  /* ═══════════════════════════════════════
   *  UGC PACKAGES
   * ═══════════════════════════════════════ */

  /** Public: list active packages */
  @Get('packages')
  getPackages(@Query('all') all?: string, @Query('service_type') serviceType?: string) {
    return this.creatorService.getPackages(all !== 'true', serviceType);
  }

  /** Public: get package by slug */
  @Get('packages/:slug')
  getPackageBySlug(@Param('slug') slug: string) {
    return this.creatorService.getPackageBySlug(slug);
  }

  /** Admin: create package */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('packages')
  createPackage(@Body() body: any) {
    return this.creatorService.createPackage(body);
  }

  /** Admin: update package */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('packages/:id')
  updatePackage(@Param('id') id: string, @Body() body: any) {
    return this.creatorService.updatePackage(id, body);
  }

  /** Admin: delete package */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('packages/:id')
  deletePackage(@Param('id') id: string) {
    return this.creatorService.deletePackage(id);
  }

  /* ═══════════════════════════════════════
   *  LIVE BOOKINGS
   * ═══════════════════════════════════════ */

  /** Customer: create live booking */
  @UseGuards(JwtAuthGuard)
  @Post('live')
  createLiveBooking(@Request() req: any, @Body() body: any) {
    return this.creatorService.createLiveBooking(req.user.id, body);
  }

  /** Customer: my live bookings */
  @UseGuards(JwtAuthGuard)
  @Get('live/my')
  getMyLiveBookings(@Request() req: any) {
    return this.creatorService.getCustomerLiveBookings(req.user.id);
  }

  /** Creator: available live jobs */
  @UseGuards(JwtAuthGuard)
  @Get('live/available')
  getAvailableLiveJobs() {
    return this.creatorService.getAvailableLiveJobs();
  }

  /** Creator: my live schedule */
  @UseGuards(JwtAuthGuard)
  @Get('live/schedule')
  getMyLiveSchedule(@Request() req: any) {
    return this.creatorService.getCreatorLiveBookings(req.user.id);
  }

  /** Creator: accept live job */
  @UseGuards(JwtAuthGuard)
  @Patch('live/:id/accept')
  acceptLiveJob(@Param('id') id: string, @Request() req: any) {
    return this.creatorService.acceptLiveJob(id, req.user.id);
  }

  /** Creator: complete live */
  @UseGuards(JwtAuthGuard)
  @Patch('live/:id/complete')
  completeLiveBooking(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: any,
  ) {
    return this.creatorService.completeLiveBooking(id, req.user.id, body);
  }

  /** Admin: all live bookings */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('live/all')
  getAllLiveBookings() {
    return this.creatorService.getAllLiveBookings();
  }

  /* ═══════════════════════════════════════
   *  RATINGS
   * ═══════════════════════════════════════ */

  /** Customer: submit rating */
  @UseGuards(JwtAuthGuard)
  @Post('ratings')
  submitRating(@Request() req: any, @Body() body: any) {
    return this.creatorService.submitRating(req.user.id, body);
  }

  /** Get creator's ratings */
  @UseGuards(JwtAuthGuard)
  @Get('ratings/:creatorId')
  getCreatorRatings(
    @Param('creatorId') creatorId: string,
    @Query('type') type?: string,
  ) {
    return this.creatorService.getCreatorRatings(creatorId, type);
  }

  /** Get creator's rating stats */
  @UseGuards(JwtAuthGuard)
  @Get('ratings/:creatorId/stats')
  getCreatorRatingStats(@Param('creatorId') creatorId: string) {
    return this.creatorService.getCreatorRatingStats(creatorId);
  }

  /** Get top creators */
  @Get('top-creators')
  getTopCreators(@Query('type') type?: string, @Query('limit') limit?: string) {
    return this.creatorService.getTopCreators(type, limit ? parseInt(limit) : 10);
  }

  /** Admin: rating analytics */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('rating-analytics')
  getRatingAnalytics() {
    return this.creatorService.getRatingAnalytics();
  }

  /* ═══════════════════════════════════════
   *  SERVICE PRICING
   * ═══════════════════════════════════════ */

  /** Public: get pricing list */
  @Get('pricing')
  getPricingList(@Query('type') serviceType?: string) {
    return this.creatorService.getPricingList(serviceType);
  }

  /** Public: get specific price */
  @Get('pricing/:serviceType/:contentType')
  getPrice(
    @Param('serviceType') serviceType: string,
    @Param('contentType') contentType: string,
    @Query('rush') rush?: string,
  ) {
    return this.creatorService.getPrice(serviceType, contentType, rush === 'true');
  }

  /** Admin: upsert pricing */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('pricing')
  upsertPricing(@Body() body: any) {
    return this.creatorService.upsertPricing(body);
  }

  /** Admin: delete pricing */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('pricing/:id')
  deletePricing(@Param('id') id: string) {
    return this.creatorService.deletePricing(id);
  }

  /** Admin: seed default pricing */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('pricing/seed')
  seedPricing() {
    return this.creatorService.seedDefaultPricing();
  }

  /* ═══════════════════════════════════════
   *  PORTFOLIO
   * ═══════════════════════════════════════ */

  /** Creator: get own portfolio */
  @UseGuards(JwtAuthGuard)
  @Get('portfolio')
  getMyPortfolio(@Request() req: any) {
    return this.creatorService.getCreatorPortfolio(req.user.id);
  }

  /** Creator: upload file + add to portfolio */
  @UseGuards(JwtAuthGuard)
  @Post('portfolio/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
  }))
  async uploadPortfolioItem(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
    @Body() body: any,
  ) {
    const upload = this.uploadService.processFile(file);
    if (!upload.success) return upload;

    const isVideo = /\.(mp4|webm|mov)$/i.test(file.originalname);
    const item = await this.creatorService.addPortfolioItem(req.user.id, {
      title: body.title || file.originalname.replace(/\.[^.]+$/, ''),
      description: body.description,
      type: isVideo ? 'video' : 'image',
      media_url: upload.file_url,
      category: body.category,
    });
    return item;
  }

  /** Creator: add portfolio item (without upload) */
  @UseGuards(JwtAuthGuard)
  @Post('portfolio')
  addPortfolioItem(@Request() req: any, @Body() body: any) {
    return this.creatorService.addPortfolioItem(req.user.id, body);
  }

  /** Get creator's portfolio by ID */
  @Get('portfolio/:creatorId')
  getCreatorPortfolio(@Param('creatorId') creatorId: string) {
    return this.creatorService.getCreatorPortfolio(creatorId);
  }

  /** Creator: update portfolio item */
  @UseGuards(JwtAuthGuard)
  @Patch('portfolio/:id')
  updatePortfolioItem(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.creatorService.updatePortfolioItem(id, req.user.id, body);
  }

  /** Creator: delete portfolio item */
  @UseGuards(JwtAuthGuard)
  @Delete('portfolio/:id')
  deletePortfolioItem(@Param('id') id: string, @Request() req: any) {
    return this.creatorService.deletePortfolioItem(id, req.user.id);
  }

  /** Public: browse portfolio */
  @Get('portfolio-browse')
  browsePortfolio(@Query('category') category?: string, @Query('limit') limit?: string) {
    return this.creatorService.browsePortfolio(category, limit ? parseInt(limit) : 20);
  }

  /** Portfolio: increment view */
  @Post('portfolio/:id/view')
  viewPortfolio(@Param('id') id: string) {
    return this.creatorService.incrementPortfolioView(id);
  }

  /** Portfolio: like */
  @Post('portfolio/:id/like')
  likePortfolio(@Param('id') id: string) {
    return this.creatorService.likePortfolioItem(id);
  }

  /* ═══════════════════════════════════════
   *  ORDER MATCHING
   * ═══════════════════════════════════════ */

  /** Smart match creators for a request */
  @Get('match')
  matchCreators(
    @Query('service_type') serviceType: string,
    @Query('content_type') contentType?: string,
    @Query('budget') budget?: string,
  ) {
    return this.creatorService.matchCreators({
      service_type: serviceType || 'social',
      content_type: contentType,
      budget: budget ? parseFloat(budget) : undefined,
    });
  }

  /* ═══════════════════════════════════════
   *  CREATOR SCORE & LEVEL
   * ═══════════════════════════════════════ */

  /** Get my score breakdown */
  @UseGuards(JwtAuthGuard)
  @Get('score')
  getMyScore(@Request() req: any) {
    return this.creatorService.calculateCreatorScore(req.user.id);
  }

  /** Admin: get any creator's score */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('score/:creatorId')
  getCreatorScore(@Param('creatorId') creatorId: string) {
    return this.creatorService.calculateCreatorScore(creatorId);
  }

  /** Admin: recalculate and update creator level */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('score/:creatorId/refresh')
  refreshLevel(@Param('creatorId') creatorId: string) {
    return this.creatorService.refreshCreatorLevel(creatorId);
  }

  /* ═══════════════════════════════════════
   *  ORDER COMMENTS
   * ═══════════════════════════════════════ */

  @UseGuards(JwtAuthGuard)
  @Get('orders/:orderId/comments')
  getComments(@Param('orderId') orderId: string) {
    return this.creatorService.getComments(orderId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/:orderId/comments')
  addComment(
    @Param('orderId') orderId: string,
    @Request() req: any,
    @Body() body: any,
  ) {
    const user = req.user;
    return this.creatorService.addComment(orderId, user.id, {
      message: body.message,
      role: body.role || (user.role === 'admin' || user.role === 'superadmin' ? 'admin' : 'customer'),
      user_name: body.user_name || user.full_name || user.email,
      attachment_urls: body.attachment_urls,
      action: body.action,
    });
  }

  /** Get my rank score */
  @UseGuards(JwtAuthGuard)
  @Get('rank')
  getMyRank(@Request() req: any, @Query('days') days?: string) {
    return this.creatorService.calculateRankScore(req.user.id, days ? parseInt(days) : 30);
  }

  /** Leaderboard */
  @Get('leaderboard')
  getLeaderboard(@Query('days') days?: string, @Query('limit') limit?: string) {
    return this.creatorService.getLeaderboard(
      days ? parseInt(days) : 30,
      limit ? parseInt(limit) : 20,
    );
  }

  /* ═══════════════════════════════════════
   *  GOVERNANCE: PERMISSIONS
   * ═══════════════════════════════════════ */

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('governance/:creatorId')
  getGovernance(@Param('creatorId') creatorId: string) {
    return this.creatorService.getGovernanceSummary(creatorId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('permissions/:creatorId')
  getPermissions(@Param('creatorId') creatorId: string) {
    return this.creatorService.getPermissions(creatorId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('permissions/:creatorId')
  updatePermissions(@Param('creatorId') creatorId: string, @Body() body: any) {
    return this.creatorService.updatePermissions(creatorId, body);
  }

  /* ═══════════════════════════════════════
   *  GOVERNANCE: CONTRACTS
   * ═══════════════════════════════════════ */

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('contracts')
  getAllContracts() {
    return this.creatorService.getAllContracts();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('contracts/:creatorId')
  getContract(@Param('creatorId') creatorId: string) {
    return this.creatorService.getContract(creatorId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('contracts/sign')
  signContract(@Request() req: any, @Body() body: any) {
    return this.creatorService.signContract(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('contracts/:creatorId/terminate')
  terminateContract(@Param('creatorId') creatorId: string, @Body() body: any) {
    return this.creatorService.terminateContract(creatorId, body.reason);
  }

  @Get('payout-preview')
  payoutPreview(
    @Query('amount') amount: string,
    @Query('commission') commission: string,
    @Query('tax') tax: string,
  ) {
    return this.creatorService.calculatePayout(
      parseFloat(amount || '100000'),
      parseFloat(commission || '20'),
      parseFloat(tax || '10'),
    );
  }

  /* ═══════════════════════════════════════
   *  GOVERNANCE: PENALTIES
   * ═══════════════════════════════════════ */

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('penalties')
  getAllPenalties() {
    return this.creatorService.getAllPenalties();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('penalties/:creatorId')
  getPenalties(@Param('creatorId') creatorId: string) {
    return this.creatorService.getPenalties(creatorId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('penalties')
  addPenalty(@Request() req: any, @Body() body: any) {
    return this.creatorService.addPenalty(body.creator_id, {
      ...body,
      issued_by: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('penalties/:id/resolve')
  resolvePenalty(@Param('id') id: string) {
    return this.creatorService.resolvePenalty(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('penalties/:creatorId/reset')
  resetStrikes(@Param('creatorId') creatorId: string) {
    return this.creatorService.resetStrikes(creatorId);
  }
}
