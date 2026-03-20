import { CustomerDashboardService } from './customer-dashboard.service';
export declare class CustomerDashboardController {
    private readonly service;
    constructor(service: CustomerDashboardService);
    getOrders(customerId: string): Promise<import("../orders/entities/order.entity").Order[]>;
    getPayments(customerId: string): Promise<any[]>;
    getProduction(customerId: string): Promise<any[]>;
}
