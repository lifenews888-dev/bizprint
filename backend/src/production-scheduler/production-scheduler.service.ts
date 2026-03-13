import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductionSchedulerService {
  async scheduleOrder(orderId: string) {
    return {
      message: 'Order scheduled',
      order_id: orderId,
      status: 'queued',
    };
  }
}