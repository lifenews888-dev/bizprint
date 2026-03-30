import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class CmsService {
  constructor(private dataSource: DataSource) {}

  // ─── Site Settings (in-memory) ───
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
    promo_image: null,
    promo_link: '/smart-quote',
    facebook: 'https://facebook.com/bizprint',
    instagram: 'https://instagram.com/bizprint',
  };

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

  // ─── Mega Menu (column-based) ───
  async getMegaMenu() {
    const cats = await this.getCategories();
    const roots = CmsService.menuColumns.length > 0
      ? CmsService.menuColumns.map(id => cats.find(c => c.id === id)).filter(Boolean)
      : cats.filter(c => !c.parent_id);

    const s = CmsService.siteSettings;
    return {
      columns: roots.map((r: any) => ({
        id: r.id, title: r.name_mn || r.name, icon: r.icon,
        items: cats.filter(c => c.parent_id === r.id).map(c => ({ id: c.id, name: c.name_mn || c.name, slug: c.slug })),
      })),
      promo: s.promo_enabled ? { title: s.promo_title, description: s.promo_description, image: s.promo_image, link: s.promo_link } : null,
    };
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
    return { success: true, columns: columnIds };
  }

  async updatePromo(dto: { enabled?: boolean; title?: string; description?: string; image?: string; link?: string }) {
    if (dto.enabled !== undefined) CmsService.siteSettings.promo_enabled = dto.enabled;
    if (dto.title) CmsService.siteSettings.promo_title = dto.title;
    if (dto.description) CmsService.siteSettings.promo_description = dto.description;
    if (dto.image !== undefined) CmsService.siteSettings.promo_image = dto.image;
    if (dto.link) CmsService.siteSettings.promo_link = dto.link;
    return { success: true };
  }

  // ─── Settings ───
  getSettings() { return CmsService.siteSettings; }
  updateHeader(dto: any) { Object.assign(CmsService.siteSettings, dto); return { success: true }; }
  updateSettings(dto: any) { Object.assign(CmsService.siteSettings, dto); return { success: true, settings: CmsService.siteSettings }; }

  // ─── Helper ───
  private async getCategories() {
    try {
      return await this.dataSource.query(`SELECT id, name, name_mn, slug, icon, parent_id, sort_order FROM categories WHERE is_active = true ORDER BY sort_order ASC`);
    } catch { return []; }
  }
}
