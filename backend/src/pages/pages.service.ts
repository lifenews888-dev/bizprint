import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from './page.entity';

@Injectable()
export class PagesService {
  constructor(@InjectRepository(Page) private repo: Repository<Page>) {}

  findAll() { return this.repo.find({ order: { sort_order: 'ASC' } }); }
  findPublished() { return this.repo.find({ where: { is_published: true }, order: { sort_order: 'ASC' } }); }
  findBySlug(slug: string) { return this.repo.findOne({ where: { slug, is_published: true } }); }
  findById(id: string) { return this.repo.findOne({ where: { id } }); }

  async create(dto: Partial<Page>) {
    if (!dto.slug && dto.title) dto.slug = dto.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36);
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: Partial<Page>) {
    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) { await this.repo.delete(id); return { success: true }; }
}
