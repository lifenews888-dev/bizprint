import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProductionJob, ProductionJobStatus } from './production-job.entity'
import { Order, OrderStatus } from '../orders/entities/order.entity'

@Injectable()
export class ProductionJobsService {
  constructor(
    @InjectRepository(ProductionJob)
    private repo: Repository<ProductionJob>,
  ) {}

  findAll() {
    return this.repo.find({
      relations: ['order', 'order.customer'],
      order: { created_at: 'DESC' },
    })
  }

  async updateStatus(id: number, status: ProductionJobStatus) {
    const job = await this.repo.findOne({ where: { id }, relations: ['order'] })
    if (!job) throw new NotFoundException('Job not found')
    job.status = status
    await this.repo.save(job)

    // If job completed -> update order status to completed
    if (status === ProductionJobStatus.COMPLETED && job.order) {
      try {
        const orderRepo = this.repo.manager.getRepository(Order)
        await orderRepo.update(job.order.id, { status: OrderStatus.COMPLETED })
      } catch (e) {
        console.log('Order status update error:', e.message)
      }
    }

    return job
  }

  async createFromOrder(orderId: string | number) {
    const id = String(orderId)
    // Check if job already exists for this order
    const existing = await this.repo.findOne({
      where: { order: { id: id } as any },
      relations: ['order'],
    })
    if (existing) return existing

    const job = this.repo.create({
      order: { id: id } as any,
      status: ProductionJobStatus.PENDING,
    })
    return this.repo.save(job)
  }
}
