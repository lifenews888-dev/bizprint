import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaperType } from './paper-type.entity';

@Injectable()
export class PaperTypesService {
  constructor(
    @InjectRepository(PaperType)
    private repo: Repository<PaperType>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC', gsm: 'ASC' } });
  }

  findActive() {
    return this.repo.find({ where: { is_active: true }, order: { name: 'ASC', gsm: 'ASC' } });
  }

  create(data: Partial<PaperType>) {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }

  async update(id: string, data: Partial<PaperType>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}