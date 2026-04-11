import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhitelabelConfig } from './whitelabel.entity';

@Injectable()
export class WhitelabelService {
  constructor(
    @InjectRepository(WhitelabelConfig)
    private repo: Repository<WhitelabelConfig>,
  ) {}

  findAll() {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findBySubdomain(subdomain: string) {
    return this.repo.findOne({ where: { subdomain, is_active: true } });
  }

  findByDomain(domain: string) {
    return this.repo.findOne({ where: { custom_domain: domain, is_active: true } });
  }

  create(data: Partial<WhitelabelConfig>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<WhitelabelConfig>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
}
