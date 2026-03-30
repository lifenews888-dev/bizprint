import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private repo: Repository<Category>,
  ) {}

  async findAll() {
    return this.repo.find({ order: { sort_order: 'ASC' } });
  }

  async findTree() {
    const all = await this.repo.find({ order: { sort_order: 'ASC' } });
    const roots = all.filter(c => !c.parent_id);
    return roots.map(r => ({
      ...r,
      children: all.filter(c => c.parent_id === r.id),
    }));
  }

  // Navigation — categories marked for menu display
  async getNavigation() {
    const all = await this.repo.find({ where: { is_active: true }, order: { sort_order: 'ASC' } });
    const roots = all.filter(c => !c.parent_id);
    return roots.map(r => ({
      id: r.id,
      name: r.name,
      name_mn: r.name_mn,
      slug: r.slug,
      icon: r.icon,
      show_in_menu: (r as any).show_in_menu ?? true,
      children: all.filter(c => c.parent_id === r.id).map(c => ({
        id: c.id, name: c.name, name_mn: c.name_mn, slug: c.slug, icon: c.icon,
      })),
    }));
  }

  async create(dto: Partial<Category>) {
    const cat = this.repo.create(dto);
    return this.repo.save(cat);
  }

  async update(id: string, dto: Partial<Category>) {
    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { success: true };
  }
}
