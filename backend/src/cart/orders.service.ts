import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Order } from './order.entity'

@Injectable()
export class OrdersService {

  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  async createOrder(data: any) {

    const order = this.orderRepo.create({
      customer_id: data.customer_id,
      total_amount: data.total_amount,
      status: 'confirmed',
    })

    return this.orderRepo.save(order)
  }

  async updateStatus(id: string, status: string) {

    await this.orderRepo.update(id, { status })

    return this.orderRepo.findOne({ where: { id } })
  }
}