import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { SalesProduct } from './sales-product.entity'
import { Product } from '../products/product.entity'
import { User } from '../users/user.entity'
import { Referral } from '../referral/referral.entity'
import { Order } from '../orders/entities/order.entity'
import { Quotation } from '../quote/entities/quotation.entity'
import { SalesCommission } from '../commission/sales-commission.entity'

@Injectable()
export class SalesProductsService {
  constructor(
    @InjectRepository(SalesProduct) private repo: Repository<SalesProduct>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Referral) private referralRepo: Repository<Referral>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Quotation) private quoteRepo: Repository<Quotation>,
    @InjectRepository(SalesCommission) private commissionRepo: Repository<SalesCommission>,
  ) {}

  /**
   * Adopt a product into the agent's storefront. Idempotent — re-adopting
   * an already-active listing is a no-op; re-adopting a soft-disabled one
   * reactivates it.
   */
  async adopt(salesUserId: string, productId: string, opts?: { rate?: number; note?: string }) {
    const product = await this.productRepo.findOne({ where: { id: productId } })
    if (!product) throw new NotFoundException('Бүтээгдэхүүн олдсонгүй')
    if (!product.is_active) throw new BadRequestException('Идэвхгүй бүтээгдэхүүнийг борлуулах боломжгүй')

    const existing = await this.repo.findOne({ where: { sales_user_id: salesUserId, product_id: productId } })
    if (existing) {
      existing.is_active = true
      if (opts?.rate != null) existing.commission_rate_override = opts.rate
      if (opts?.note != null) existing.agent_note = opts.note
      return this.repo.save(existing)
    }
    return this.repo.save(this.repo.create({
      sales_user_id: salesUserId,
      product_id: productId,
      commission_rate_override: opts?.rate ?? null as any,
      agent_note: opts?.note ?? null as any,
    }))
  }

  /** Remove a product from the agent's storefront (soft). */
  async unadopt(salesUserId: string, productId: string) {
    const row = await this.repo.findOne({ where: { sales_user_id: salesUserId, product_id: productId } })
    if (!row) return { ok: true, alreadyRemoved: true }
    row.is_active = false
    await this.repo.save(row)
    return { ok: true }
  }

  /** Agent's own storefront catalog — joined to product rows. */
  async myStorefront(salesUserId: string) {
    const rows = await this.repo.find({
      where: { sales_user_id: salesUserId, is_active: true },
      order: { sort_order: 'ASC', created_at: 'DESC' },
    })
    if (!rows.length) return []
    const products = await this.productRepo.find({ where: { id: In(rows.map(r => r.product_id)) } })
    const byId = new Map(products.map(p => [p.id, p]))
    return rows
      .map(r => ({ ...byId.get(r.product_id), sales_listing: r }))
      .filter(r => r.id) // drop dead refs
  }

  /** Public storefront for an agent identified by referral code. */
  async storefrontByCode(code: string) {
    const ref = await this.referralRepo.findOne({ where: { code: code.toUpperCase(), is_active: true } })
    if (!ref) throw new NotFoundException('Sales agent олдсонгүй')
    const agent = await this.userRepo.findOne({ where: { id: ref.sales_user_id } })
    const products = await this.myStorefront(ref.sales_user_id)
    return {
      agent: agent ? {
        id: agent.id,
        full_name: agent.full_name,
        company_name: agent.company_name,
        avatar_url: agent.avatar_url,
        professional_bio: agent.professional_bio,
      } : null,
      referral_code: ref.code,
      products,
    }
  }

  /** Quick check whether the current agent has adopted a given product. */
  async hasAdopted(salesUserId: string, productId: string) {
    const row = await this.repo.findOne({ where: { sales_user_id: salesUserId, product_id: productId, is_active: true } })
    return { adopted: !!row, listing: row || null }
  }

  /**
   * Customers referred by this agent, with lifetime aggregates.
   * Attribution path: user.referred_by_sales_id = agent.id.
   */
  async myCustomers(salesUserId: string) {
    const users = await this.userRepo.find({
      where: { referred_by_sales_id: salesUserId },
      order: { created_at: 'DESC' },
    })
    if (!users.length) return []

    const userIds = users.map(u => u.id)
    const orders = await this.orderRepo.find({
      where: { customer_id: In(userIds) },
      select: ['id', 'customer_id', 'total_price', 'status', 'created_at'],
    })

    const byCustomer = new Map<string, { count: number; lifetime: number; lastOrderAt?: Date }>()
    for (const o of orders) {
      const agg = byCustomer.get(o.customer_id) || { count: 0, lifetime: 0 }
      agg.count += 1
      agg.lifetime += Number(o.total_price || 0)
      if (!agg.lastOrderAt || o.created_at > agg.lastOrderAt) agg.lastOrderAt = o.created_at
      byCustomer.set(o.customer_id, agg)
    }

    return users.map(u => {
      const agg = byCustomer.get(u.id) || { count: 0, lifetime: 0, lastOrderAt: null as any }
      return {
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        company_name: u.company_name,
        avatar_url: u.avatar_url,
        created_at: u.created_at,
        referral_code_used: u.referral_code_used,
        order_count: agg.count,
        lifetime_value: agg.lifetime,
        last_order_at: agg.lastOrderAt,
      }
    })
  }

  /**
   * Quotes generated by customers this agent referred. Backend has no
   * `sales_agent_id` on Quotation, so we join through User.referred_by_sales_id.
   */
  async myQuotes(salesUserId: string) {
    const users = await this.userRepo.find({
      where: { referred_by_sales_id: salesUserId },
      select: ['id', 'full_name', 'email'],
    })
    if (!users.length) return []

    const userById = new Map(users.map(u => [u.id, u]))
    const quotes = await this.quoteRepo.find({
      where: { user_id: In(users.map(u => u.id)) },
      order: { created_at: 'DESC' },
      take: 200,
    })

    return quotes.map(q => ({
      id: q.id,
      quote_number: q.quote_number,
      customer_id: q.user_id,
      customer_name: q.customer_name || userById.get(q.user_id)?.full_name || null,
      customer_email: q.customer_email || userById.get(q.user_id)?.email || null,
      product_name: q.product_name,
      product_type: q.product_type,
      quantity: q.quantity,
      total_price: q.total_price,
      status: q.status,
      created_at: q.created_at,
      valid_until: q.valid_until,
    }))
  }

  /**
   * Orders attributed to this agent via Order.sales_agent_id, enriched with
   * the sales commission row (if any) so the dashboard can show the payout
   * status per order in one request.
   */
  async myOrders(salesUserId: string) {
    const orders = await this.orderRepo.find({
      where: { sales_agent_id: salesUserId },
      order: { created_at: 'DESC' },
      take: 200,
    })
    if (!orders.length) return []

    const commissions = await this.commissionRepo.find({
      where: { order_id: In(orders.map(o => o.id)), sales_user_id: salesUserId },
    })
    const byOrderId = new Map(commissions.map(c => [c.order_id, c]))

    return orders.map(o => {
      const c = byOrderId.get(o.id)
      return {
        id: o.id,
        customer_id: o.customer_id,
        customer_name: o.customer_name,
        customer_email: o.customer_email,
        product_name: o.product_name,
        quantity: o.quantity,
        total_price: o.total_price,
        status: o.status,
        payment_status: o.payment_status,
        created_at: o.created_at,
        delivered_at: o.delivered_at,
        commission: c ? {
          id: c.id,
          amount: c.commission_amount,
          rate: c.commission_rate,
          status: c.status,
          paid_at: c.paid_at,
        } : null,
      }
    })
  }
}
