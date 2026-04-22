import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { CampaignsService } from './campaigns.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGuard } from '../admin/admin.guard'

@Controller('campaigns')
export class CampaignsController {
  constructor(private svc: CampaignsService) {}

  /** Customer creates a draft brief. */
  @Post()
  @UseGuards(JwtAuthGuard)
  createDraft(@Body() body: any, @Req() req: any) {
    return this.svc.createDraft(req.user.id, body)
  }

  /** Customer submits the brief to admin for quoting. */
  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  submit(@Param('id') id: string, @Req() req: any) {
    return this.svc.submit(id, req.user.id)
  }

  /** Admin produces a quote. */
  @Post(':id/quote')
  @UseGuards(JwtAuthGuard, AdminGuard)
  quote(@Param('id') id: string, @Body() body: any) {
    return this.svc.quote(id, body)
  }

  /** Customer accepts the quote. */
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  approve(@Param('id') id: string, @Req() req: any) {
    return this.svc.approve(id, req.user.id)
  }

  /** Admin marks campaign as in production. */
  @Post(':id/start-production')
  @UseGuards(JwtAuthGuard, AdminGuard)
  startProduction(@Param('id') id: string) {
    return this.svc.markInProduction(id)
  }

  /** Recompute campaign status from spawned-order statuses (admin refresh). */
  @Post(':id/recompute')
  @UseGuards(JwtAuthGuard, AdminGuard)
  recompute(@Param('id') id: string) {
    return this.svc.recomputeStatus(id)
  }

  /** Customer's own campaigns. */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  myCampaigns(@Req() req: any) {
    return this.svc.findByCustomer(req.user.id)
  }

  /** Admin: list all campaigns (filterable by status). */
  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  listAll(@Query('status') status?: string) {
    return this.svc.findAll({ status })
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard, AdminGuard)
  summary() {
    return this.svc.getSummary()
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id)
  }

  /* ── Lines ───────────────────────────────────────── */
  @Get(':id/lines')
  @UseGuards(JwtAuthGuard)
  listLines(@Param('id') id: string) { return this.svc.listLines(id) }

  @Post(':id/lines')
  @UseGuards(JwtAuthGuard)
  addLine(@Param('id') id: string, @Body() body: any) { return this.svc.addLine(id, body) }

  @Delete('lines/:lineId')
  @UseGuards(JwtAuthGuard)
  removeLine(@Param('lineId') lineId: string) { return this.svc.removeLine(lineId) }

  /* ── Milestones ─────────────────────────────────── */
  @Get(':id/milestones')
  @UseGuards(JwtAuthGuard)
  listMilestones(@Param('id') id: string) { return this.svc.listMilestones(id) }

  @Post(':id/milestones')
  @UseGuards(JwtAuthGuard, AdminGuard)
  addMilestone(@Param('id') id: string, @Body() body: any) { return this.svc.addMilestone(id, body) }

  @Patch('milestones/:msId/complete')
  @UseGuards(JwtAuthGuard, AdminGuard)
  completeMilestone(@Param('msId') msId: string) { return this.svc.completeMilestone(msId) }

  /* ── Recipients ─────────────────────────────────── */
  @Get(':id/recipients/count')
  @UseGuards(JwtAuthGuard)
  countRecipients(@Param('id') id: string) { return this.svc.countRecipients(id) }

  @Get(':id/recipients')
  @UseGuards(JwtAuthGuard)
  listRecipients(@Param('id') id: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.svc.listRecipients(id, limit ? Number(limit) : 50, offset ? Number(offset) : 0)
  }

  /** Distribution batches grouped by city + address (multi-address delivery). */
  @Get(':id/delivery/batches')
  @UseGuards(JwtAuthGuard)
  deliveryBatches(@Param('id') id: string) {
    return this.svc.getDeliveryBatches(id)
  }

  /**
   * Upload a recipient CSV. Multipart form with file field "file" (text/csv).
   * Pass ?append=true to add to the existing list instead of replacing.
   */
  @Post(':id/recipients/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB CSV cap (~50k+ rows)
  }))
  uploadRecipients(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Query('append') append?: string,
  ) {
    if (!file) return { error: 'Файл оруулна уу' }
    const csv = file.buffer.toString('utf-8')
    return this.svc.importRecipientCsv(id, csv, append === 'true')
  }
}
