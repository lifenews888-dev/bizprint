import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { GalleryImage } from './gallery.entity'

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(GalleryImage)
    private readonly repo: Repository<GalleryImage>,
  ) {}

  async findAll(activeOnly = false) {
    const where: any = {}
    if (activeOnly) where.is_active = true
    return this.repo.find({ where, order: { sort_order: 'ASC', created_at: 'DESC' } })
  }

  async findRecent(limit = 6) {
    return this.repo.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
      take: limit,
    })
  }

  async findOne(id: string) {
    const img = await this.repo.findOne({ where: { id } })
    if (!img) throw new NotFoundException('Зураг олдсонгүй')
    return img
  }

  async create(data: Partial<GalleryImage>) {
    if (!data?.url || typeof data.url !== 'string' || !data.url.trim()) {
      throw new BadRequestException('Зургийн url заавал байх ёстой')
    }
    const maxSort = await this.repo.maximum('sort_order') || 0
    const img = this.repo.create({ ...data, sort_order: maxSort + 1 })
    return this.repo.save(img)
  }

  async update(id: string, data: Partial<GalleryImage>) {
    await this.repo.update(id, data)
    return this.findOne(id)
  }

  async remove(id: string) {
    const img = await this.findOne(id)
    await this.repo.remove(img)
    return { deleted: true, public_id: img.public_id }
  }

  async reorder(ids: string[]) {
    for (let i = 0; i < ids.length; i++) {
      await this.repo.update(ids[i], { sort_order: i })
    }
    return { reordered: true }
  }
}
