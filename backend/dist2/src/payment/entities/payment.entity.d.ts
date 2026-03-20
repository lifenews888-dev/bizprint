export declare class Payment {
    id: string;
    order_id: string;
    customer_id: string;
    amount: number;
    provider: string;
    invoice_code: string;
    status: string;
    transaction_id: string;
    paid_at: Date;
    created_at: Date;
    updated_at: Date;
}
