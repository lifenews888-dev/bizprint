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

  async create(dto: Partial<Category>) { return this.repo.save(this.repo.create(dto)); }
  async update(id: string, dto: Partial<Category>) { await this.repo.update(id, dto); return this.repo.findOne({ where: { id } }); }
  async remove(id: string) { await this.repo.delete(id); return { success: true }; }

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
