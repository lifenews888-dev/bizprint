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

  async seed() {
    const count = await this.repo.count()
    if (count > 0) return { seeded: 0, message: 'Already has templates' }

    const templates = [
      {
        title: 'Corporate Business Card', title_mn: 'Корпорэйт нэрийн хуудас',
        category: 'business-card', status: 'approved', designer_id: 'system', designer_name: 'BizPrint',
        thumbnail_url: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400',
        price: 0, sort_order: 1, width_mm: 90, height_mm: 54,
        canvas_data: {
          bg: '#1a1a2e', width: 360, height: 216,
          elements: [
            { id: '1', type: 'text', content: 'ТАНЫ НЭР', x: 24, y: 40, fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
            { id: '2', type: 'text', content: 'Гүйцэтгэх захирал', x: 24, y: 72, fontSize: 13, fontWeight: '400', color: '#94a3b8' },
            { id: '3', type: 'text', content: '+976 9900 0000', x: 24, y: 130, fontSize: 12, fontWeight: '400', color: '#FF6B00' },
            { id: '4', type: 'text', content: 'info@company.mn', x: 24, y: 152, fontSize: 11, fontWeight: '400', color: '#94a3b8' },
          ]
        }
      },
      {
        title: 'Minimal Business Card', title_mn: 'Минималист нэрийн хуудас',
        category: 'business-card', status: 'approved', designer_id: 'system', designer_name: 'BizPrint',
        thumbnail_url: 'https://images.unsplash.com/photo-1572502742851-66b8cc7ceeb4?w=400',
        price: 0, sort_order: 2, width_mm: 90, height_mm: 54,
        canvas_data: {
          bg: '#FFFFFF', width: 360, height: 216,
          elements: [
            { id: '1', type: 'text', content: 'ТАНЫ НЭР', x: 24, y: 50, fontSize: 24, fontWeight: '300', color: '#1a1a1a' },
            { id: '2', type: 'text', content: 'Албан тушаал', x: 24, y: 82, fontSize: 12, fontWeight: '400', color: '#888888' },
            { id: '3', type: 'text', content: '+976 9900 0000', x: 24, y: 138, fontSize: 11, fontWeight: '400', color: '#333333' },
            { id: '4', type: 'text', content: 'name@company.mn', x: 24, y: 158, fontSize: 11, fontWeight: '400', color: '#333333' },
          ]
        }
      },
      {
        title: 'Bold Business Card', title_mn: 'Тод нэрийн хуудас',
        category: 'business-card', status: 'approved', designer_id: 'system', designer_name: 'BizPrint',
        thumbnail_url: 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?w=400',
        price: 0, sort_order: 3, width_mm: 90, height_mm: 54,
        canvas_data: {
          bg: '#FF6B00', width: 360, height: 216,
          elements: [
            { id: '1', type: 'text', content: 'ТАНЫ НЭР', x: 24, y: 50, fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
            { id: '2', type: 'text', content: 'БИЗНЕС БАЙР', x: 24, y: 86, fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
            { id: '3', type: 'text', content: '+976 9900 0000', x: 24, y: 148, fontSize: 13, fontWeight: '500', color: '#FFFFFF' },
            { id: '4', type: 'text', content: 'www.company.mn', x: 24, y: 170, fontSize: 11, fontWeight: '400', color: 'rgba(255,255,255,0.8)' },
          ]
        }
      },
      {
        title: 'Event Flyer', title_mn: 'Арга хэмжээний флаер',
        category: 'flyer', status: 'approved', designer_id: 'system', designer_name: 'BizPrint',
        thumbnail_url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400',
        price: 0, sort_order: 4, width_mm: 148, height_mm: 210,
        canvas_data: {
          bg: '#0f0f1a', width: 420, height: 594,
          elements: [
            { id: '1', type: 'text', content: 'АРГА ХЭМЖЭЭНИЙ', x: 40, y: 80, fontSize: 14, fontWeight: '400', color: '#FF6B00' },
            { id: '2', type: 'text', content: 'ГАРЧИГ', x: 40, y: 110, fontSize: 48, fontWeight: '800', color: '#FFFFFF' },
            { id: '3', type: 'text', content: '2025 оны 6-р сарын 15', x: 40, y: 200, fontSize: 16, fontWeight: '400', color: '#94a3b8' },
          ]
        }
      },
      {
        title: 'Sale Flyer', title_mn: 'Хямдралын флаер',
        category: 'flyer', status: 'approved', designer_id: 'system', designer_name: 'BizPrint',
        thumbnail_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
        price: 0, sort_order: 5, width_mm: 148, height_mm: 210,
        canvas_data: {
          bg: '#FF6B00', width: 420, height: 594,
          elements: [
            { id: '1', type: 'text', content: 'ХЯМДРАЛ', x: 40, y: 80, fontSize: 64, fontWeight: '900', color: '#FFFFFF' },
            { id: '2', type: 'text', content: '-50%', x: 40, y: 180, fontSize: 80, fontWeight: '900', color: '#1a1a1a' },
            { id: '3', type: 'text', content: 'Компанийн нэр', x: 40, y: 320, fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
          ]
        }
      },
      {
        title: 'Rollup Banner', title_mn: 'Роллап баннер',
        category: 'banner', status: 'approved', designer_id: 'system', designer_name: 'BizPrint',
        thumbnail_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        price: 0, sort_order: 6, width_mm: 850, height_mm: 2000,
        canvas_data: {
          bg: '#1e3a5f', width: 340, height: 800,
          elements: [
            { id: '1', type: 'text', content: 'КОМПАНИЙН', x: 40, y: 100, fontSize: 20, fontWeight: '400', color: 'rgba(255,255,255,0.8)' },
            { id: '2', type: 'text', content: 'НЭР', x: 40, y: 132, fontSize: 48, fontWeight: '800', color: '#FFFFFF' },
            { id: '3', type: 'text', content: '+976 7711-7700', x: 40, y: 700, fontSize: 18, fontWeight: '600', color: '#FF6B00' },
          ]
        }
      },
      {
        title: 'Round Sticker', title_mn: 'Дугуй стикер',
        category: 'sticker', status: 'approved', designer_id: 'system', designer_name: 'BizPrint',
        thumbnail_url: 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=400',
        price: 0, sort_order: 7, width_mm: 100, height_mm: 100,
        canvas_data: {
          bg: '#FF6B00', width: 200, height: 200,
          elements: [
            { id: '1', type: 'text', content: 'БРЭНД', x: 60, y: 80, fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
            { id: '2', type: 'text', content: 'компани', x: 65, y: 116, fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.9)' },
          ]
        }
      },
      {
        title: 'Product Poster', title_mn: 'Бүтээгдэхүүний постер',
        category: 'poster', status: 'approved', designer_id: 'system', designer_name: 'BizPrint',
        thumbnail_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
        price: 0, sort_order: 8, width_mm: 297, height_mm: 420,
        canvas_data: {
          bg: '#f8fafc', width: 420, height: 594,
          elements: [
            { id: '1', type: 'text', content: 'БҮТЭЭГДЭХҮҮНИЙ', x: 40, y: 60, fontSize: 14, fontWeight: '400', color: '#64748b' },
            { id: '2', type: 'text', content: 'НЭР', x: 40, y: 88, fontSize: 48, fontWeight: '800', color: '#1e293b' },
            { id: '3', type: 'text', content: '99,000₮', x: 40, y: 300, fontSize: 36, fontWeight: '700', color: '#FF6B00' },
          ]
        }
      },
    ]

    let seeded = 0
    for (const t of templates) {
      try { await this.repo.save(this.repo.create(t as any)); seeded++ } catch {}
    }
    return { seeded }
  }
}
