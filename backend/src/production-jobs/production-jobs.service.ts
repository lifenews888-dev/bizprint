import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProductionJob, ProductionStatus } from '../production/entities/production-job.entity'
import { Order, OrderStatus } from '../orders/entities/order.entity'

@Injectable()
export class ProductionJobsService {
  constructor(
    @InjectRepository(ProductionJob)
    private repo: Repository<ProductionJob>,
  ) {}

  findAll() {
    return this.repo.find({
      relations: ['stages'],
      order: { createdAt: 'DESC' },
    })
  }

  async updateStatus(id: string, status: ProductionStatus) {
    const job = await this.repo.findOne({ where: { id } })
    if (!job) throw new NotFoundException('Job not found')
    job.status = status
    await this.repo.save(job)

    // If job completed -> update order status to completed
    if (status === ProductionStatus.COMPLETED && job.orderId) {
      try {
        const orderRepo = this.repo.manager.getRepository(Order)
        await orderRepo.update(job.orderId, { status: OrderStatus.COMPLETED })
      } catch (e) {
        console.log('Order status update error:', e.message)
      }
    }

    return job
  }

  async createFromOrder(orderId: string) {
    // Check if job already exists for this order
    const existing = await this.repo.findOne({
      where: { orderId },
    })
    if (existing) return existing

    const job = this.repo.create({
      orderId,
      status: ProductionStatus.QUEUED,
    })
    return this.repo.save(job)
  }
}
