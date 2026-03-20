import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import { CustomerProfile } from './entities/customer-profile.entity'
import { CustomerInteraction, InteractionType } from './entities/customer-interaction.entity'
import { SupportTicket, TicketStatus } from './entities/support-ticket.entity'

@Injectable()
export class CustomerCareService {
  constructor(
    @InjectRepository(CustomerProfile) private profileRepo: Repository<CustomerProfile>,
    @InjectRepository(CustomerInteraction) private interactionRepo: Repository<CustomerInteraction>,
    @InjectRepository(SupportTicket) private ticketRepo: Repository<SupportTicket>,
  ) {}

  // Customer Profile
  async upsertFromQuote(data: { user_id?: string; email?: string; name: string; phone?: string; company_name?: string }) {
    let profile: CustomerProfile | null = null
    if (data.user_id) {
      profile = await this.profileRepo.findOne({ where: { user_id: data.user_id } })
    }
    if (!profile && data.email) {
      profile = await this.profileRepo.findOne({ where: { guest_email: data.email } })
    }
    if (profile) {
      profile.last_contact_at = new Date()
      profile.total_orders = (profile.total_orders || 0) + 1
      if (data.name) profile.name = data.name
      if (data.phone) profile.phone = data.phone
      if (data.company_name) profile.company_name = data.company_name
      await this.profileRepo.save(profile)

      // Auto VIP after 3 quotes
      if (profile.total_orders >= 3 && profile.pricing_tier === 'RETAIL') {
        profile.pricing_tier = 'VIP'
        if (!profile.tags) profile.tags = []
        if (!profile.tags.includes('VIP')) profile.tags.push('VIP')
        await this.profileRepo.save(profile)
      }
    } else {
      profile = await this.profileRepo.save(this.profileRepo.create({
        user_id: data.user_id || null,
        guest_email: data.email || null,
        name: data.name,
        phone: data.phone || null,
        company_name: data.company_name || null,
        last_contact_at: new Date(),
        total_orders: 1,
      }))
    }
    return profile
  }

  async addInteraction(customerId: string, type: InteractionType, title: string, content?: string, createdBy?: string, metadata?: any) {
    return this.interactionRepo.save(this.interactionRepo.create({
      customer_id: customerId,
      type,
      title,
      content: content || '',
      created_by: createdBy || 'system',
      metadata,
    }))
  }

  async findAllCustomers(query?: { search?: string; tier?: string; tag?: string; page?: number; limit?: number }) {
    const qb = this.profileRepo.createQueryBuilder('c')
    if (query?.search) {
      qb.andWhere('(c.name ILIKE :s OR c.guest_email ILIKE :s OR c.company_name ILIKE :s)', { s: `%${query.search}%` })
    }
    if (query?.tier) qb.andWhere('c.pricing_tier = :tier', { tier: query.tier })
    const page = query?.page || 1
    const limit = query?.limit || 50
    qb.orderBy('c.last_contact_at', 'DESC', 'NULLS LAST')
    qb.skip((page - 1) * limit).take(limit)
    const [items, total] = await qb.getManyAndCount()
    return { items, total, page, limit }
  }

  async findOneCustomer(id: string) {
    const c = await this.profileRepo.findOne({ where: { id } })
    if (!c) throw new NotFoundException('Хэрэглэгч олдсонгүй')
    return c
  }

  async updateCustomer(id: string, data: Partial<CustomerProfile>) {
    await this.profileRepo.update(id, data)
    return this.findOneCustomer(id)
  }

  async getInteractions(customerId: string) {
    return this.interactionRepo.find({
      where: { customer_id: customerId },
      order: { created_at: 'DESC' },
    })
  }

  // Support Tickets
  async generateTicketNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const count = await this.ticketRepo.count()
    return `TK-${date}-${String(count + 1).padStart(3, '0')}`
  }

  async createTicket(data: { customer_id: string; subject: string; message: string; quote_id?: string; order_id?: string; priority?: string }) {
    const ticketNumber = await this.generateTicketNumber()
    const ticket = this.ticketRepo.create({
      ticket_number: ticketNumber,
      customer_id: data.customer_id,
      subject: data.subject,
      quote_id: data.quote_id || null,
      order_id: data.order_id || null,
      priority: (data.priority as any) || 'NORMAL',
      messages: [{ sender: 'customer', content: data.message, created_at: new Date().toISOString() }],
    })
    return this.ticketRepo.save(ticket)
  }

  async findAllTickets(query?: { status?: string; page?: number; limit?: number }) {
    const where: any = {}
    if (query?.status) where.status = query.status
    const page = query?.page || 1
    const limit = query?.limit || 50
    const [items, total] = await this.ticketRepo.findAndCount({
      where,
      relations: ['customer'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    })
    return { items, total, page, limit }
  }

  async findOneTicket(id: string) {
    const t = await this.ticketRepo.findOne({ where: { id }, relations: ['customer'] })
    if (!t) throw new NotFoundException('Тикет олдсонгүй')
    return t
  }

  async updateTicket(id: string, data: Partial<SupportTicket>) {
    if (data.status === TicketStatus.RESOLVED) {
      (data as any).resolved_at = new Date()
    }
    await this.ticketRepo.update(id, data)
    return this.findOneTicket(id)
  }

  async replyToTicket(id: string, message: string, sender: string) {
    const ticket = await this.findOneTicket(id)
    const messages = ticket.messages || []
    messages.push({ sender, content: message, created_at: new Date().toISOString() })
    await this.ticketRepo.update(id, { messages })
    return this.findOneTicket(id)
  }

  async getCustomerTickets(customerId: string) {
    return this.ticketRepo.find({
      where: { customer_id: customerId },
      order: { created_at: 'DESC' },
    })
  }

  // Customer-facing
  async getMyProfile(userId: string) {
    return this.profileRepo.findOne({ where: { user_id: userId } })
  }

  async createCustomerTicket(userId: string, data: { subject: string; message: string; quote_id?: string }) {
    let profile = await this.profileRepo.findOne({ where: { user_id: userId } })
    if (!profile) {
      profile = await this.profileRepo.save(this.profileRepo.create({ user_id: userId, name: 'Customer' }))
    }
    return this.createTicket({ customer_id: profile.id, ...data })
  }

  async getMyTickets(userId: string) {
    const profile = await this.profileRepo.findOne({ where: { user_id: userId } })
    if (!profile) return []
    return this.ticketRepo.find({
      where: { customer_id: profile.id },
      order: { created_at: 'DESC' },
    })
  }
}
