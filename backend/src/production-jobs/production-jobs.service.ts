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
      order: { start_time: 'DESC' },
    })
  }

  async updateStatus(id: string, status: ProductionStatus) {
    const job = await this.repo.findOne({ where: { id } })
    if (!job) throw new NotFoundException('Job not found')
    job.status = status
    await this.repo.save(job)

    // If job completed -> update order status to completed
    if (status === ProductionStatus.COMPLETED && job.order_id) {
      try {
        const orderRepo = this.repo.manager.getRepository(Order)
        await orderRepo.update(job.order_id, { status: OrderStatus.COMPLETED })
      } catch (e) {
        console.log('Order status update error:', e.message)
      }
    }

    return job
  }

  async createFromOrder(orderId: string) {
    // Check if job already exists for this order
    const existing = await this.repo.findOne({
      where: { order_id: orderId },
    })
    if (existing) return existing

    const job = this.repo.create({
      order_id: orderId,
      status: ProductionStatus.QUEUED,
    })
    return this.repo.save(job)
  }
}
