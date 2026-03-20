import { OrdersService } from './order.service';
export declare class OrdersController {
    private ordersService;
    constructor(ordersService: OrdersService);
    create(body: any): Promise<import("./entities/order.entity").Order>;
    createFromQuote(body: {
        quote_id: string;
        payment_method?: string;
    }, req: any): Promise<import("./entities/order.entity").Order>;
    getAll(): Promise<import("./entities/order.entity").Order[]>;
    getByCustomer(customer_id: string): Promise<import("./entities/order.entity").Order[]>;
    getOne(id: string): Promise<import("./entities/order.entity").Order>;
    updateStatus(id: string, body: any): Promise<import("./entities/order.entity").Order>;
    revertStatus(id: string, body: {
        reason: string;
        target_stage?: string;
    }, req: any): Promise<import("./entities/order.entity").Order>;
    cancel(id: string): Promise<import("./entities/order.entity").Order>;
}
