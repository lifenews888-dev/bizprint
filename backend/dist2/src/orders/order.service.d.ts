import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { AuditTrail } from '../audit-trail/audit-trail.entity';
import { MailService } from '../mail/mail.service';
export declare class OrdersService {
    private ordersRepo;
    private auditRepo;
    private mailService;
    constructor(ordersRepo: Repository<Order>, auditRepo: Repository<AuditTrail>, mailService: MailService);
    createOrder(data: any): Promise<Order>;
    createFromQuote(quoteId: string, userId: string, paymentMethod?: string): Promise<Order>;
    updateStatus(id: string, status: string): Promise<Order>;
    updateOrder(id: string, data: any): Promise<Order>;
    revertStatus(id: string, reason: string, user: string, targetStage?: string): Promise<Order>;
    getOrders(): Promise<Order[]>;
    getOrdersByCustomer(customer_id: string): Promise<Order[]>;
    getOrderById(id: string): Promise<Order>;
    cancelOrder(id: string): Promise<Order>;
}
