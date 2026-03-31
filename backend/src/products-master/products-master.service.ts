import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository, Like } from 'typeorm'
import { ProductMaster } from './entities/product-master.entity'
import { ProductMaterial } from './entities/product-material.entity'
import { ProductSizeOption } from './entities/product-size-option.entity'
import { ProductFinishing } from './entities/product-finishing.entity'
import { ProductAddon } from './entities/product-addon.entity'

@Injectable()
export class ProductsMasterService {
  constructor(
    @InjectRepository(ProductMaster) private masterRepo: Repository<ProductMaster>,
    @InjectRepository(ProductMaterial) private materialRepo: Repository<ProductMaterial>,
    @InjectRepository(ProductSizeOption) private sizeRepo: Repository<ProductSizeOption>,
    @InjectRepository(ProductFinishing) private finishingRepo: Repository<ProductFinishing>,
    @InjectRepository(ProductAddon) private addonRepo: Repository<ProductAddon>,
    private dataSource: DataSource,
  ) {}

  async create(data: Partial<ProductMaster>) {
    if (!data.code) {
      const prefix = (data.name_mn || 'PRD').slice(0, 4).toUpperCase().replace(/\s/g, '')
      data.code = `${prefix}-${Date.now()}`
    }
    const item = this.masterRepo.create(data)
    const saved = await this.masterRepo.save(item)

    // Auto-sync to products table so it appears on homepage/shop
    try {
      const isSignage = data.category === 'HADAG_REKLAM'
      const slug = `${(data.name_mn || data.name_en || 'product').toLowerCase().replace(/[^a-zа-яөүё0-9]+/gi, '-')}-${Date.now()}`
      await this.dataSource.query(`
        INSERT INTO products (id, name, name_mn, slug, category, description, product_type, product_master_id,
          pricing_mode, order_flow, requires_file_upload, requires_dimensions, requires_quote_approval,
          thumbnail_url, images, is_active, base_price)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, 0)
      `, [
        data.name_en || data.name_mn, data.name_mn, slug,
        isSignage ? 'signage' : (data.category || '').toLowerCase().replace(/_/g, '-'),
        data.description || '',
        isSignage ? 'signage' : 'print',
        saved.id,
        isSignage ? 'formula' : 'tier',
        isSignage ? 'site_survey' : 'file_upload',
        !isSignage, // requires_file_upload for print
        isSignage,  // requires_dimensions for signage
        isSignage,  // requires_quote_approval for signage
        data.thumbnail_url || null,
        JSON.stringify(data.images || []),
      ])
    } catch (e) { console.log('Product sync warning:', (e as any).message) }

    return saved
  }

  async findAll(query?: { search?: string; category?: string; page?: number; limit?: number }) {
    const where: any = { is_active: true }
    if (query?.category) where.category = query.category
    if (query?.search) where.name_mn = Like(`%${query.search}%`)
    const page = query?.page || 1
    const limit = query?.limit || 50
    const [items, total] = await this.masterRepo.findAndCount({
      where,
      relations: ['materials', 'sizes'],
      order: { sort_order: 'ASC', created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    })
    return { items, total, page, limit }
  }

  async findOne(id: string) {
    const item = await this.masterRepo.findOne({ where: { id }, relations: ['materials', 'sizes'] })
    if (!item) throw new NotFoundException('Бүтээгдэхүүн олдсонгүй')
    return item
  }

  async update(id: string, data: Partial<ProductMaster>) {
    await this.masterRepo.update(id, data)
    return this.findOne(id)
  }

  async deactivate(id: string) {
    await this.masterRepo.update(id, { is_active: false })
    return { success: true }
  }

  async addMaterial(productId: string, data: Partial<ProductMaterial>) {
    const item = this.materialRepo.create({ ...data, product_id: productId })
    return this.materialRepo.save(item)
  }

  async updateMaterial(id: string, data: Partial<ProductMaterial>) {
    await this.materialRepo.update(id, data)
    return this.materialRepo.findOne({ where: { id } })
  }

  async addSize(productId: string, data: Partial<ProductSizeOption>) {
    const item = this.sizeRepo.create({ ...data, product_id: productId })
    return this.sizeRepo.save(item)
  }

  async updateSize(id: string, data: Partial<ProductSizeOption>) {
    await this.sizeRepo.update(id, data)
    return this.sizeRepo.findOne({ where: { id } })
  }

  // Finishing CRUD
  async findAllFinishings() {
    return this.finishingRepo.find({ where: { is_active: true }, order: { code: 'ASC' } })
  }

  async createFinishing(data: Partial<ProductFinishing>) {
    return this.finishingRepo.save(this.finishingRepo.create(data))
  }

  async updateFinishing(id: string, data: Partial<ProductFinishing>) {
    await this.finishingRepo.update(id, data)
    return this.finishingRepo.findOne({ where: { id } })
  }

  // Addon CRUD
  async findAllAddons() {
    return this.addonRepo.find({ where: { is_active: true }, order: { code: 'ASC' } })
  }

  async createAddon(data: Partial<ProductAddon>) {
    return this.addonRepo.save(this.addonRepo.create(data))
  }

  async updateAddon(id: string, data: Partial<ProductAddon>) {
    await this.addonRepo.update(id, data)
    return this.addonRepo.findOne({ where: { id } })
  }

  // Public catalog
  async getCatalog() {
    return this.masterRepo.find({
      where: { is_active: true },
      relations: ['materials', 'sizes'],
      order: { sort_order: 'ASC' },
      select: { id: true, code: true, name_mn: true, name_en: true, category: true, subcategory: true, description: true, unit_type: true, thumbnail_url: true, sort_order: true },
    })
  }

  async getCatalogByCode(code: string) {
    const item = await this.masterRepo.findOne({
      where: { code, is_active: true },
      relations: ['materials', 'sizes'],
    })
    if (!item) throw new NotFoundException('Бүтээгдэхүүн олдсонгүй')
    const finishings = await this.finishingRepo.find({ where: { is_active: true } })
    const addons = await this.addonRepo.find({ where: { is_active: true } })
    return { ...item, finishings, addons }
  }

  // Seed data
  async seed() {
    const count = await this.masterRepo.count()
    if (count > 0) return { message: 'Already seeded' }

    // Seed finishings
    const finishings = [
      { code: 'MAT_LAM', name_mn: 'Мат ламинаци', price_per_m2: 1500, price_per_piece: 15, applicable_categories: ['KHEVLEL', 'PROMO'] },
      { code: 'GLOSS_LAM', name_mn: 'Гялгар ламинаци', price_per_m2: 1200, price_per_piece: 12, applicable_categories: ['KHEVLEL', 'PROMO'] },
      { code: 'UV', name_mn: 'UV лак', price_per_m2: 2000, price_per_piece: 20, applicable_categories: ['KHEVLEL'] },
      { code: 'SOFT_TOUCH', name_mn: 'Soft touch', price_per_m2: 2500, price_per_piece: 25, applicable_categories: ['KHEVLEL'] },
      { code: 'FOIL', name_mn: 'Фойл тамга', price_per_m2: 5000, price_per_piece: 50, applicable_categories: ['KHEVLEL', 'AWARD'] },
    ]
    for (const f of finishings) await this.finishingRepo.save(this.finishingRepo.create(f))

    // Seed addons
    const addons = [
      { code: 'CRANE_1H', name_mn: 'Кран 1 цаг', price: 200000, price_type: 'HOURLY' as any, description: 'Кран түрээс 1 цаг' },
      { code: 'CRANE_8H', name_mn: 'Кран 8 цаг', price: 600000, price_type: 'FIXED' as any, description: 'Кран бүтэн өдөр' },
      { code: 'RELE', name_mn: 'Реле', price: 25000, price_type: 'FIXED' as any, description: 'Реле суурилуулалт' },
      { code: 'TOG_BUURUULAGCH', name_mn: 'Тог бууруулагч', price: 45000, price_type: 'FIXED' as any, description: 'Тог бууруулагч' },
      { code: 'DESIGN', name_mn: 'Дизайн ажил', price: 50000, price_type: 'FIXED' as any, description: 'Дизайн зохион бүтээх' },
      { code: 'DELIVERY', name_mn: 'Хүргэлт', price: 15000, price_type: 'FIXED' as any, description: 'Хүргэлтийн зардал' },
      { code: 'INSTALL', name_mn: 'Суурилуулалт', price: 80000, price_type: 'PER_M2' as any, description: 'Суурилуулах ажил' },
    ]
    for (const a of addons) await this.addonRepo.save(this.addonRepo.create(a))

    // Seed products with materials and sizes
    const products = [
      {
        code: 'TOVGOR', name_mn: 'Товгор үсэг', name_en: 'Channel Letters', category: 'HADAG_REKLAM', subcategory: 'tovgor_usen', unit_type: 'PIECE', sort_order: 1,
        materials: [
          { material_code: 'PVC_3MM', material_name_mn: 'PVC 3мм', unit: 'ш', base_cost: 15000, display_name: 'PVC 3мм', is_default: true },
          { material_code: 'PVC_5MM', material_name_mn: 'PVC 5мм', unit: 'ш', base_cost: 20000, display_name: 'PVC 5мм' },
          { material_code: 'ACRYLIC', material_name_mn: 'Акрил', unit: 'ш', base_cost: 35000, display_name: 'Акрил' },
        ],
        sizes: [
          { size_code: '20CM', size_label: '20 см', width_mm: 200, height_mm: 200, base_price: 35000 },
          { size_code: '30CM', size_label: '30 см', width_mm: 300, height_mm: 300, base_price: 45000 },
          { size_code: '40CM', size_label: '40 см', width_mm: 400, height_mm: 400, base_price: 60000 },
          { size_code: '50CM', size_label: '50 см', width_mm: 500, height_mm: 500, base_price: 75000 },
          { size_code: '60CM', size_label: '60 см', width_mm: 600, height_mm: 600, base_price: 95000 },
          { size_code: '80CM', size_label: '80 см', width_mm: 800, height_mm: 800, base_price: 180000 },
          { size_code: '100CM', size_label: '100 см', width_mm: 1000, height_mm: 1000, base_price: 290000 },
          { size_code: 'CUSTOM', size_label: 'Тусгай хэмжээ', is_custom: true, base_price: 280000 },
        ],
      },
      {
        code: 'NERJ_USEG', name_mn: 'Нерж үсэг', name_en: 'Stainless Steel Letters', category: 'HADAG_REKLAM', subcategory: 'nerj_usen', unit_type: 'M2', sort_order: 2,
        materials: [
          { material_code: 'NERJ_304', material_name_mn: 'Нерж 304', unit: 'м²', base_cost: 450000, display_name: 'Нерж 304', is_default: true },
          { material_code: 'NERJ_201', material_name_mn: 'Нерж 201', unit: 'м²', base_cost: 350000, display_name: 'Нерж 201' },
        ],
        sizes: [
          { size_code: 'NO_LED', size_label: 'Асдаггүй', base_price: 850000 },
          { size_code: 'LED', size_label: 'Асдаг LED', base_price: 1300000 },
          { size_code: 'CUSTOM', size_label: 'Тусгай хэмжээ', is_custom: true, base_price: 850000 },
        ],
      },
      {
        code: '3D_USEG', name_mn: '3D үсэг', name_en: '3D Letters', category: 'HADAG_REKLAM', subcategory: '3d_usen', unit_type: 'M2', sort_order: 3,
        materials: [
          { material_code: 'FOAM_PVC', material_name_mn: 'Хөөс PVC', unit: 'м²', base_cost: 350000, display_name: 'Хөөс PVC', is_default: true },
        ],
        sizes: [
          { size_code: 'NO_LIGHT', size_label: 'Гэрэлгүй', base_price: 850000 },
          { size_code: 'LED', size_label: 'Гэрэлтэй LED', base_price: 1250000 },
        ],
      },
      {
        code: 'GERELT_SAMBAR', name_mn: 'Гэрэлт самбар', name_en: 'Light Box', category: 'HADAG_REKLAM', subcategory: 'sambar', unit_type: 'M2', sort_order: 4,
        materials: [
          { material_code: 'ALUM_FRAME', material_name_mn: 'Хөнгөн цагаан хүрээ', unit: 'м²', base_cost: 180000, display_name: 'Хөнгөн цагаан', is_default: true },
        ],
        sizes: [
          { size_code: 'DOTOR_4CM', size_label: 'Дотор 4см', base_price: 280000 },
          { size_code: 'DOTOR_6CM', size_label: 'Дотор 6см', base_price: 320000 },
          { size_code: 'DOTOR_8CM', size_label: 'Дотор 8см', base_price: 350000 },
          { size_code: 'GADNA_BULANTAI', size_label: 'Гадна булантай', base_price: 380000 },
          { size_code: 'GADNA_SOKHDOG', size_label: 'Гадна сөхдөг', base_price: 450000 },
        ],
      },
      {
        code: 'OFFSET_A4', name_mn: 'Офсет хэвлэл', name_en: 'Offset Printing', category: 'KHEVLEL', subcategory: 'offset', unit_type: 'PIECE', sort_order: 10,
        materials: [
          { material_code: '80GSM', material_name_mn: '80гр цаас', unit: 'хуудас', base_cost: 60, display_name: '80гр', is_default: true },
          { material_code: '120GSM', material_name_mn: '120гр цаас', unit: 'хуудас', base_cost: 90, display_name: '120гр' },
          { material_code: '150GSM', material_name_mn: '150гр цаас', unit: 'хуудас', base_cost: 120, display_name: '150гр' },
          { material_code: '200GSM', material_name_mn: '200гр цаас', unit: 'хуудас', base_cost: 160, display_name: '200гр' },
          { material_code: '300GSM', material_name_mn: '300гр цаас', unit: 'хуудас', base_cost: 220, display_name: '300гр' },
        ],
        sizes: [
          { size_code: 'A4', size_label: 'A4 (210×297мм)', width_mm: 210, height_mm: 297, base_price: 150 },
          { size_code: 'A3', size_label: 'A3 (297×420мм)', width_mm: 297, height_mm: 420, base_price: 280 },
          { size_code: 'A5', size_label: 'A5 (148×210мм)', width_mm: 148, height_mm: 210, base_price: 90 },
          { size_code: 'BUSINESS_CARD', size_label: 'Визит карт (90×50мм)', width_mm: 90, height_mm: 50, base_price: 60 },
        ],
      },
      {
        code: 'WIDE_FORMAT', name_mn: 'Өргөн хэвлэл', name_en: 'Wide Format Printing', category: 'KHEVLEL', subcategory: 'wide', unit_type: 'M2', sort_order: 11,
        materials: [
          { material_code: 'BANNER', material_name_mn: 'Баннер', unit: 'м²', base_cost: 5000, display_name: 'Баннер материал', is_default: true },
          { material_code: 'STICKER', material_name_mn: 'Стикер', unit: 'м²', base_cost: 8000, display_name: 'Стикер' },
          { material_code: 'FLAG', material_name_mn: 'Даавуу туг', unit: 'м²', base_cost: 12000, display_name: 'Даавуу' },
          { material_code: 'CANVAS', material_name_mn: 'Canvas', unit: 'м²', base_cost: 15000, display_name: 'Canvas даавуу' },
        ],
        sizes: [
          { size_code: '1x1', size_label: '1м × 1м', width_mm: 1000, height_mm: 1000, base_price: 8000 },
          { size_code: '2x1', size_label: '2м × 1м', width_mm: 2000, height_mm: 1000, base_price: 16000 },
          { size_code: '3x1', size_label: '3м × 1м', width_mm: 3000, height_mm: 1000, base_price: 24000 },
          { size_code: 'CUSTOM', size_label: 'Тусгай хэмжээ', is_custom: true, base_price: 8000 },
        ],
      },
      {
        code: 'PROMO_ITEMS', name_mn: 'Промо бараа', name_en: 'Promotional Items', category: 'PROMO', subcategory: 'promo', unit_type: 'PIECE', sort_order: 20,
        materials: [
          { material_code: 'PEN', material_name_mn: 'Үзэг', unit: 'ш', base_cost: 1500, display_name: 'Үзэг', is_default: true },
          { material_code: 'NOTEBOOK', material_name_mn: 'Дэвтэр', unit: 'ш', base_cost: 5000, display_name: 'Дэвтэр' },
          { material_code: 'MUG', material_name_mn: 'Аяга', unit: 'ш', base_cost: 7000, display_name: 'Аяга' },
          { material_code: 'TSHIRT', material_name_mn: 'Футболк', unit: 'ш', base_cost: 12000, display_name: 'Футболк' },
        ],
        sizes: [
          { size_code: 'STANDARD', size_label: 'Стандарт', base_price: 2500 },
        ],
      },
      {
        code: 'AWARDS', name_mn: 'Шагнал', name_en: 'Awards & Trophies', category: 'AWARD', subcategory: 'award', unit_type: 'PIECE', sort_order: 30,
        materials: [
          { material_code: 'CRYSTAL', material_name_mn: 'Болор', unit: 'ш', base_cost: 25000, display_name: 'Болор', is_default: true },
          { material_code: 'WOOD', material_name_mn: 'Мод', unit: 'ш', base_cost: 18000, display_name: 'Модон' },
          { material_code: 'MEDAL', material_name_mn: 'Медаль', unit: 'ш', base_cost: 6000, display_name: 'Медаль' },
          { material_code: 'BADGE', material_name_mn: 'Тэмдэг', unit: 'ш', base_cost: 4000, display_name: 'Тэмдэг' },
        ],
        sizes: [
          { size_code: 'SMALL', size_label: 'Жижиг', base_price: 8000 },
          { size_code: 'MEDIUM', size_label: 'Дунд', base_price: 25000 },
          { size_code: 'LARGE', size_label: 'Том', base_price: 45000 },
        ],
      },
    ]

    for (const p of products) {
      const { materials, sizes, ...productData } = p
      const saved = await this.masterRepo.save(this.masterRepo.create({ ...productData } as Partial<ProductMaster>))
      for (const m of materials) {
        await this.materialRepo.save(this.materialRepo.create({ ...m, product_id: saved.id }))
      }
      for (const s of sizes) {
        await this.sizeRepo.save(this.sizeRepo.create({ ...s, product_id: saved.id } as any))
      }
    }

    return { message: 'Seeded successfully' }
  }
}
