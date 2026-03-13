import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepo: Repository<Order>,
  ) {}

  async createOrder(data: Partial<Order>) {
    const order = this.ordersRepo.create({
      ...data,
      status: OrderStatus.PENDING,
    });
    return this.ordersRepo.save(order);
  }

  async getOrders() {
    return this.ordersRepo.find({
      order: { created_at: 'DESC' },
    });
  }

  async getOrdersByCustomer(customer_id: string) {
    return this.ordersRepo.find({
      where: { customer_id },
      order: { created_at: 'DESC' },
    });
  }

  async getOrderById(id: string) {
    const order = await this.ordersRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Захиалга олдсонгүй');
    return order;
  }

  async cancelOrder(id: string) {
    const order = await this.getOrderById(id);
    order.status = OrderStatus.CANCELLED;
    return this.ordersRepo.save(order);
  }
}