import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
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