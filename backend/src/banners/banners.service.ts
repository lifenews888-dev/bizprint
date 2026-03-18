import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './banner.entity';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private repo: Repository<Banner>,
  ) {}

  findAll() {
    return this.repo.find({ order: { order: 'ASC' } });
  }

  findActive() {
    return this.repo.find({ where: { isActive: true }, order: { order: 'ASC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Banner>) {
    const banner = this.repo.create(data);
    return this.repo.save(banner);
  }

  async update(id: number, data: Partial<Banner>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { success: true };
  }
}