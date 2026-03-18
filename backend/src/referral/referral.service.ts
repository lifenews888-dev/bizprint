import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Referral } from './referral.entity'

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(Referral)
    private repo: Repository<Referral>
  ) {}

  async getOrCreate(userId: string): Promise<Referral> {
    let ref = await this.repo.findOne({ where: { sales_user_id: userId } })
    if (!ref) {
      const code = userId.slice(0, 8).toUpperCase()
      ref = this.repo.create({ sales_user_id: userId, code, commission_rate: 10 })
      await this.repo.save(ref)
    }
    return ref
  }

  async getStats(userId: string) {
    const ref = await this.repo.findOne({ where: { sales_user_id: userId } })
    if (!ref) return { code: null, total_commission: 0, referral_count: 0 }
    const count = await this.repo.count({ where: { code: ref.code } })
    return {
      code: ref.code,
      commission_rate: ref.commission_rate,
      total_commission: ref.total_commission,
      referral_count: count,
      is_active: ref.is_active,
    }
  }

  async findByCode(code: string) {
    return this.repo.findOne({ where: { code } })
  }
}