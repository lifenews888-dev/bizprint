import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './template.entity';
import { TemplatePurchase } from './template-purchase.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private repo: Repository<Template>,
    @InjectRepository(TemplatePurchase)
    private purchaseRepo: Repository<TemplatePurchase>,
  ) {}

  async findAll(query: any = {}) {
    const where: any = {}
    if (query.category) where.category = query.category
    if (query.status) where.status = query.status
    else where.status = 'approved'
    if (query.designer_id) where.designer_id = query.designer_id
    const templates = await this.repo.find({ where, order: { sort_order: 'ASC', created_at: 'DESC' } })
    // Strip file_url from list results — protected behind /download
    return templates.map(({ file_url, ...rest }) => rest)
  }

  async findOne(id: string) {
    const template = await this.repo.findOne({ where: { id } })
    if (!template) return null
    // Strip file_url — protected behind /download endpoint
    const { file_url, ...rest } = template
    return rest
  }

  create(data: any) {
    // Map name -> title if frontend sends name
    const mapped: any = { ...data }
    // Allow admin to set status directly, default to 'pending' for designers
    if (!mapped.status) mapped.status = 'pending'
    if (data.name && !data.title) {
      mapped.title = data.name
      delete mapped.name
    }
    return this.repo.save(this.repo.create(mapped))
  }

  async update(id: string, data: Partial<Template>) {
    await this.repo.update(id, data)
    return this.repo.findOne({ where: { id } })
  }

  async approve(id: string) {
    await this.repo.update(id, { status: 'approved' })
    return this.repo.findOne({ where: { id } })
  }

  async reject(id: string) {
    await this.repo.update(id, { status: 'rejected' })
    return this.repo.findOne({ where: { id } })
  }

  async incrementUse(id: string) {
    await this.repo.increment({ id }, 'use_count', 1)
  }

  remove(id: string) {
    return this.repo.delete(id)
  }

  findPending() {
    return this.repo.find({ where: { status: 'pending' }, order: { created_at: 'ASC' } })
  }

  findByDesigner(designer_id: string) {
    return this.repo.find({ where: { designer_id }, order: { created_at: 'DESC' } })
  }

  // ── Purchase & download access control ──

  async purchaseTemplate(templateId: string, userId: string) {
    const existing = await this.purchaseRepo.findOne({
      where: { template_id: templateId, user_id: userId },
    })
    if (existing) {
      return { ok: true, alreadyOwned: true }
    }
    const template = await this.repo.findOne({ where: { id: templateId } })
    const purchase = this.purchaseRepo.create({
      template_id: templateId,
      user_id: userId,
      amount_paid: template ? Number(template.price) : 0,
    })
    await this.purchaseRepo.save(purchase)
    if (template) {
      await this.repo.increment({ id: templateId }, 'download_count', 1)
    }
    return { ok: true }
  }

  async downloadTemplate(templateId: string, userId: string) {
    const purchase = await this.purchaseRepo.findOne({
      where: { template_id: templateId, user_id: userId },
    })
    if (!purchase) {
      throw new ForbiddenException('Та энэ загварыг худалдан аваагүй байна')
    }
    await this.purchaseRepo.increment({ id: purchase.id }, 'download_count', 1)
    const template = await this.repo.findOne({ where: { id: templateId } })
    return { file_url: template?.file_url || null }
  }

  async getUserPurchases(userId: string) {
    const purchases = await this.purchaseRepo.find({ where: { user_id: userId } })
    return purchases.map(p => p.template_id)
  }

  async checkOwnership(templateId: string, userId: string) {
    const purchase = await this.purchaseRepo.findOne({
      where: { template_id: templateId, user_id: userId },
    })
    return { owned: !!purchase }
  }
}
