import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Review } from './review.entity'

@Injectable()
export class ReviewsService {
  constructor(@InjectRepository(Review) private readonly repo: Repository<Review>) {}

  async create(data: Partial<Review>) {
    const review = this.repo.create({ ...data, is_approved: false })
    return this.repo.save(review)
  }

  async findApproved() {
    return this.repo.find({ where: { is_approved: true }, order: { created_at: 'DESC' } })
  }

  async findAll() {
    return this.repo.find({ order: { created_at: 'DESC' } })
  }

  async approve(id: string) {
    await this.repo.update(id, { is_approved: true })
    return { success: true }
  }

  async summary() {
    const reviews = await this.repo.find({ where: { is_approved: true } })
    const totalCount = reviews.length
    const avgRating = totalCount ? +(reviews.reduce((s, r) => s + r.rating, 0) / totalCount).toFixed(1) : 0
    const distribution = [1, 2, 3, 4, 5].map(n => ({ stars: n, count: reviews.filter(r => r.rating === n).length }))
    return { avgRating, totalCount, distribution }
  }
}
