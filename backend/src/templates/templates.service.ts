import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './template.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private repo: Repository<Template>,
  ) {}

  findAll(query: any = {}) {
    const where: any = {}
    if (query.category) where.category = query.category
    if (query.status) where.status = query.status
    else where.status = 'approved'
    if (query.designer_id) where.designer_id = query.designer_id
    return this.repo.find({ where, order: { sort_order: 'ASC', created_at: 'DESC' } })
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } })
  }

  create(data: Partial<Template>) {
    return this.repo.save(this.repo.create({ ...data, status: 'pending' }))
  }

  async update(id: string, data: Partial<Template>) {
    await this.repo.update(id, data)
    return this.findOne(id)
  }

  async approve(id: string) {
    await this.repo.update(id, { status: 'approved' })
    return this.findOne(id)
  }

  async reject(id: string) {
    await this.repo.update(id, { status: 'rejected' })
    return this.findOne(id)
  }

  async incrementUse(id: string) {
    await this.repo.increment({ id }, 'use_count', 1)
  }

  remove(id: string) {
    return this.repo.delete(id)
  }

  findPending() {
    return this.repo.find({ where: { status: 'pending' }, order: { created_at: 'ASC' } })
  }

  findByDesigner(designer_id: string) {
    return this.repo.find({ where: { designer_id }, order: { created_at: 'DESC' } })
  }
}