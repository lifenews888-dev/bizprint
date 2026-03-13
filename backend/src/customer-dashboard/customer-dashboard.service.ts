import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class CustomerDashboardService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  async getOrders(customerId: string) {
    return this.orderRepo.find({
      where: { customer_id: customerId },
      order: { created_at: 'DESC' },
    });
  }

  async getPayments(customerId: string) {
    return [];
  }

  async getProductionStatus(customerId: string) {
    return [];
  }
}