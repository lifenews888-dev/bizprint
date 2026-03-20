export declare enum QuoteStatus {
    DRAFT = "draft",
    SENT = "sent",
    CONFIRMED = "confirmed",
    ORDERED = "ordered",
    EXPIRED = "expired"
}
export declare class QuoteV2 {
    id: string;
    quote_number: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    product_name: string;
    product_description: string;
    quantity: number;
    pages: number;
    size: string;
    width_mm: number;
    height_mm: number;
    paper_type: string;
    paper_gsm: number;
    color_mode: string;
    sides: string;
    finishing: string;
    binding: string;
    unit_price: number;
    total_price: number;
    breakdown: any;
    status: string;
    valid_until: Date;
    notes: string;
    email_sent: boolean;
    daily_report_sent: boolean;
    created_at: Date;
    updated_at: Date;
}
