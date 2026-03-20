import { Repository } from 'typeorm';
import { Order } from './order.entity';
export declare class OrdersService {
    private orderRepo;
    constructor(orderRepo: Repository<Order>);
    createOrder(data: any): Promise<Order>;
    updateStatus(id: string, status: string): Promise<Order>;
}
