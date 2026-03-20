import { PaymentService } from './payment.service';
export declare class PaymentController {
    private readonly paymentService;
    private readonly BASE_URL;
    private readonly USERNAME;
    private readonly PASSWORD;
    private readonly TERMINAL_ID;
    constructor(paymentService: PaymentService);
    private getToken;
    createInvoice(body: {
        amount: number;
        orderId: string;
    }): Promise<any>;
    getStatus(invoiceNo: string): Promise<any>;
    callback(body: any): Promise<{
        success: boolean;
        result: {
            success: boolean;
            payment_id: string;
            invoice_code: string;
            order_id: string;
            order_status: string;
            status: string;
            message: string;
        };
        msg?: undefined;
    } | {
        success: boolean;
        msg: any;
        result?: undefined;
    }>;
}
