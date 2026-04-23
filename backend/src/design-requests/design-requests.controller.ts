import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, Request,
} from '@nestjs/common'
import { DesignRequestsService } from './design-requests.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('design-requests')
export class DesignRequestsController {
  constructor(private svc: DesignRequestsService) {}

  // ââ List queries âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

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

  // ââ Single item (full detail with versions, comments, zoom) ââââââââââââââââââ

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) { return this.svc.getFullDetail(id) }

  // ââ Create ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: any, @Request() req: any) {
    return this.svc.create({ ...body, customer_id: body.customer_id || req.user?.id })
  }

  // ââ Designer: assign ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard)
  assign(@Param('id') id: string, @Body() body: any) {
    return this.svc.assign(id, body.designer_id, body.designer_name, body.designer_phone, body.designer_zoom)
  }

  // ââ Designer: upload new version ââââââââââââââââââââââââââââââââââââââââââââââ
  // POST /design-requests/:id/versions

  @Post(':id/versions')
  @UseGuards(JwtAuthGuard)
  submitVersion(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.svc.submitVersion(
      id,
      body.file_url,
      body.preview_url,
      req.user?.id,
      req.user?.full_name || req.user?.name || 'ÐÐ¸Ð·Ð°Ð¹Ð½ÐµÑ',
      body.version_note,
      body.issues,
    )
  }

  // ââ Designer: submit for customer review ââââââââââââââââââââââââââââââââââââââ

  @Patch(':id/submit-for-review')
  @UseGuards(JwtAuthGuard)
  submitForReview(@Param('id') id: string, @Request() req: any) {
    return this.svc.submitForReview(id, req.user?.id)
  }

  // ââ Legacy: submit file (backwards compat) ââââââââââââââââââââââââââââââââââââ

  @Patch(':id/submit')
  @UseGuards(JwtAuthGuard)
  submit(@Param('id') id: string, @Body() body: any) {
    return this.svc.submitFile(id, body.file_url, body.preview_url)
  }

  // ââ Customer: request revision ââââââââââââââââââââââââââââââââââââââââââââââââ

  @Patch(':id/request-revision')
  @UseGuards(JwtAuthGuard)
  requestRevision(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.svc.requestRevision(id, req.user?.id, body.reason || 'ÐÐ°ÑÐ°Ñ ÑÒ¯ÑÑÐ»Ñ')
  }

  // ââ Customer: approve design ââââââââââââââââââââââââââââââââââââââââââââââââââ

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  approve(@Param('id') id: string) { return this.svc.approve(id) }

  // ââ Comments ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  @Get(':id/comments')
  @UseGuards(JwtAuthGuard)
  getComments(@Param('id') id: string) { return this.svc.getComments(id) }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  addComment(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.svc.addComment(id, {
      author_id: req.user?.id,
      author_name: req.user?.full_name || req.user?.name || 'Ð¥ÑÑÑÐ³Ð»ÑÐ³Ñ',
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

  // ââ Versions ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  @Get(':id/versions')
  @UseGuards(JwtAuthGuard)
  getVersions(@Param('id') id: string) { return this.svc.getVersions(id) }

  // ââ Customer: request Zoom (notifies designer) ââââââââââââââââââââââââââââââââ

  @Patch(':id/request-zoom')
  @UseGuards(JwtAuthGuard)
  requestZoom(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const preferredAt = body?.preferred_at ? new Date(body.preferred_at) : undefined
    return this.svc.requestZoom(id, req.user?.id, preferredAt)
  }

  // ââ Designer: create Zoom session (HOST â can share screen) ââââââââââââââââââ

  @Post(':id/zoom')
  @UseGuards(JwtAuthGuard)
  createZoomSession(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const scheduledAt = body.scheduled_at ? new Date(body.scheduled_at) : undefined
    return this.svc.createZoomSession(id, req.user?.id, scheduledAt)
  }

  @Get(':id/zoom')
  @UseGuards(JwtAuthGuard)
  getZoomSessions(@Param('id') id: string) { return this.svc.getZoomSessions(id) }

  // ââ Reject ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  reject(@Param('id') id: string, @Body() body: any) {
    return this.svc.reject(id, body.reason)
  }

  // ââ Update & Delete âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body) }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) { return this.svc.remove(id) }

  // —— Restore a version as current ————————————————————————————————————————
  @Patch(':id/versions/:versionId/restore')
  @UseGuards(JwtAuthGuard)
  restoreVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.svc.restoreVersion(id, versionId)
  }

}