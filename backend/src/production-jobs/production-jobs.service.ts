import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProductionJob, ProductionJobStatus } from './production-job.entity'
import { Order } from '../orders/entities/order.entity'
import { DeliveryService } from '../delivery/delivery.service'
import { NotificationService } from '../notifications/notification.service'

@Injectable()
export class ProductionJobsService {
  constructor(
    @InjectRepository(ProductionJob)
    private repo: Repository<ProductionJob>,
    private deliveryService: DeliveryService,
    private notificationService: NotificationService,
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

    // When job completes → update order + auto-create delivery + notify courier
    if (status === ProductionJobStatus.COMPLETED && job.order) {
      const order = job.order as Order

      // 1. Mark order as completed (production done, awaiting pickup)
      try {
        const orderRepo = this.repo.manager.getRepository(Order)
        await orderRepo.update(order.id, { status: 'completed' })
      } catch (e) {
        console.log('Order status update error:', (e as any).message)
      }

      // 2. Auto-create a delivery record so courier can see it
      try {
        await this.deliveryService.create({
          order: { id: order.id } as any,
          status: 'pending' as any,
          recipient_name:  order.customer_name  || undefined,
          recipient_phone: order.customer_phone || undefined,
          address: order.notes || undefined,   // checkout stores address in notes
        })
      } catch (e) {
        // Delivery may already exist — not a fatal error
        console.log('Delivery auto-create skipped:', (e as any).message)
      }

      // 3. Notify all couriers that a new delivery is ready
      try {
        await this.notificationService.create({
          user_id: 'courier',
          type: 'order',
          title: 'Шинэ хүргэлтийн захиалга',
          message: `${order.product_name || 'Захиалга'} — ${order.quantity}ш${order.customer_name ? ' · ' + order.customer_name : ''}`,
          data: { order_id: order.id, job_id: id },
        })
      } catch (e) {
        console.log('Courier notification error:', (e as any).message)
      }
    }

    return job
  }

  async createFromOrder(orderId: string | number) {
    const id = String(orderId)

    // Prevent duplicate jobs for the same order
    const existing = await this.repo.findOne({
      where: { order: { id } as any },
      relations: ['order'],
    })
    if (existing) return existing

    const job = this.repo.create({
      order: { id } as any,
      status: ProductionJobStatus.PENDING,
    })
    return this.repo.save(job)
  }
}
