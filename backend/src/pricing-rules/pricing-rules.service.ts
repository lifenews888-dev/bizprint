import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingRule } from './pricing-rule.entity';

@Injectable()
export class PricingRulesService {
  constructor(
    @InjectRepository(PricingRule)
    private repo: Repository<PricingRule>,
  ) {}

  findAll() {
    return this.repo.find({ order: { attribute_key: 'ASC' } });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<PricingRule>) {
    const rule = this.repo.create(data);
    return this.repo.save(rule);
  }

  async update(id: string, data: Partial<PricingRule>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}