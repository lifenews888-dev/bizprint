import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { SalesProduct } from './sales-product.entity'
import { Product } from '../products/product.entity'
import { User } from '../users/user.entity'
import { Referral } from '../referral/referral.entity'

@Injectable()
export class SalesProductsService {
  constructor(
    @InjectRepository(SalesProduct) private repo: Repository<SalesProduct>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Referral) private referralRepo: Repository<Referral>,
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
}
