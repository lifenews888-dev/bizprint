import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class CmsService {
  constructor(private dataSource: DataSource) {}

  private static siteSettings: Record<string, any> = {
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
    promo_link: '/smart-quote',
    facebook: 'https://facebook.com/bizprint',
    instagram: 'https://instagram.com/bizprint',
  };

  async getHeader() {
    const s = CmsService.siteSettings;
    let menuItems: any[] = [];
    try {
      menuItems = await this.dataSource.query(`SELECT id, name, name_mn, slug, icon, parent_id, sort_order FROM categories WHERE is_active = true ORDER BY sort_order ASC`);
    } catch {}
    const roots = menuItems.filter(c => !c.parent_id);
    return {
      logo_url: s.logo_url, site_name: s.site_name, phone: s.phone,
      banner: s.banner_enabled ? { text: s.banner_text, link: s.banner_link, color: s.banner_color } : null,
      menu: roots.map(r => ({
        id: r.id, name: r.name, name_mn: r.name_mn, slug: r.slug, icon: r.icon,
        children: menuItems.filter(c => c.parent_id === r.id).map(c => ({ id: c.id, name: c.name, name_mn: c.name_mn, slug: c.slug })),
      })),
      promo: s.promo_enabled ? { title: s.promo_title, description: s.promo_description, link: s.promo_link } : null,
    };
  }

  async getMegaMenu() {
    let cats: any[] = [];
    try { cats = await this.dataSource.query(`SELECT id, name, name_mn, slug, icon, parent_id, sort_order FROM categories WHERE is_active = true ORDER BY sort_order ASC`); } catch {}
    const roots = cats.filter(c => !c.parent_id);
    return {
      columns: roots.map(r => ({
        id: r.id, title: r.name_mn || r.name, icon: r.icon,
        items: cats.filter(c => c.parent_id === r.id).map(c => ({ id: c.id, name: c.name_mn || c.name, slug: c.slug })),
      })),
      promo: CmsService.siteSettings.promo_enabled ? { title: CmsService.siteSettings.promo_title, description: CmsService.siteSettings.promo_description, link: CmsService.siteSettings.promo_link } : null,
    };
  }

  getSettings() { return CmsService.siteSettings; }
  updateHeader(dto: any) { Object.assign(CmsService.siteSettings, dto); return { success: true }; }
  updateSettings(dto: any) { Object.assign(CmsService.siteSettings, dto); return { success: true, settings: CmsService.siteSettings }; }
}
