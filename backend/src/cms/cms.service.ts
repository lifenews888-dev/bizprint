import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MegaMenu } from './entities/mega-menu.entity';
import { HeroSlide } from './entities/hero-slide.entity';
import { SiteSettings } from './entities/site-settings.entity';

@Injectable()
export class CmsService implements OnModuleInit {
  private readonly logger = new Logger(CmsService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(MegaMenu) private menuRepo: Repository<MegaMenu>,
    @InjectRepository(HeroSlide) private slideRepo: Repository<HeroSlide>,
    @InjectRepository(SiteSettings) private settingsRepo: Repository<SiteSettings>,
  ) {}

  // ─── Default settings (used only when DB is empty) ───
  private static readonly DEFAULTS: Record<string, any> = {
    logo_url: '/uploads/logo.png',
    site_name: 'BizPrint',
    phone: '7711-8899',
    email: 'info@bizprint.mn',
    banner_enabled: true,
    banner_text: '1 секундэд үнийн санал авах',
    banner_link: '/smart-quote',
    banner_color: '#1e40af',
    promo_enabled: true,
    promo_title: 'AI Quote Calculator',
    promo_description: 'PDF оруулаад секундэд үнийн санал авах',
    promo_image: null,
    promo_link: '/smart-quote',
    facebook: 'https://facebook.com/bizprint',
    instagram: 'https://instagram.com/bizprint',
  };

  // In-memory cache (loaded from DB on startup)
  private static siteSettings: Record<string, any> = { ...CmsService.DEFAULTS };

  // ─── Load from DB on startup ───
  async onModuleInit() {
    try {
      const rows = await this.settingsRepo.find({ where: { group: 'site' } });
      if (rows.length > 0) {
        for (const row of rows) {
          CmsService.siteSettings[row.key] = row.value;
        }
        this.logger.log(`Loaded ${rows.length} settings from DB`);
      } else {
        // First run: seed defaults to DB
        await this.persistAllSettings();
        this.logger.log('Seeded default settings to DB');
      }
      // Also load footer config
      const footerRow = await this.settingsRepo.findOne({ where: { key: 'footer_config', group: 'footer' } });
      if (footerRow) {
        CmsService.footerConfig = footerRow.value;
        this.logger.log('Loaded footer config from DB');
      }
    } catch (e) {
      this.logger.warn('Could not load settings from DB, using defaults');
    }
  }

  // ─── Persist settings to DB ───
  private async persistSetting(key: string, value: any, group = 'site') {
    try {
      const existing = await this.settingsRepo.findOne({ where: { key, group } });
      if (existing) {
        existing.value = value;
        await this.settingsRepo.save(existing);
      } else {
        await this.settingsRepo.save(this.settingsRepo.create({ key, value, group, label: key }));
      }
    } catch (e) {
      this.logger.warn(`Failed to persist setting ${key}: ${e.message}`);
    }
  }

  private async persistAllSettings() {
    for (const [key, value] of Object.entries(CmsService.siteSettings)) {
      await this.persistSetting(key, value);
    }
  }

  // Mega menu column config — which categories to show as columns
  private static menuColumns: string[] = []; // category IDs in order

  // ─── Header (public) ───
  async getHeader() {
    const s = CmsService.siteSettings;
    const cats = await this.getCategories();
    const roots = cats.filter(c => !c.parent_id);
    return {
      logo_url: s.logo_url, site_name: s.site_name, phone: s.phone,
      banner: s.banner_enabled ? { text: s.banner_text, link: s.banner_link, color: s.banner_color } : null,
      menu: roots.map(r => ({
        id: r.id, name: r.name, name_mn: r.name_mn, slug: r.slug, icon: r.icon,
        children: cats.filter(c => c.parent_id === r.id).map(c => ({ id: c.id, name: c.name, name_mn: c.name_mn, slug: c.slug })),
      })),
      promo: s.promo_enabled ? { title: s.promo_title, description: s.promo_description, image: s.promo_image, link: s.promo_link } : null,
    };
  }

  // ─── Mega Menu (public — from DB, fallback to categories) ───
  async getMegaMenu() {
    // First try: return menu items from mega_menu DB table
    const dbItems = await this.menuRepo.find({
      where: { is_active: true },
      order: { sort_order: 'ASC' },
    });

    if (dbItems.length > 0) {
      return dbItems;
    }

    // Fallback: build from categories (for when mega_menu table is empty)
    const cats = await this.getCategories();
    const roots = CmsService.menuColumns.length > 0
      ? CmsService.menuColumns.map(id => cats.find(c => c.id === id)).filter(Boolean)
      : cats.filter(c => !c.parent_id);

    return roots.map((r: any, idx: number) => ({
      id: r.id,
      nav_label: r.name_mn || r.name,
      nav_url: `/shop?category=${r.slug}`,
      nav_type: 'MEGA',
      is_active: true,
      sort_order: idx,
      columns: [{
        title: r.name_mn || r.name,
        icon: r.icon,
        items: cats.filter(c => c.parent_id === r.id).map(c => ({
          label: c.name_mn || c.name,
          url: `/shop?category=${c.slug}`,
        })),
      }],
      featured: null,
    }));
  }

  // ─── Mega Menu Builder (admin) ───
  async getMegaMenuConfig() {
    const cats = await this.getCategories();
    const roots = cats.filter(c => !c.parent_id);
    return {
      available_categories: roots.map(r => ({
        id: r.id, name: r.name_mn || r.name, icon: r.icon,
        children_count: cats.filter(c => c.parent_id === r.id).length,
        children: cats.filter(c => c.parent_id === r.id).map(c => ({ id: c.id, name: c.name_mn || c.name })),
      })),
      selected_columns: CmsService.menuColumns,
      promo: {
        enabled: CmsService.siteSettings.promo_enabled,
        title: CmsService.siteSettings.promo_title,
        description: CmsService.siteSettings.promo_description,
        image: CmsService.siteSettings.promo_image,
        link: CmsService.siteSettings.promo_link,
      },
    };
  }

  async updateMegaMenuColumns(columnIds: string[]) {
    CmsService.menuColumns = columnIds;
    await this.persistSetting('menu_columns', columnIds, 'menu');
    return { success: true, columns: columnIds };
  }

  async updatePromo(dto: { enabled?: boolean; title?: string; description?: string; image?: string; link?: string }) {
    if (dto.enabled !== undefined) CmsService.siteSettings.promo_enabled = dto.enabled;
    if (dto.title) CmsService.siteSettings.promo_title = dto.title;
    if (dto.description) CmsService.siteSettings.promo_description = dto.description;
    if (dto.image !== undefined) CmsService.siteSettings.promo_image = dto.image;
    if (dto.link) CmsService.siteSettings.promo_link = dto.link;
    // Persist promo settings
    for (const key of ['promo_enabled', 'promo_title', 'promo_description', 'promo_image', 'promo_link']) {
      await this.persistSetting(key, CmsService.siteSettings[key]);
    }
    return { success: true };
  }

  // ─── Settings ───
  // ─── Footer (public) ───
  private static footerConfig: Record<string, any> = {
    logo_url: '/uploads/logo.png',
    logo_width: 120,
    description: 'BizPrint — Хэвлэлийн үйлчилгээний платформ',
    socials: [
      { platform: 'facebook', url: 'https://facebook.com/bizprint', enabled: true },
      { platform: 'instagram', url: 'https://instagram.com/bizprint', enabled: true },
      { platform: 'tiktok', url: 'https://tiktok.com/@bizprint', enabled: true },
      { platform: 'youtube', url: 'https://youtube.com/@bizprint', enabled: false },
    ],
    branches: [
      { name: 'Төв оффис', address: 'Улаанбаатар, СБД', phone: '7711-8899', map_embed: '' },
    ],
    columns: [
      { title: 'Үйлчилгээ', links: [{ label: 'Нэрийн хуудас', url: '/shop' }, { label: 'Стикер', url: '/shop' }, { label: 'Баннер', url: '/shop' }] },
      { title: 'Компани', links: [{ label: 'Бидний тухай', url: '/about' }, { label: 'Холбоо барих', url: '/contact' }] },
      { title: 'Тусламж', links: [{ label: 'FAQ', url: '/faq' }, { label: 'Хүргэлт', url: '/delivery' }] },
    ],
    payment_icons: { visa: true, master: true, qpay: true, socialpay: true, monpay: false },
    newsletter_enabled: true,
    newsletter_text: 'Шинэ мэдээлэл авах бол имэйлээ бүртгүүлнэ үү',
    copyright: '© 2026 BizPrint. Бүх эрх хуулиар хамгаалагдсан.',
  };

  getFooter() { return CmsService.footerConfig; }

  async updateFooter(dto: any) {
    Object.assign(CmsService.footerConfig, dto);
    await this.persistSetting('footer_config', CmsService.footerConfig, 'footer');
    return { success: true, footer: CmsService.footerConfig };
  }

  // ─── Settings ───
  getSettings() {
    // Return as array format for admin CMS page compatibility
    const all = { ...CmsService.siteSettings };
    return Object.entries(all).map(([key, value]) => ({
      id: key, key, value: String(value ?? ''), group: 'general', label: key,
    }));
  }

  getSettingsObject() { return { ...CmsService.siteSettings, footer: CmsService.footerConfig }; }

  async updateHeader(dto: any) {
    Object.assign(CmsService.siteSettings, dto);
    for (const [key, value] of Object.entries(dto)) {
      await this.persistSetting(key, value);
    }
    return { success: true };
  }

  async updateSettings(dto: any) {
    Object.assign(CmsService.siteSettings, dto);
    for (const [key, value] of Object.entries(dto)) {
      await this.persistSetting(key, value);
    }
    return { success: true };
  }

  async bulkUpdateSettings(items: { key: string; value: string }[]) {
    for (const item of items) {
      let val: any = item.value;
      if (val === 'true') val = true;
      if (val === 'false') val = false;
      CmsService.siteSettings[item.key] = val;
      await this.persistSetting(item.key, val);
    }
    return { success: true, updated: items.length };
  }

  // ─── Mega Menu CRUD ───
  async getMenuItems() {
    return this.menuRepo.find({ order: { sort_order: 'ASC' } });
  }

  async createMenuItem(dto: Partial<MegaMenu>) {
    const item = this.menuRepo.create(dto);
    return this.menuRepo.save(item);
  }

  async updateMenuItem(id: string, dto: Partial<MegaMenu>) {
    const item = await this.menuRepo.findOneBy({ id });
    if (!item) throw new NotFoundException('Menu item not found');
    Object.assign(item, dto);
    return this.menuRepo.save(item);
  }

  async deleteMenuItem(id: string) {
    const result = await this.menuRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Menu item not found');
    return { success: true };
  }

  async reorderMenuItems(items: { id: string; sort_order: number }[]) {
    for (const item of items) {
      await this.menuRepo.update(item.id, { sort_order: item.sort_order });
    }
    return { success: true, updated: items.length };
  }

  // ─── Hero Slides ───
  async getActiveSlides() {
    const now = new Date();
    const slides = await this.slideRepo.find({ where: { is_active: true }, order: { sort_order: 'ASC' } });
    return slides.filter(s => {
      if (s.start_at && new Date(s.start_at) > now) return false;
      if (s.end_at && new Date(s.end_at) < now) return false;
      return true;
    });
  }

  async getAllSlides() {
    return this.slideRepo.find({ order: { sort_order: 'ASC' } });
  }

  async createSlide(dto: Partial<HeroSlide>) {
    const slide = this.slideRepo.create(dto);
    return this.slideRepo.save(slide);
  }

  async updateSlide(id: string, dto: Partial<HeroSlide>) {
    const slide = await this.slideRepo.findOneBy({ id });
    if (!slide) throw new NotFoundException('Slide not found');
    Object.assign(slide, dto);
    return this.slideRepo.save(slide);
  }

  async deleteSlide(id: string) {
    const r = await this.slideRepo.delete(id);
    if (r.affected === 0) throw new NotFoundException('Slide not found');
    return { success: true };
  }

  async reorderSlides(items: { id: string; sort_order: number }[]) {
    for (const item of items) await this.slideRepo.update(item.id, { sort_order: item.sort_order });
    return { success: true };
  }

  // ─── Helper ───
  private async getCategories() {
    try {
      return await this.dataSource.query(`SELECT id, name, name_mn, slug, icon, parent_id, sort_order FROM categories WHERE is_active = true ORDER BY sort_order ASC`);
    } catch { return []; }
  }
}
