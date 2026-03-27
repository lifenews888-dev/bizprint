import { Controller, Post, Body, Headers, RawBodyRequest, Req, Logger, HttpCode } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DesignZoomSession } from './entities/design-zoom-session.entity'
import { DesignRequest } from './design-request.entity'
import { EventBusService } from '../events/event-bus.service'
import { BizEvent } from '../events/event-types'
import * as crypto from 'crypto'

/* ═══════════════════════════════════════
 *  Zoom Webhook Receiver
 *  Handles:
 *    - meeting.started  → session status = active
 *    - meeting.ended    → session status = completed, trigger approval flow
 *    - endpoint.url_validation → Zoom CRC challenge
 *
 *  HMAC signature verification for security
 *  Endpoint: POST /zoom-webhook
 * ═══════════════════════════════════════ */

@Controller('zoom-webhook')
export class ZoomWebhookController {
  private readonly logger = new Logger(ZoomWebhookController.name)

  constructor(
    @InjectRepository(DesignZoomSession) private sessionRepo: Repository<DesignZoomSession>,
    @InjectRepository(DesignRequest) private designRepo: Repository<DesignRequest>,
    private readonly eventBus: EventBusService,
  ) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Body() body: any,
    @Headers('x-zm-signature') signature: string,
    @Headers('x-zm-request-timestamp') timestamp: string,
  ) {
    // ── Zoom URL Validation Challenge (CRC) ──────────────────────────
    if (body.event === 'endpoint.url_validation') {
      const secret = process.env.ZOOM_WEBHOOK_SECRET || ''
      const hashForValidate = crypto
        .createHmac('sha256', secret)
        .update(body.payload?.plainToken || '')
        .digest('hex')
      return {
        plainToken: body.payload?.plainToken,
        encryptedToken: hashForValidate,
      }
    }

    // ── HMAC Signature Verification ──────────────────────────────────
    if (!this.verifySignature(body, signature, timestamp)) {
      this.logger.warn('Zoom webhook signature verification failed')
      return { status: 'unauthorized' }
    }

    const event = body.event
    const payload = body.payload?.object
    const meetingId = payload?.id ? String(payload.id) : null

    if (!meetingId) {
      return { status: 'no_meeting_id' }
    }

    this.logger.log(`Zoom webhook: ${event} for meeting ${meetingId}`)

    // ── meeting.started ──────────────────────────────────────────────
    if (event === 'meeting.started') {
      const session = await this.sessionRepo.findOne({ where: { zoom_meeting_id: meetingId } })
      if (session) {
        session.status = 'active'
        await this.sessionRepo.save(session)

        // Update design request status
        const design = await this.designRepo.findOne({ where: { id: session.design_request_id } })
        if (design) {
          design.status = 'in_meeting' as any
          await this.designRepo.save(design)

          this.eventBus.emit(BizEvent.DESIGN_COMMENT_ADDED, {
            designRequestId: design.id,
            message: '📹 Zoom уулзалт эхэллээ',
          })
        }

        this.logger.log(`Meeting ${meetingId} started → session ${session.id} active`)
      }
      return { status: 'ok', action: 'meeting_started' }
    }

    // ── meeting.ended ────────────────────────────────────────────────
    if (event === 'meeting.ended') {
      const session = await this.sessionRepo.findOne({ where: { zoom_meeting_id: meetingId } })
      if (session) {
        session.status = 'completed'
        await this.sessionRepo.save(session)

        // Move design to review state (trigger approval flow)
        const design = await this.designRepo.findOne({ where: { id: session.design_request_id } })
        if (design && ['zoom_scheduled', 'in_meeting'].includes(design.status)) {
          design.status = 'under_review' as any
          await this.designRepo.save(design)

          this.eventBus.emit(BizEvent.DESIGN_COMMENT_ADDED, {
            designRequestId: design.id,
            message: '📹 Zoom уулзалт дууслаа. Батлах эсвэл засвар хүсэх боломжтой.',
          })
        }

        this.logger.log(`Meeting ${meetingId} ended → session ${session.id} completed, approval flow triggered`)
      }
      return { status: 'ok', action: 'meeting_ended' }
    }

    // ── meeting.participant_joined ───────────────────────────────────
    if (event === 'meeting.participant_joined') {
      this.logger.log(`Participant joined meeting ${meetingId}: ${payload?.participant?.user_name || 'unknown'}`)
      return { status: 'ok', action: 'participant_joined' }
    }

    return { status: 'ignored', event }
  }

  /* ═══════════════════════════════════════
   *  HMAC Signature Verification
   * ═══════════════════════════════════════ */

  private verifySignature(body: any, signature: string, timestamp: string): boolean {
    const secret = process.env.ZOOM_WEBHOOK_SECRET
    if (!secret) return true // Skip verification if no secret configured (dev mode)

    try {
      const message = `v0:${timestamp}:${JSON.stringify(body)}`
      const hash = crypto.createHmac('sha256', secret).update(message).digest('hex')
      const expected = `v0=${hash}`
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || ''))
    } catch {
      return false
    }
  }
}
