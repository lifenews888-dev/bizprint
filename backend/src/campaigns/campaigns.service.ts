import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Campaign, CampaignStatus } from './campaign.entity'
import { CampaignOrder, CampaignOrderStatus } from './campaign-order.entity'
import { CampaignRecipient } from './campaign-recipient.entity'
import { CampaignMilestone, MilestoneStatus } from './campaign-milestone.entity'
import { User } from '../users/user.entity'
import { Order, OrderStatus } from '../orders/entities/order.entity'
import { NotificationService } from '../notifications/notification.service'
import { parseRecipientCsv } from './csv-parser'

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name)

  constructor(
    @InjectRepository(Campaign) private repo: Repository<Campaign>,
    @InjectRepository(CampaignOrder) private orderRepo: Repository<CampaignOrder>,
    @InjectRepository(CampaignRecipient) private recipientRepo: Repository<CampaignRecipient>,
    @InjectRepository(CampaignMilestone) private milestoneRepo: Repository<CampaignMilestone>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Order) private orderEntityRepo: Repository<Order>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Generate the next human-friendly code, e.g. CMP-2026-007.
   * Yearly counter resets on Jan 1.
   */
  private async nextCode(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `CMP-${year}-`
    const last = await this.repo
      .createQueryBuilder('c')
      .where('c.code LIKE :p', { p: `${prefix}%` })
      .orderBy('c.code', 'DESC')
      .limit(1)
      .getOne()
    const nextNum = last
      ? Number(last.code.split('-').pop()) + 1
      : 1
    return `${prefix}${String(nextNum).padStart(3, '0')}`
  }

  /** Customer creates a campaign brief (DRAFT status). */
  async createDraft(customerId: string, body: Partial<Campaign> & { lines?: Partial<CampaignOrder>[] }) {
    if (!body.title?.trim()) throw new BadRequestException('Кампанит ажлын нэр оруулна уу')
    const customer = await this.userRepo.findOne({ where: { id: customerId } })
    const code = await this.nextCode()
    const campaign = await this.repo.save(this.repo.create({
      code,
      customer_id: customerId,
      customer_company: body.customer_company || customer?.company_name,
      customer_contact_name: body.customer_contact_name || customer?.full_name,
      customer_contact_phone: body.customer_contact_phone || customer?.phone,
      customer_contact_email: body.customer_contact_email || customer?.email,
      sales_agent_id: customer?.referred_by_sales_id || undefined,
      title: body.title.trim(),
      description: body.description,
      brand_kit: body.brand_kit || {},
      estimated_budget: body.estimated_budget || 0,
      start_date: body.start_date || undefined,
      deadline: body.deadline || undefined,
      recipient_count: body.recipient_count || 0,
      status: CampaignStatus.DRAFT,
    }))

    // Optionally create initial product lines provided in the brief
    if (Array.isArray(body.lines) && body.lines.length) {
      for (const line of body.lines) {
        await this.orderRepo.save(this.orderRepo.create({
          campaign_id: campaign.id,
          product_id: line.product_id,
          product_name: line.product_name,
          product_category: line.product_category,
          type: line.type,
          quantity: line.quantity || 0,
          per_recipient_qty: line.per_recipient_qty,
          specs: line.specs || {},
          status: CampaignOrderStatus.PLANNED,
        }))
      }
    }

    return this.findOne(campaign.id)
  }

  /** Customer submits the brief to admin for quoting. */
  async submit(campaignId: string, customerId: string) {
    const c = await this.findOne(campaignId)
    if (c.customer_id !== customerId) throw new BadRequestException('Та энэ кампанит ажлын эзэн биш')
    if (c.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException(`Кампанит ажлын төлөв "${c.status}" — зөвхөн draft төлөвөөс илгээх боломжтой`)
    }
    await this.repo.update(campaignId, { status: CampaignStatus.SUBMITTED })

    // Notify admin pool
    await this.notificationService.create({
      user_id: 'admin',
      type: 'order',
      title: '🎯 Шинэ кампанит ажил',
      message: `${c.code} — ${c.customer_company || c.customer_contact_name} (${c.title})`,
      data: { campaign_id: campaignId, code: c.code },
    }).catch(() => {})

    return this.findOne(campaignId)
  }

  /** Admin produces a quote for the campaign. */
  async quote(campaignId: string, body: { lines: Array<{ id: string; unit_price: number; total_price: number }>; total_amount: number; admin_notes?: string }) {
    const c = await this.findOne(campaignId)
    for (const line of body.lines) {
      await this.orderRepo.update(line.id, {
        unit_price: line.unit_price,
        total_price: line.total_price,
        status: CampaignOrderStatus.QUOTED,
      })
    }
    await this.repo.update(campaignId, {
      status: CampaignStatus.QUOTED,
      total_amount: body.total_amount,
      admin_notes: body.admin_notes,
    })

    await this.notificationService.create({
      user_id: c.customer_id,
      type: 'order',
      title: '💼 Кампанит ажлын үнийн санал бэлэн',
      message: `${c.code} — нийт ₮${body.total_amount.toLocaleString()}`,
      data: { campaign_id: campaignId, code: c.code },
    }).catch(() => {})

    return this.findOne(campaignId)
  }

  /** Customer approves the quote → spawn real Order rows + kick off production. */
  async approve(campaignId: string, customerId: string) {
    const c = await this.findOne(campaignId)
    if (c.customer_id !== customerId) throw new BadRequestException('Эзэн биш')
    if (c.status !== CampaignStatus.QUOTED) throw new BadRequestException('Үнийн санал хүлээгдэж байна')

    // Spawn one real Order per CampaignOrder so the existing production
    // pipeline (vendor assignment, file flow, courier handoff) takes over.
    // Each Order links back via notes; we persist the spawned id on the
    // CampaignOrder so admin sees the production status.
    for (const line of c.orders || []) {
      if (line.spawned_order_id) continue // idempotent
      const orderEntity = this.orderEntityRepo.create({
        customer_id: c.customer_id,
        product_id: line.product_id,
        product_name: line.product_name,
        quantity: line.quantity || 0,
        unit_price: Number(line.unit_price) || 0,
        total_price: Number(line.total_price) || 0,
        payment_method: 'campaign',
        payment_status: 'pending',
        status: OrderStatus.CONFIRMED,
        sales_agent_id: c.sales_agent_id || undefined,
        notes: `Кампанит ажил ${c.code} — ${line.product_name}`,
        deadline: line.scheduled_delivery || c.deadline || undefined,
      } as any) as any as Order
      const saved: any = await this.orderEntityRepo.save(orderEntity)
      await this.orderRepo.update(line.id, {
        spawned_order_id: saved.id,
        status: CampaignOrderStatus.APPROVED,
      })
    }

    await this.repo.update(campaignId, { status: CampaignStatus.APPROVED })

    await this.notificationService.create({
      user_id: 'admin',
      type: 'order',
      title: '✅ Кампанит ажил батлагдлаа',
      message: `${c.code} — ${c.orders?.length || 0} захиалга үйлдвэрлэлд орлоо`,
      data: { campaign_id: campaignId },
    }).catch(() => {})

    return this.findOne(campaignId)
  }

  /** Admin marks campaign as in production. */
  async markInProduction(campaignId: string) {
    await this.repo.update(campaignId, { status: CampaignStatus.IN_PRODUCTION })
    return this.findOne(campaignId)
  }

  /**
   * Recompute campaign status from spawned-order statuses. Called by a
   * lightweight cron + by admin manual refresh; keeps the campaign row
   * in sync as individual orders advance through production / delivery.
   */
  async recomputeStatus(campaignId: string) {
    const c = await this.findOne(campaignId)
    if (![CampaignStatus.IN_PRODUCTION, CampaignStatus.PARTIALLY_DELIVERED, CampaignStatus.APPROVED].includes(c.status)) return c
    const lines = c.orders || []
    if (!lines.length) return c

    // Pull statuses of the spawned real orders.
    const orderIds = lines.map(l => l.spawned_order_id).filter(Boolean) as string[]
    if (!orderIds.length) return c
    const spawned = await this.orderEntityRepo.find({ where: orderIds.map(id => ({ id })) })
    const statuses = spawned.map(o => (o.status || '').toLowerCase())

    const allDone = statuses.length === lines.length && statuses.every(s => s === 'completed' || s === 'delivered')
    const someDelivered = statuses.some(s => s === 'delivered' || s === 'completed')
    const allDispatched = statuses.length === lines.length && statuses.every(s => ['dispatched', 'delivered', 'completed'].includes(s))

    let next = c.status
    if (allDone) next = CampaignStatus.COMPLETED
    else if (allDispatched || someDelivered) next = CampaignStatus.PARTIALLY_DELIVERED
    else next = CampaignStatus.IN_PRODUCTION

    if (next !== c.status) {
      await this.repo.update(campaignId, { status: next })
      this.logger.log(`Campaign ${c.code} → ${next}`)
    }
    return this.findOne(campaignId)
  }

  async findOne(id: string) {
    const c = await this.repo.findOne({
      where: { id },
      relations: ['orders', 'milestones'],
    })
    if (!c) throw new NotFoundException('Кампанит ажил олдсонгүй')
    return c
  }

  findByCustomer(customerId: string) {
    return this.repo.find({ where: { customer_id: customerId }, order: { created_at: 'DESC' } })
  }

  findAll(opts: { status?: string } = {}) {
    const qb = this.repo.createQueryBuilder('c').orderBy('c.created_at', 'DESC')
    if (opts.status) qb.where('c.status = :s', { s: opts.status })
    return qb.getMany()
  }

  /* ── Lines ────────────────────────────────────────────────────────── */
  async addLine(campaignId: string, body: Partial<CampaignOrder>) {
    return this.orderRepo.save(this.orderRepo.create({ ...body, campaign_id: campaignId }))
  }
  removeLine(lineId: string) { return this.orderRepo.delete(lineId) }
  listLines(campaignId: string) { return this.orderRepo.find({ where: { campaign_id: campaignId } }) }

  /* ── Milestones ───────────────────────────────────────────────────── */
  async addMilestone(campaignId: string, body: Partial<CampaignMilestone>) {
    return this.milestoneRepo.save(this.milestoneRepo.create({ ...body, campaign_id: campaignId }))
  }
  async completeMilestone(id: string) {
    await this.milestoneRepo.update(id, { status: MilestoneStatus.COMPLETED, completed_at: new Date() })
    return this.milestoneRepo.findOne({ where: { id } })
  }
  listMilestones(campaignId: string) { return this.milestoneRepo.find({ where: { campaign_id: campaignId }, order: { sort_order: 'ASC', due_date: 'ASC' } }) }

  /* ── Recipients ───────────────────────────────────────────────────── */
  countRecipients(campaignId: string) { return this.recipientRepo.count({ where: { campaign_id: campaignId } }) }
  listRecipients(campaignId: string, limit = 50, offset = 0) {
    return this.recipientRepo.find({
      where: { campaign_id: campaignId },
      order: { row_number: 'ASC' },
      take: limit, skip: offset,
    })
  }

  /**
   * Import a CSV of recipients into a campaign. Replaces the existing list
   * by default — caller can pass append=true to add to the end. Returns
   * count + warnings (e.g. empty-name rows skipped). Updates the
   * campaign's recipient_count to keep dashboard stats accurate.
   */
  async importRecipientCsv(campaignId: string, csv: string, append = false) {
    const { recipients, warnings, headerMap } = parseRecipientCsv(csv)
    if (!recipients.length) {
      throw new BadRequestException('CSV-аас бүртгэх боломжтой мөр олдсонгүй')
    }

    if (!append) {
      await this.recipientRepo.delete({ campaign_id: campaignId })
    }

    // Pick up where existing rows leave off so row_number stays unique
    // when appending.
    const existingMax = append
      ? await this.recipientRepo
        .createQueryBuilder('r').select('MAX(r.row_number)', 'max')
        .where('r.campaign_id = :id', { id: campaignId }).getRawOne()
        .then((x: any) => Number(x?.max) || 0)
      : 0

    const rows = recipients.map((r, i) => this.recipientRepo.create({
      campaign_id: campaignId,
      row_number: existingMax + i + 1,
      full_name: r.full_name,
      job_title: r.job_title,
      department: r.department,
      phone: r.phone,
      email: r.email,
      delivery_address: r.delivery_address,
      delivery_city: r.delivery_city,
      data: r.data,
      status: 'pending',
    }))

    // Bulk insert in chunks of 500 — keeps the WAL writes manageable on
    // 20k+ recipient lists.
    const CHUNK = 500
    for (let i = 0; i < rows.length; i += CHUNK) {
      await this.recipientRepo.save(rows.slice(i, i + CHUNK))
    }

    const total = await this.recipientRepo.count({ where: { campaign_id: campaignId } })
    await this.repo.update(campaignId, { recipient_count: total })

    this.logger.log(`Campaign ${campaignId}: imported ${rows.length} recipients (total ${total}, ${warnings.length} warnings)`)
    return { added: rows.length, total, warnings, headerMap }
  }

  /**
   * Group recipients by delivery_city + delivery_address so the admin can
   * dispatch courier batches per location. For a 20,000-recipient campaign
   * spread across 5 cities this collapses 20k rows down to ~5 deliverable
   * batches with a count + recipient_id list each.
   */
  async getDeliveryBatches(campaignId: string) {
    const rows = await this.recipientRepo.find({
      where: { campaign_id: campaignId },
      select: ['id', 'full_name', 'phone', 'delivery_address', 'delivery_city'],
    })
    const groups = new Map<string, { city: string; address: string; count: number; recipients: { id: string; name?: string; phone?: string }[] }>()
    for (const r of rows) {
      const city = (r.delivery_city || 'Тодорхойгүй').trim()
      const addr = (r.delivery_address || 'Тодорхойгүй').trim()
      const key = `${city}::${addr}`
      const g = groups.get(key) || { city, address: addr, count: 0, recipients: [] }
      g.count++
      // Cap stored recipients per group to keep response small; full list
      // available via /recipients with filter.
      if (g.recipients.length < 50) g.recipients.push({ id: r.id, name: r.full_name, phone: r.phone })
      groups.set(key, g)
    }
    return Array.from(groups.values()).sort((a, b) => b.count - a.count)
  }

  /* ── Aggregate stats for admin dashboard ──────────────────────────── */
  async getSummary() {
    const all = await this.repo.find()
    const byStatus: Record<string, number> = {}
    let totalValue = 0
    for (const c of all) {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1
      totalValue += Number(c.total_amount) || 0
    }
    return {
      total: all.length,
      byStatus,
      totalValue,
      active: all.filter(c => [CampaignStatus.APPROVED, CampaignStatus.IN_PRODUCTION, CampaignStatus.PARTIALLY_DELIVERED].includes(c.status)).length,
    }
  }
}
