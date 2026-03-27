import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, Request,
} from '@nestjs/common'
import { DesignRequestsService } from './design-requests.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('design-requests')
export class DesignRequestsController {
  constructor(private svc: DesignRequestsService) {}

  // ── List queries ─────────────────────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() { return this.svc.findAll() }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats() { return this.svc.getStats() }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  findPending() { return this.svc.findPending() }

  @Get('designer/:id')
  @UseGuards(JwtAuthGuard)
  findByDesigner(@Param('id') id: string) { return this.svc.findByDesigner(id) }

  @Get('customer/:id')
  @UseGuards(JwtAuthGuard)
  findByCustomer(@Param('id') id: string) { return this.svc.findByCustomer(id) }

  @Get('order/:id')
  @UseGuards(JwtAuthGuard)
  findByOrder(@Param('id') id: string) { return this.svc.findByOrder(id) }

  // ── Single item (full detail with versions, comments, zoom) ──────────────────

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) { return this.svc.getFullDetail(id) }

  // ── Create ────────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: any, @Request() req: any) {
    return this.svc.create({ ...body, customer_id: body.customer_id || req.user?.id })
  }

  // ── Designer: assign ──────────────────────────────────────────────────────────

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard)
  assign(@Param('id') id: string, @Body() body: any) {
    return this.svc.assign(id, body.designer_id, body.designer_name, body.designer_phone, body.designer_zoom)
  }

  // ── Designer: upload new version ──────────────────────────────────────────────
  // POST /design-requests/:id/versions

  @Post(':id/versions')
  @UseGuards(JwtAuthGuard)
  submitVersion(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.svc.submitVersion(
      id,
      body.file_url,
      body.preview_url,
      req.user?.id,
      req.user?.full_name || req.user?.name || 'Дизайнер',
      body.version_note,
      body.issues,
    )
  }

  // ── Designer: submit for customer review ──────────────────────────────────────

  @Patch(':id/submit-for-review')
  @UseGuards(JwtAuthGuard)
  submitForReview(@Param('id') id: string, @Request() req: any) {
    return this.svc.submitForReview(id, req.user?.id)
  }

  // ── Legacy: submit file (backwards compat) ────────────────────────────────────

  @Patch(':id/submit')
  @UseGuards(JwtAuthGuard)
  submit(@Param('id') id: string, @Body() body: any) {
    return this.svc.submitFile(id, body.file_url, body.preview_url)
  }

  // ── Customer: request revision ────────────────────────────────────────────────

  @Patch(':id/request-revision')
  @UseGuards(JwtAuthGuard)
  requestRevision(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.svc.requestRevision(id, req.user?.id, body.reason || 'Засах хүсэлт')
  }

  // ── Customer: approve design ──────────────────────────────────────────────────

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  approve(@Param('id') id: string) { return this.svc.approve(id) }

  // ── Comments ──────────────────────────────────────────────────────────────────

  @Get(':id/comments')
  @UseGuards(JwtAuthGuard)
  getComments(@Param('id') id: string) { return this.svc.getComments(id) }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  addComment(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.svc.addComment(id, {
      author_id: req.user?.id,
      author_name: req.user?.full_name || req.user?.name || 'Хэрэглэгч',
      author_role: body.author_role || req.user?.role || 'customer',
      content: body.content,
      type: body.type || 'comment',
      version_id: body.version_id,
      version_number: body.version_number,
    })
  }

  @Patch('comments/:commentId/resolve')
  @UseGuards(JwtAuthGuard)
  resolveComment(@Param('commentId') commentId: string) {
    return this.svc.resolveComment(commentId)
  }

  // ── Versions ──────────────────────────────────────────────────────────────────

  @Get(':id/versions')
  @UseGuards(JwtAuthGuard)
  getVersions(@Param('id') id: string) { return this.svc.getVersions(id) }

  // ── Customer: request Zoom (notifies designer) ────────────────────────────────

  @Patch(':id/request-zoom')
  @UseGuards(JwtAuthGuard)
  requestZoom(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const preferredAt = body?.preferred_at ? new Date(body.preferred_at) : undefined
    return this.svc.requestZoom(id, req.user?.id, preferredAt)
  }

  // ── Designer: create Zoom session (HOST — can share screen) ──────────────────

  @Post(':id/zoom')
  @UseGuards(JwtAuthGuard)
  createZoomSession(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const scheduledAt = body.scheduled_at ? new Date(body.scheduled_at) : undefined
    return this.svc.createZoomSession(id, req.user?.id, scheduledAt)
  }

  @Get(':id/zoom')
  @UseGuards(JwtAuthGuard)
  getZoomSessions(@Param('id') id: string) { return this.svc.getZoomSessions(id) }

  // ── Reject ────────────────────────────────────────────────────────────────────

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  reject(@Param('id') id: string, @Body() body: any) {
    return this.svc.reject(id, body.reason)
  }

  // ── Update & Delete ───────────────────────────────────────────────────────────

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body) }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) { return this.svc.remove(id) }
}
