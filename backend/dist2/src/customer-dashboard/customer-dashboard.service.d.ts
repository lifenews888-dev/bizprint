import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
export declare class CustomerDashboardService {
    private orderRepo;
    constructor(orderRepo: Repository<Order>);
    getOrders(customerId: string): Promise<Order[]>;
    getPayments(customerId: string): Promise<any[]>;
    getProductionStatus(customerId: string): Promise<any[]>;
}
