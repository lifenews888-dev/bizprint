import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from './page.entity';

@Injectable()
export class PagesService {
  constructor(
    @InjectRepository(Page)
    private repo: Repository<Page>,
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findPublished() {
    return this.repo.find({ where: { isPublished: true }, order: { createdAt: 'DESC' } });
  }

  findByType(type: string) {
    return this.repo.find({ where: { type, isPublished: true }, order: { createdAt: 'DESC' } });
  }

  async findBySlug(slug: string) {
    const page = await this.repo.findOne({ where: { slug, isPublished: true } });
    if (!page) throw new NotFoundException('Хуудас олдсонгүй');
    return page;
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Page>) {
    const page = this.repo.create(data);
    return this.repo.save(page);
  }

  async update(id: number, data: Partial<Page>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { success: true };
  }
}