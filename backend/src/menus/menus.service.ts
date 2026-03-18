import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './menu.entity';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu)
    private repo: Repository<Menu>,
  ) {}

  findAll() {
    return this.repo.find({ order: { order: 'ASC' } });
  }

  findByLocation(location: string) {
    return this.repo.find({
      where: { location, isActive: true },
      order: { order: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Menu>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Menu>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { success: true };
  }

  async bulkUpdate(items: Partial<Menu>[]) {
    for (const item of items) {
      if (item.id) await this.repo.update(item.id, item);
    }
    return this.findAll();
  }
}