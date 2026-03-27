import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingCampaign } from './marketing-campaign.entity';

@Injectable()
export class MarketingService {
  constructor(
    @InjectRepository(MarketingCampaign)
    private repo: Repository<MarketingCampaign>,
  ) {}

  findAll() {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  create(data: Partial<MarketingCampaign>) {
    const campaign = this.repo.create(data);
    return this.repo.save(campaign);
  }

  async update(id: string, data: Partial<MarketingCampaign>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { success: true };
  }
}
