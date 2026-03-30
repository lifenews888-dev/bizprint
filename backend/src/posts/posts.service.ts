import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';

@Injectable()
export class PostsService {
  constructor(@InjectRepository(Post) private repo: Repository<Post>) {}

  findAll() { return this.repo.find({ order: { created_at: 'DESC' } }); }
  findPublished(category?: string) {
    const where: any = { is_published: true };
    if (category) where.category = category;
    return this.repo.find({ where, order: { created_at: 'DESC' } });
  }
  findBySlug(slug: string) { return this.repo.findOne({ where: { slug } }); }

  async create(dto: Partial<Post>) {
    if (!dto.slug && dto.title) dto.slug = dto.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36);
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: Partial<Post>) {
    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) { await this.repo.delete(id); return { success: true }; }

  async incrementView(slug: string) {
    await this.repo.increment({ slug }, 'view_count', 1);
  }
}
