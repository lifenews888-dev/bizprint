import { OrdersService } from './orders.service';
export declare class OrdersController {
    private ordersService;
    constructor(ordersService: OrdersService);
    createOrder(body: any): Promise<import("./order.entity").Order>;
    updateStatus(id: string, status: string): Promise<import("./order.entity").Order>;
}
