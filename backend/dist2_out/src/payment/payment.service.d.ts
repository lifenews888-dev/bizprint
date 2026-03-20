import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { MailService } from '../mail/mail.service';
import { ProductionJobsService } from '../production-jobs/production-jobs.service';
export declare class PaymentService {
    private paymentRepo;
    private orderRepo;
    private mailService;
    private productionJobsService;
    constructor(paymentRepo: Repository<Payment>, orderRepo: Repository<Order>, mailService: MailService, productionJobsService: ProductionJobsService);
    createPayment(order_id: string, amount: number, customer_id: string): Promise<{
        payment_id: string;
        invoice_code: string;
        amount: number;
        currency: string;
        provider: string;
        status: string;
        qpay_url: string;
        qr_text: string;
        expires_at: string;
        message: string;
    }>;
    checkPayment(payment_id: string): Promise<{
        payment_id: string;
        invoice_code: string;
        amount: number;
        status: string;
        provider: string;
    }>;
    confirmPayment(invoice_code: string): Promise<{
        success: boolean;
        payment_id: string;
        invoice_code: string;
        order_id: string;
        order_status: string;
        status: string;
        message: string;
    }>;
    getPaymentsByCustomer(customer_id: string): Promise<Payment[]>;
}
