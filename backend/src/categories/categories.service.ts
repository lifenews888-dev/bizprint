import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CategoryParameter } from './category-parameter.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private repo: Repository<Category>,
    @InjectRepository(CategoryParameter) private paramRepo: Repository<CategoryParameter>,
  ) {}

  async findAll() { return this.repo.find({ order: { sort_order: 'ASC' } }); }

  async findTree() {
    const all = await this.repo.find({ order: { sort_order: 'ASC' } });
    const roots = all.filter(c => !c.parent_id);
    return roots.map(r => ({ ...r, children: all.filter(c => c.parent_id === r.id) }));
  }

  async getNavigation() {
    const all = await this.repo.find({ where: { is_active: true }, order: { sort_order: 'ASC' } });
    const roots = all.filter(c => !c.parent_id);
    return roots.map(r => ({
      id: r.id, name: r.name, name_mn: r.name_mn, slug: r.slug, icon: r.icon,
      show_in_menu: (r as any).show_in_menu ?? true,
      children: all.filter(c => c.parent_id === r.id).map(c => ({ id: c.id, name: c.name, name_mn: c.name_mn, slug: c.slug, icon: c.icon })),
    }));
  }

  async create(dto: Partial<Category>) {
    if (!dto.name) throw new Error('Ангиллын нэр шаардлагатай');

    // Auto-generate slug if missing
    if (!dto.slug) {
      dto.slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-\u0400-\u04ff]/g, '') + '-' + Date.now().toString(36);
    }

    try {
      return await this.repo.save(this.repo.create(dto));
    } catch (e: any) {
      if (e.code === '23505') { // Unique violation
        if (e.detail?.includes('name')) throw new Error('Энэ нэр ашиглагдсан байна');
        if (e.detail?.includes('slug')) throw new Error('Энэ slug ашиглагдсан байна');
        throw new Error('Давхардсан өгөгдөл');
      }
      throw e;
    }
  }

  async update(id: string, dto: Partial<Category>) {
    try {
      await this.repo.update(id, dto);
      return this.repo.findOne({ where: { id } });
    } catch (e: any) {
      if (e.code === '23505') throw new Error('Давхардсан нэр эсвэл slug');
      throw e;
    }
  }
  async remove(id: string) {
    // Delete children first, then parent
    await this.repo.delete({ parent_id: id });
    await this.paramRepo.delete({ category_id: id });
    await this.repo.delete(id);
    return { success: true };
  }

  // ─── Seed: create parent groups and assign children ───
  async seedGroups() {
    const GROUPS: { name: string; name_mn: string; slug: string; icon: string; color: string; childSlugs: string[] }[] = [
      { name: 'Offset Print', name_mn: 'Офсет хэвлэл', slug: 'offset', icon: '🖨️', color: '#378ADD',
        childSlugs: ['business-card', 'flyer', 'book', 'office', 'events'] },
      { name: 'Digital Print', name_mn: 'Дижитал хэвлэл', slug: 'digital', icon: '🏷️', color: '#22c55e',
        childSlugs: ['sticker', 'packaging'] },
      { name: 'Wide Format', name_mn: 'Өргөн формат', slug: 'wide-format', icon: '🪧', color: '#eab308',
        childSlugs: ['urgun_hevlel', 'banner', 'signage'] },
      { name: 'Promo & Apparel', name_mn: 'Промо & Хувцас', slug: 'promo', icon: '👕', color: '#a855f7',
        childSlugs: ['merchandise', 'apparel'] },
    ];

    const all = await this.repo.find();
    const created: any[] = [];

    for (let i = 0; i < GROUPS.length; i++) {
      const g = GROUPS[i];
      // Check if parent already exists
      let parent = all.find(c => c.slug === g.slug);
      if (!parent) {
        parent = await this.repo.save(this.repo.create({
          name: g.name, name_mn: g.name_mn, slug: g.slug,
          icon: g.icon, color: g.color, sort_order: i,
          is_active: true, show_in_menu: true,
        }));
      }
      // Assign children
      for (const childSlug of g.childSlugs) {
        const child = all.find(c => c.slug === childSlug || c.slug?.startsWith(childSlug));
        if (child && !child.parent_id) {
          await this.repo.update(child.id, { parent_id: parent.id, show_in_menu: true });
        }
      }
      created.push({ parent: parent.name_mn || parent.name, children: g.childSlugs });
    }
    return { message: 'Groups seeded', groups: created };
  }

  // ─── Parameters ───
  async getParameters(categoryId?: string) {
    const where: any = { is_active: true };
    if (categoryId) where.category_id = categoryId;
    return this.paramRepo.find({ where, order: { sort_order: 'ASC' }, relations: ['category'] });
  }

  async getParametersByCategorySlug(slug: string) {
    const cat = await this.repo.findOne({ where: { slug } });
    if (!cat) return [];
    // Get category-specific + global parameters
    return this.paramRepo.find({
      where: [{ category_id: cat.id, is_active: true }, { is_global: true, is_active: true }],
      order: { sort_order: 'ASC' },
    });
  }

  async createParameter(dto: Partial<CategoryParameter>) {
    return this.paramRepo.save(this.paramRepo.create(dto));
  }

  async updateParameter(id: string, dto: Partial<CategoryParameter>) {
    await this.paramRepo.update(id, dto);
    return this.paramRepo.findOne({ where: { id } });
  }

  async removeParameter(id: string) {
    await this.paramRepo.delete(id);
    return { success: true };
  }

  // ─── Price calculation with parameters ───
  calculateWithParameters(basePrice: number, quantity: number, selectedOptions: { paramId: string; value: string }[], params: CategoryParameter[]) {
    let adjustment = 0;

    for (const sel of selectedOptions) {
      const param = params.find(p => p.id === sel.paramId);
      if (!param) continue;

      // Step pricing (tiered)
      if (param.type === 'step_pricing' && param.tiers) {
        const tier = param.tiers.find(t => quantity >= t.min_qty && quantity <= t.max_qty);
        if (tier) return { unit_price: tier.unit_price, total: tier.unit_price * quantity, adjustment: 0 };
      }

      // Option-based adjustment
      const option = param.options?.find(o => o.value === sel.value);
      if (option) {
        if (option.adjustment_type === 'percent') {
          adjustment += Math.round(basePrice * (option.price_adjustment / 100));
        } else {
          adjustment += option.price_adjustment;
        }
      }
    }

    const unitPrice = basePrice + adjustment;
    return { unit_price: unitPrice, total: unitPrice * quantity, adjustment };
  }
}
