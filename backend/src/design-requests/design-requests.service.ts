import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DesignRequest, DesignStatus } from './design-request.entity'
import { DesignVersion } from './entities/design-version.entity'
import { DesignComment } from './entities/design-comment.entity'
import { DesignZoomSession } from './entities/design-zoom-session.entity'
import { Order, OrderStatus } from '../orders/entities/order.entity'
import { User } from '../users/user.entity'
import { MailService } from '../mail/mail.service'
import { WalletService } from '../wallet/wallet.service'
import { SettingsService } from '../settings/settings.service'
import { EventBusService } from '../events/event-bus.service'
import { BizEvent } from '../events/event-types'
import { ZoomService } from './zoom.service'

const DEFAULT_DESIGNER_FEE = 15000
const DEFAULT_TAX_PERCENT = 10

@Injectable()
export class DesignRequestsService {
  constructor(
    @InjectRepository(DesignRequest)
    private repo: Repository<DesignRequest>,
    @InjectRepository(DesignVersion)
    private versionRepo: Repository<DesignVersion>,
    @InjectRepository(DesignComment)
    private commentRepo: Repository<DesignComment>,
    @InjectRepository(DesignZoomSession)
    private zoomSessionRepo: Repository<DesignZoomSession>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private mailService: MailService,
    private walletService: WalletService,
    private settingsService: SettingsService,
    private eventBus: EventBusService,
    private zoomService: ZoomService,
  ) {}

  // ── Basic queries ──────────────────────────────────────────────────────────

  findAll()                  { return this.repo.find({ order: { created_at: 'DESC' } }) }
  findByOrder(order_id: string) { return this.repo.find({ where: { order_id } }) }
  findByDesigner(designer_id: string) { return this.repo.find({ where: { designer_id }, order: { created_at: 'DESC' } }) }
  findByCustomer(customer_id: string) { return this.repo.find({ where: { customer_id }, order: { created_at: 'DESC' } }) }
  findPending()              { return this.repo.find({ where: { status: DesignStatus.PENDING }, order: { created_at: 'ASC' } }) }
  findOne(id: string)        { return this.repo.findOne({ where: { id } }) }

  // ── Versions & Comments ────────────────────────────────────────────────────

  getVersions(design_request_id: string) {
    return this.versionRepo.find({
      where: { design_request_id },
      order: { version_number: 'ASC' },
    })
  }

  getComments(design_request_id: string) {
    return this.commentRepo.find({
      where: { design_request_id },
      order: { created_at: 'ASC' },
    })
  }

  getZoomSessions(design_request_id: string) {
    return this.zoomSessionRepo.find({
      where: { design_request_id },
      order: { created_at: 'DESC' },
    })
  }

  // ── Full detail (request + versions + comments + zoom sessions) ────────────

  async getFullDetail(id: string) {
    const dr = await this.findOne(id)
    if (!dr) throw new NotFoundException('Design request олдсонгүй')
    const [versions, comments, zoomSessions] = await Promise.all([
      this.getVersions(id),
      this.getComments(id),
      this.getZoomSessions(id),
    ])
    return { ...dr, versions, comments, zoomSessions }
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  create(data: Partial<DesignRequest>) {
    return this.repo.save(this.repo.create({ ...data, status: DesignStatus.PENDING }))
  }

  // ── Assign designer ────────────────────────────────────────────────────────

  async assign(id: string, designerId: string, designerName: string, designerPhone?: string, designerZoom?: string) {
    await this.repo.update(id, {
      designer_id: designerId,
      designer_name: designerName,
      designer_phone: designerPhone,
      designer_zoom: designerZoom,
      status: DesignStatus.ASSIGNED,
    })
    const dr = await this.findOne(id)
    if (dr?.customer_email) {
      this.mailService.sendDesignerAssigned({
        to: dr.customer_email,
        customerName: dr.customer_name || 'Customer',
        designerName,
        productName: dr.product_name || 'Product',
        orderId: dr.order_id,
        zoomLink: designerZoom,
      }).catch(() => {})
    }
    return dr
  }

  // ── Submit file (designer → creates new version) ──────────────────────────

  async submitVersion(
    id: string,
    fileUrl: string,
    previewUrl: string | undefined,
    uploadedById: string,
    uploaderName: string,
    versionNote?: string,
    issues?: any,
  ) {
    const dr = await this.findOne(id)
    if (!dr) throw new NotFoundException('Design request олдсонгүй')
    if (dr.approval_locked) throw new BadRequestException('Загвар батлагдсан. Өөрчлөх боломжгүй.')

    // Calculate next version number
    const nextVersion = dr.current_version + 1

    // Clear previous current version
    await this.versionRepo.update(
      { design_request_id: id, is_current: true },
      { is_current: false },
    )

    // Create new version
    const version = await this.versionRepo.save(
      this.versionRepo.create({
        design_request_id: id,
        version_number: nextVersion,
        file_url: fileUrl,
        preview_url: previewUrl,
        uploaded_by_id: uploadedById,
        uploaded_by_name: uploaderName,
        uploaded_by_role: 'designer',
        version_note: versionNote,
        issues,
        is_current: true,
      }),
    )

    // Update request
    const newStatus = nextVersion === 1 ? DesignStatus.IN_PROGRESS : DesignStatus.UPDATED_VERSION
    await this.repo.update(id, {
      current_version: nextVersion,
      file_url: fileUrl,
      preview_url: previewUrl,
      status: newStatus,
    })

    // Add system comment
    await this.addComment(id, {
      author_id: uploadedById,
      author_name: uploaderName,
      author_role: 'designer',
      content: `v${nextVersion} загвар байршуулагдлаа.${versionNote ? ` Тайлбар: ${versionNote}` : ''}`,
      type: 'system',
      version_id: version.id,
      version_number: nextVersion,
    })

    // Emit event
    this.eventBus.emit(BizEvent.DESIGN_FILE_UPLOADED, {
      designRequestId: id,
      customerId: dr.customer_id,
      designerId: dr.designer_id,
      versionNumber: nextVersion,
      versionId: version.id,
    })

    return this.getFullDetail(id)
  }

  // ── Submit for customer review ─────────────────────────────────────────────

  async submitForReview(id: string, designerId: string) {
    const dr = await this.findOne(id)
    if (!dr) throw new NotFoundException()
    if (dr.approval_locked) throw new BadRequestException('Загвар батлагдсан.')

    await this.repo.update(id, { status: DesignStatus.UNDER_REVIEW })

    await this.addComment(id, {
      author_id: designerId,
      author_name: dr.designer_name || 'Дизайнер',
      author_role: 'designer',
      content: `v${dr.current_version} загварыг хянуулахаар илгээлээ. Та хянаад батлах эсвэл засах хүсэлт явуулна уу.`,
      type: 'system',
    })

    // Emit so customer gets real-time notification
    this.eventBus.emit(BizEvent.DESIGN_FILE_UPLOADED, {
      designRequestId: id,
      customerId: dr.customer_id,
      designerId,
      versionNumber: dr.current_version,
      status: DesignStatus.UNDER_REVIEW,
    })

    return this.findOne(id)
  }

  // ── Revision requested (by customer) ──────────────────────────────────────

  async requestRevision(id: string, customerId: string, reason: string) {
    const dr = await this.findOne(id)
    if (!dr) throw new NotFoundException()
    if (dr.approval_locked) throw new BadRequestException('Загвар батлагдсан. Засах боломжгүй.')
    if (dr.status !== DesignStatus.UNDER_REVIEW && dr.status !== DesignStatus.UPDATED_VERSION) {
      throw new BadRequestException('Хянах горимд байхгүй байна.')
    }

    await this.repo.update(id, { status: DesignStatus.REVISION_REQUESTED })

    await this.addComment(id, {
      author_id: customerId,
      author_name: dr.customer_name || 'Хэрэглэгч',
      author_role: 'customer',
      content: reason,
      type: 'comment',
    })

    this.eventBus.emit(BizEvent.DESIGN_REVISION_REQUESTED, {
      designRequestId: id,
      customerId: dr.customer_id,
      designerId: dr.designer_id,
      reason,
    })

    return this.findOne(id)
  }

  // ── Add comment ────────────────────────────────────────────────────────────

  async addComment(
    designRequestId: string,
    data: {
      author_id: string
      author_name: string
      author_role: 'customer' | 'designer' | 'admin'
      content: string
      type?: 'comment' | 'issue' | 'suggestion' | 'system'
      version_id?: string
      version_number?: number
    },
  ) {
    const dr = await this.findOne(designRequestId)
    if (!dr) throw new NotFoundException()

    const comment = await this.commentRepo.save(
      this.commentRepo.create({
        design_request_id: designRequestId,
        version_id: data.version_id,
        version_number: data.version_number ?? dr.current_version,
        author_id: data.author_id,
        author_name: data.author_name,
        author_role: data.author_role,
        content: data.content,
        type: data.type ?? 'comment',
      }),
    )

    this.eventBus.emit(BizEvent.DESIGN_COMMENT_ADDED, {
      designRequestId,
      customerId: dr.customer_id,
      designerId: dr.designer_id,
      commentId: comment.id,
      authorRole: data.author_role,
    })

    return comment
  }

  // ── Resolve comment ────────────────────────────────────────────────────────

  async resolveComment(commentId: string) {
    await this.commentRepo.update(commentId, { resolved: true })
    return this.commentRepo.findOne({ where: { id: commentId } })
  }

  // ── Customer: request Zoom (notifies designer, who then creates actual meeting) ─

  async requestZoom(id: string, customerId: string, preferredAt?: Date) {
    const dr = await this.findOne(id)
    if (!dr) throw new NotFoundException()
    if (dr.approval_locked) throw new BadRequestException('Загвар батлагдсан.')

    // Store preferred meeting time
    if (preferredAt) {
      await this.repo.update(id, { zoom_preferred_at: preferredAt } as any)
    }

    const timeNote = preferredAt
      ? ` Хүссэн цаг: ${new Date(preferredAt).toLocaleString('mn-MN', { timeZone: 'Asia/Ulaanbaatar' })}.`
      : ''

    await this.addComment(id, {
      author_id: customerId,
      author_name: dr.customer_name || 'Хэрэглэгч',
      author_role: 'customer',
      content: `📹 Хэрэглэгч Zoom уулзалт хүсэж байна.${timeNote} Та уулзалт үүсгэнэ үү.`,
      type: 'system',
    })

    // Notify designer via email (look up email from users table)
    if (dr.designer_id) {
      this.userRepo.findOne({ where: { id: dr.designer_id }, select: ['email'] })
        .then(designer => {
          if (designer?.email) {
            return this.mailService.sendZoomRequested({
              to: designer.email,
              designerName: dr.designer_name || 'Дизайнер',
              customerName: dr.customer_name || 'Хэрэглэгч',
              productName: dr.product_name || 'Бүтээгдэхүүн',
              preferredAt,
              orderId: dr.order_id,
            })
          }
        })
        .catch(e => console.log('Zoom request email error:', e.message))
    }

    // Realtime notification to designer dashboard
    this.eventBus.emit(BizEvent.DESIGN_COMMENT_ADDED, {
      designRequestId: id,
      designerId: dr.designer_id,
      customerId: dr.customer_id,
    })

    return { success: true, message: 'Zoom хүсэлт дизайнерт илгээгдлээ' }
  }

  // ── Designer: create Zoom session (becomes HOST, can share screen) ─────────

  async createZoomSession(id: string, requestedBy: string, scheduledAt?: Date) {
    const dr = await this.findOne(id)
    if (!dr) throw new NotFoundException()

    // Try Zoom API first
    const meeting = await this.zoomService.createMeeting({
      topic: `BizPrint Design Review - ${dr.product_name || dr.id}`,
      scheduledAt,
      durationMinutes: 30,
    })

    let joinUrl: string
    let startUrl: string | null = null
    let zoomMeetingId: string | null = null
    let password: string | null = null

    if (meeting) {
      // Zoom API succeeded
      joinUrl = meeting.join_url
      startUrl = meeting.start_url
      zoomMeetingId = meeting.meeting_id
      password = meeting.password

      // Save to request
      await this.repo.update(id, {
        zoom_meeting_id: zoomMeetingId,
        zoom_join_url: joinUrl,
        zoom_start_url: startUrl,
        zoom_password: password,
        status: DesignStatus.ZOOM_SCHEDULED,
      })
    } else {
      // Fallback: use designer's personal Zoom link
      joinUrl = dr.designer_zoom || 'https://zoom.us'
      await this.repo.update(id, {
        zoom_join_url: joinUrl,
        status: DesignStatus.ZOOM_SCHEDULED,
      })
    }

    // Save session record
    const session = await this.zoomSessionRepo.save(
      this.zoomSessionRepo.create({
        design_request_id: id,
        zoom_meeting_id: zoomMeetingId,
        join_url: joinUrl,
        start_url: startUrl,
        password,
        requested_by: requestedBy,
        scheduled_at: scheduledAt,
        status: 'scheduled',
      }),
    )

    // System comment
    await this.addComment(id, {
      author_id: requestedBy,
      author_name: requestedBy === dr.customer_id ? (dr.customer_name || 'Хэрэглэгч') : (dr.designer_name || 'Дизайнер'),
      author_role: requestedBy === dr.customer_id ? 'customer' : 'designer',
      content: `Zoom уулзалт товлогдлоо.${scheduledAt ? ` Цаг: ${scheduledAt.toLocaleString('mn-MN')}` : ''} Холбоос: ${joinUrl}`,
      type: 'system',
    })

    // Look up designer email for calendar invite attendees
    let designerEmail: string | null = null
    if (dr.designer_id) {
      const designer = await this.userRepo.findOne({
        where: { id: dr.designer_id },
        select: ['email'],
      }).catch(() => null)
      designerEmail = designer?.email || null
    }

    const attendeeEmails = [dr.customer_email, designerEmail].filter(Boolean) as string[]

    const zoomEmailPayload = {
      customerName: dr.customer_name || 'Хэрэглэгч',
      designerName: dr.designer_name || 'Дизайнер',
      productName: dr.product_name || 'Бүтээгдэхүүн',
      joinUrl,
      password: password || undefined,
      scheduledAt,
      meetingId: zoomMeetingId || undefined,
      attendeeEmails,
    }

    // Email customer with the join link + .ics calendar invite
    if (dr.customer_email) {
      this.mailService.sendZoomCreated({
        to: dr.customer_email,
        ...zoomEmailPayload,
      }).catch(e => console.log('Zoom created email (customer) error:', e.message))
    }

    // Email designer too — they also get the calendar invite
    if (designerEmail) {
      this.mailService.sendZoomCreated({
        to: designerEmail,
        ...zoomEmailPayload,
      }).catch(e => console.log('Zoom created email (designer) error:', e.message))
    }

    this.eventBus.emit(BizEvent.DESIGN_ZOOM_CREATED, {
      designRequestId: id,
      customerId: dr.customer_id,
      designerId: dr.designer_id,
      joinUrl,
      scheduledAt,
      sessionId: session.id,
    })

    return { ...session, join_url: joinUrl, start_url: startUrl }
  }

  // ── Customer approves design ───────────────────────────────────────────────

  async approve(id: string) {
    const dr = await this.findOne(id)
    if (!dr) throw new NotFoundException()
    if (dr.approval_locked) return this.getFullDetail(id) // already approved

    // LOCK production
    await this.repo.update(id, {
      status: DesignStatus.APPROVED,
      approval_locked: true,
    })

    // System comment
    await this.addComment(id, {
      author_id: dr.customer_id || 'system',
      author_name: dr.customer_name || 'Хэрэглэгч',
      author_role: 'customer',
      content: `✅ Загвар батлагдлаа (v${dr.current_version}). Үйлдвэрлэл эхэлж байна.`,
      type: 'system',
    })

    // Designer wallet credit
    if (dr.designer_id) {
      await this.processDesignerPayment(dr)
    }

    // Email notification to customer
    if (dr.customer_email) {
      this.mailService.sendDesignApproved({
        to: dr.customer_email,
        customerName: dr.customer_name || 'Customer',
        productName: dr.product_name || 'Product',
        orderId: dr.order_id,
      }).catch(() => {})
    }

    // ── Auto-advance order to PREPRESS + notify factory ─────────────────────
    if (dr.order_id) {
      try {
        // 1. Move order to prepress, store approved design file URL
        await this.orderRepo.update(dr.order_id, {
          status: OrderStatus.FILE_REVIEW,
          file_url: dr.file_url,
        })

        // 2. Send production email to ALL registered factory users
        const order = await this.orderRepo.findOne({ where: { id: dr.order_id } })
        const factoryUsers = await this.userRepo.find({
          where: { role: 'factory', is_active: true },
          select: ['id', 'email', 'full_name', 'company_name'],
        })

        // Also check settings fallback email (in case no factory users registered yet)
        const fallbackEmail = await this.settingsService.get('factory_order_email').catch(() => null)
        const extraEmails: Array<{ email: string; name?: string }> =
          fallbackEmail ? [{ email: fallbackEmail, name: 'Үйлдвэр' }] : []

        const recipients = [
          ...factoryUsers.map(u => ({ email: u.email, name: u.company_name || u.full_name || 'Үйлдвэр' })),
          ...extraEmails.filter(e => !factoryUsers.some(u => u.email === e.email)),
        ]

        if (recipients.length > 0) {
          const emailPayload = {
            orderId: dr.order_id,
            productName: dr.product_name || (order as any)?.product_name || 'Бүтээгдэхүүн',
            quantity: (order as any)?.quantity || 0,
            fileUrl: dr.file_url,
            customerName: dr.customer_name || 'Хэрэглэгч',
            notes: (order as any)?.notes,
          }
          console.log(`[DesignApproval] Sending production email to ${recipients.length} factory recipient(s)`)
          for (const r of recipients) {
            this.mailService.sendFactoryProductionOrder({
              to: r.email,
              factoryName: r.name,
              ...emailPayload,
            }).catch(e => console.log(`Factory email error (${r.email}):`, e.message))
          }
        } else {
          console.log('[DesignApproval] No factory users or fallback email configured — skipping factory notification')
        }

        // 3. Emit order status changed event
        this.eventBus.emit(BizEvent.ORDER_STATUS_UPDATED, {
          orderId: dr.order_id,
          status: OrderStatus.FILE_REVIEW,
          customerId: dr.customer_id,
        })
      } catch (e) {
        console.log('Order prepress transition error:', e.message)
      }
    }

    // Emit DESIGN_APPROVED → production can start
    this.eventBus.emit(BizEvent.DESIGN_APPROVED, {
      designRequestId: id,
      orderId: dr.order_id,
      customerId: dr.customer_id,
      designerId: dr.designer_id,
      versionNumber: dr.current_version,
      fileUrl: dr.file_url,
    })

    return this.getFullDetail(id)
  }

  // ── Reject ─────────────────────────────────────────────────────────────────

  async reject(id: string, reason: string) {
    await this.repo.update(id, { status: DesignStatus.REJECTED, reject_reason: reason })
    const dr = await this.findOne(id)
    this.eventBus.emit(BizEvent.DESIGN_REJECTED, {
      designRequestId: id,
      customerId: dr?.customer_id,
      designerId: dr?.designer_id,
      reason,
    })
    return dr
  }

  // ── Mark as in production (called after production job created) ────────────

  async markInProduction(id: string) {
    await this.repo.update(id, { status: DesignStatus.IN_PRODUCTION, approval_locked: true })
    this.eventBus.emit(BizEvent.DESIGN_IN_PRODUCTION, { designRequestId: id })
    return this.findOne(id)
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  async update(id: string, data: Partial<DesignRequest>) {
    await this.repo.update(id, data)
    return this.findOne(id)
  }

  async remove(id: string) {
    await this.repo.delete(id)
    return { deleted: true }
  }

  // ── Legacy: submitFile (kept for backwards compat) ─────────────────────────

  async submitFile(id: string, fileUrl: string, previewUrl?: string) {
    await this.repo.update(id, {
      status: DesignStatus.IN_PROGRESS,
      file_url: fileUrl,
      preview_url: previewUrl,
    })
    return this.findOne(id)
  }

  // ── Private: Designer payment ──────────────────────────────────────────────

  private async processDesignerPayment(dr: DesignRequest) {
    try {
      const customFeeSetting = await this.settingsService.get(`designer_fee_${dr.designer_id}`)
      const defaultFeeSetting = await this.settingsService.get('designer_fee_per_job')
      const taxSetting = await this.settingsService.get('tax_haoat_percent')

      const grossFee = customFeeSetting
        ? parseFloat(customFeeSetting)
        : defaultFeeSetting ? parseFloat(defaultFeeSetting) : DEFAULT_DESIGNER_FEE

      const taxPercent = taxSetting ? parseFloat(taxSetting) : DEFAULT_TAX_PERCENT
      const taxAmount = Math.round(grossFee * taxPercent / 100)
      const netFee = grossFee - taxAmount

      await this.walletService.credit(
        dr.designer_id,
        netFee,
        'design_fee',
        dr.id,
        `Design #${dr.id.slice(0, 8)} fee: ${grossFee} - ${taxPercent}% HAOAT (${taxAmount}) = ${netFee}`,
      )
    } catch (e) {
      console.log('Designer payment error:', e.message)
    }
  }
}
