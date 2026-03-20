import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { SiteSettings } from './entities/site-settings.entity'
import { MegaMenu } from './entities/mega-menu.entity'
import { CmsGateway } from './cms.gateway'

@Injectable()
export class CmsService {
  constructor(
    @InjectRepository(SiteSettings)
    private readonly settingsRepo: Repository<SiteSettings>,
    @InjectRepository(MegaMenu)
    private readonly menuRepo: Repository<MegaMenu>,
    private readonly gateway: CmsGateway,
  ) {}

  // ─── Settings ────────────────────────────────────────────

  async findAllSettings(): Promise<SiteSettings[]> {
    return this.settingsRepo.find({ order: { group: 'ASC', key: 'ASC' } })
  }

  async findPublicSettings(): Promise<Record<string, any>> {
    const publicGroups = ['header', 'footer', 'homepage', 'site']
    const rows = await this.settingsRepo.find({
      where: { group: In(publicGroups) },
    })
    const flat: Record<string, any> = {}
    for (const row of rows) {
      flat[row.key] = row.value
    }
    return flat
  }

  async findSettingsByGroup(group: string): Promise<SiteSettings[]> {
    return this.settingsRepo.find({
      where: { group },
      order: { key: 'ASC' },
    })
  }

  async updateSetting(
    key: string,
    value: any,
    updatedBy?: string,
  ): Promise<SiteSettings> {
    let setting = await this.settingsRepo.findOne({ where: { key } })
    if (setting) {
      setting.value = value
      if (updatedBy) setting.updated_by = updatedBy
      const saved = await this.settingsRepo.save(setting)
      this.gateway.notifySettingsUpdate(key, value)
      return saved
    }
    setting = this.settingsRepo.create({
      key,
      value,
      updated_by: updatedBy ?? null,
    })
    const saved = await this.settingsRepo.save(setting)
    this.gateway.notifySettingsUpdate(key, value)
    return saved
  }

  async bulkUpdateSettings(
    items: { key: string; value: any }[],
    updatedBy?: string,
  ): Promise<SiteSettings[]> {
    const results: SiteSettings[] = []
    const updatedMap: Record<string, any> = {}
    for (const item of items) {
      // updateSetting already emits per-key; we also emit bulk at the end
      results.push(await this.updateSetting(item.key, item.value, updatedBy))
      updatedMap[item.key] = item.value
    }
    this.gateway.notifyBulkSettingsUpdate(updatedMap)
    return results
  }

  // ─── Mega Menu ───────────────────────────────────────────

  async findAllMenuItems(): Promise<MegaMenu[]> {
    return this.menuRepo.find({ order: { sort_order: 'ASC' } })
  }

  async findPublicMenuItems(): Promise<MegaMenu[]> {
    return this.menuRepo.find({
      where: { is_active: true },
      order: { sort_order: 'ASC' },
    })
  }

  async createMenuItem(data: Partial<MegaMenu>): Promise<MegaMenu> {
    const item = this.menuRepo.create(data)
    const saved = await this.menuRepo.save(item)
    await this.emitMenuUpdate()
    return saved
  }

  async updateMenuItem(
    id: string,
    data: Partial<MegaMenu>,
  ): Promise<MegaMenu> {
    await this.menuRepo.update(id, data)
    const updated = await this.menuRepo.findOneByOrFail({ id })
    await this.emitMenuUpdate()
    return updated
  }

  async deleteMenuItem(id: string): Promise<void> {
    await this.menuRepo.delete(id)
    await this.emitMenuUpdate()
  }

  async reorderMenuItems(
    items: { id: string; sort_order: number }[],
  ): Promise<void> {
    for (const item of items) {
      await this.menuRepo.update(item.id, { sort_order: item.sort_order })
    }
    await this.emitMenuUpdate()
  }

  private async emitMenuUpdate(): Promise<void> {
    const menu = await this.findPublicMenuItems()
    this.gateway.notifyMenuUpdate(menu)
  }

  // ─── Seed ────────────────────────────────────────────────

  async seed(): Promise<string> {
    const count = await this.settingsRepo.count()
    if (count > 0) return 'Already seeded'

    // ── Site settings ──
    const settings: { key: string; value: any; group: string; label: string }[] = [
      // SITE
      { key: 'site_name', value: 'BizPrint', group: 'site', label: 'Сайтын нэр' },
      { key: 'site_logo_url', value: '', group: 'site', label: 'Сайтын лого URL' },
      { key: 'site_favicon_url', value: '', group: 'site', label: 'Favicon URL' },
      { key: 'site_phone', value: '+976 XXXX-XXXX', group: 'site', label: 'Утасны дугаар' },
      { key: 'site_email', value: 'info@bizprint.mn', group: 'site', label: 'Имэйл хаяг' },
      { key: 'site_address', value: 'Улаанбаатар, Монгол', group: 'site', label: 'Хаяг байршил' },
      { key: 'site_facebook', value: '', group: 'site', label: 'Facebook холбоос' },
      { key: 'site_instagram', value: '', group: 'site', label: 'Instagram холбоос' },
      { key: 'site_youtube', value: '', group: 'site', label: 'YouTube холбоос' },
      { key: 'site_primary_color', value: '#FF6B35', group: 'site', label: 'Үндсэн өнгө' },
      { key: 'maintenance_mode', value: false, group: 'site', label: 'Засвар горим' },
      { key: 'novat_note', value: 'НӨАТ ороогүй', group: 'site', label: 'НӨАТ тэмдэглэл' },

      // HEADER
      { key: 'header_logo_url', value: '', group: 'header', label: 'Толгой лого URL' },
      { key: 'header_show_search', value: true, group: 'header', label: 'Хайлтын товч харуулах' },
      { key: 'header_show_login', value: true, group: 'header', label: 'Нэвтрэх товч харуулах' },
      { key: 'header_cta_text', value: 'Start →', group: 'header', label: 'CTA товчний текст' },
      { key: 'header_cta_url', value: '/quote', group: 'header', label: 'CTA товчний холбоос' },
      { key: 'header_announcement', value: '', group: 'header', label: 'Зарлалын текст' },
      { key: 'header_announcement_active', value: false, group: 'header', label: 'Зарлал идэвхтэй эсэх' },
      { key: 'header_announcement_color', value: '#FF6B35', group: 'header', label: 'Зарлалын өнгө' },

      // FOOTER
      { key: 'footer_logo_url', value: '', group: 'footer', label: 'Хөл лого URL' },
      { key: 'footer_description', value: 'Хэвлэлийн салбарын бүх оролцогчдыг нэгтгэсэн экосистем.', group: 'footer', label: 'Хөлийн тайлбар' },
      { key: 'footer_copyright', value: '© 2026 BizPrint. Бүх эрх хуулиар хамгаалагдсан.', group: 'footer', label: 'Зохиогчийн эрхийн текст' },
      { key: 'footer_location', value: 'Улаанбаатар, Монгол', group: 'footer', label: 'Байршил' },
      {
        key: 'footer_columns',
        value: [
          {
            title: 'Үйлчилгээ',
            links: [
              { label: 'Офсет хэвлэл', url: '/products?cat=offset' },
              { label: 'Дижитал хэвлэл', url: '/products?cat=digital' },
              { label: 'Өргөн формат', url: '/products?cat=wide-format' },
              { label: 'Промо бүтээгдэхүүн', url: '/products?cat=promo' },
            ],
          },
          {
            title: 'Компани',
            links: [
              { label: 'Бидний тухай', url: '/about' },
              { label: 'Түнш болох', url: '/partner' },
              { label: 'Холбоо барих', url: '/contact' },
              { label: 'Блог', url: '/blog' },
            ],
          },
          {
            title: 'Тусламж',
            links: [
              { label: 'Түгээмэл асуулт', url: '/faq' },
              { label: 'Үйлчилгээний нөхцөл', url: '/terms' },
              { label: 'Нууцлалын бодлого', url: '/privacy' },
              { label: 'Хүргэлтийн мэдээлэл', url: '/delivery-info' },
            ],
          },
        ],
        group: 'footer',
        label: 'Хөлийн баганууд',
      },
      { key: 'footer_show_social', value: true, group: 'footer', label: 'Сошиал холбоос харуулах' },
      { key: 'footer_show_location', value: true, group: 'footer', label: 'Байршил харуулах' },

      // HOMEPAGE
      { key: 'hero_title', value: 'Хэвлэлийн үйлчилгээ — хурдан, хямд, найдвартай', group: 'homepage', label: 'Hero гарчиг' },
      { key: 'hero_subtitle', value: 'AI-тай үнэ тооцоолол. 1 секундэд үнэ мэдэх.', group: 'homepage', label: 'Hero дэд гарчиг' },
      { key: 'hero_cta_primary_text', value: 'Үнэ авах', group: 'homepage', label: 'Hero үндсэн товчний текст' },
      { key: 'hero_cta_primary_url', value: '/quote', group: 'homepage', label: 'Hero үндсэн товчний URL' },
      { key: 'hero_cta_secondary_text', value: 'Дэлгүүр', group: 'homepage', label: 'Hero хоёрдогч товчний текст' },
      { key: 'hero_cta_secondary_url', value: '/shop', group: 'homepage', label: 'Hero хоёрдогч товчний URL' },
      { key: 'hero_background_type', value: 'color', group: 'homepage', label: 'Hero дэвсгэрийн төрөл' },
      { key: 'hero_background_value', value: '#0F0F0F', group: 'homepage', label: 'Hero дэвсгэрийн утга' },
      { key: 'features_title', value: 'Яагаад BizPrint вэ?', group: 'homepage', label: 'Онцлог хэсгийн гарчиг' },
      { key: 'features_active', value: true, group: 'homepage', label: 'Онцлог хэсэг идэвхтэй' },
      {
        key: 'features_items',
        value: [
          { icon: '⚡', title: '1 секундэд үнэ', desc: 'AI системтэй үнэ тооцоолол' },
          { icon: '🏭', title: 'Олон үйлдвэр', desc: 'Монголын шилдэг үйлдвэрүүдтэй' },
          { icon: '🚚', title: 'Хурдан хүргэлт', desc: 'Хотын дотор 24-48 цагт' },
          { icon: '💯', title: 'Чанарын баталгаа', desc: '100% чанарын баталгаатай' },
        ],
        group: 'homepage',
        label: 'Онцлог жагсаалт',
      },
      { key: 'stats_active', value: true, group: 'homepage', label: 'Статистик идэвхтэй' },
      {
        key: 'stats_items',
        value: [
          { value: '500+', label: 'Идэвхтэй хэрэглэгч' },
          { value: '50+', label: 'Үйлдвэрлэгч түнш' },
          { value: '10,000+', label: 'Дууссан захиалга' },
          { value: '99%', label: 'Хэрэглэгчийн сэтгэл ханамж' },
        ],
        group: 'homepage',
        label: 'Статистик тоонууд',
      },
      { key: 'cta_section_active', value: true, group: 'homepage', label: 'CTA хэсэг идэвхтэй' },
      { key: 'cta_title', value: 'Өнөөдөр эхэл', group: 'homepage', label: 'CTA гарчиг' },
      { key: 'cta_subtitle', value: 'Үнэгүй бүртгүүлж, хэдхэн минутанд үнэ аваарай', group: 'homepage', label: 'CTA дэд гарчиг' },
      { key: 'cta_button_text', value: 'Үнийн санал авах', group: 'homepage', label: 'CTA товчний текст' },
      { key: 'cta_button_url', value: '/quote', group: 'homepage', label: 'CTA товчний URL' },
    ]

    for (const s of settings) {
      const entity = this.settingsRepo.create(s)
      await this.settingsRepo.save(entity)
    }

    // ── Mega menu items ──
    const menuItems: Partial<MegaMenu>[] = [
      {
        nav_label: 'Products',
        nav_url: '/products',
        nav_type: 'MEGA',
        sort_order: 1,
        is_active: true,
        columns: [
          {
            title: 'ОФСЕТ ХЭВЛЭЛ',
            items: [
              { label: 'Ном & Сэтгүүл', url: '/products?cat=books' },
              { label: 'Каталог & Брошур', url: '/products?cat=catalogs' },
              { label: 'Нэрийн хуудас', url: '/products?cat=business-cards' },
              { label: 'Хайрцаг & Савлагаа', url: '/products?cat=packaging' },
            ],
          },
          {
            title: 'ДИЖИТАЛ ХЭВЛЭЛ',
            items: [
              { label: 'Флаер & Хуудас', url: '/products?cat=flyers' },
              { label: 'Постер', url: '/products?cat=posters' },
              { label: 'Стикер & Шошго', url: '/products?cat=stickers' },
              { label: 'Гэрчилгээ & Диплом', url: '/products?cat=certificates' },
            ],
          },
          {
            title: 'ӨРГӨН ФОРМАТ',
            items: [
              { label: 'Баннер', url: '/products?cat=banners' },
              { label: 'Билборд', url: '/products?cat=billboards' },
              { label: 'Наалт & Стикер', url: '/products?cat=large-stickers' },
              { label: 'Дэлгэцийн хэвлэл', url: '/products?cat=display' },
            ],
          },
          {
            title: 'ПРОМО & ДААЛАЛ',
            items: [
              { label: 'Футболк', url: '/products?cat=tshirts' },
              { label: 'Аяга & Сав', url: '/products?cat=mugs' },
              { label: 'Дэвтэр & Тэмдэглэл', url: '/products?cat=notebooks' },
              { label: 'Бусад бүтээгдэхүүн', url: '/products?cat=other' },
            ],
          },
        ],
        featured: {
          title: 'AI Quote Calculator',
          description: '1 секундэд үнэ тооцоолоорой',
          url: '/quote',
          image: '',
          badge: 'Шинэ',
        },
      },
      {
        nav_label: 'Shop',
        nav_url: '/shop',
        nav_type: 'LINK',
        sort_order: 2,
        is_active: true,
        columns: null,
        featured: null,
      },
      {
        nav_label: 'Services',
        nav_url: '/services',
        nav_type: 'DROPDOWN',
        sort_order: 3,
        is_active: true,
        columns: [
          {
            items: [
              { label: 'Үнийн санал', url: '/quote' },
              { label: 'Онлайн дизайн', url: '/design' },
              { label: 'Хүргэлт', url: '/delivery' },
              { label: 'Партнер хөтөлбөр', url: '/partner' },
            ],
          },
        ],
        featured: null,
      },
      {
        nav_label: 'Partner',
        nav_url: '/partner',
        nav_type: 'LINK',
        sort_order: 4,
        is_active: true,
        columns: null,
        featured: null,
      },
      {
        nav_label: 'Quote',
        nav_url: '/quote',
        nav_type: 'LINK',
        sort_order: 5,
        is_active: true,
        columns: null,
        featured: null,
      },
      {
        nav_label: 'Factories',
        nav_url: '/factory',
        nav_type: 'LINK',
        sort_order: 6,
        is_active: true,
        columns: null,
        featured: null,
      },
    ]

    for (const m of menuItems) {
      const entity = this.menuRepo.create(m)
      await this.menuRepo.save(entity)
    }

    return 'Seeded successfully'
  }
}
