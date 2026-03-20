import { User } from '../../users/user.entity';
import { Product } from '../../products/product.entity';
export declare enum OrderStatus {
    PENDING = "pending",
    PAID = "paid",
    SCHEDULED = "scheduled",
    IN_PRODUCTION = "in_production",
    COMPLETED = "completed",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export declare class Order {
    id: string;
    customer_id: string;
    customer: User;
    product_id: string;
    product: Product;
    quote_id: string;
    quote_number: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    product_name: string;
    quantity: number;
    width_mm: number;
    height_mm: number;
    paper_gsm: number;
    color_mode: string;
    sides: string;
    finishing: string;
    factory_id: string;
    unit_price: number;
    total_price: number;
    options: Record<string, string>;
    notes: string;
    status: string;
    payment_status: string;
    payment_method: string;
    invoice_no: string;
    file_url: string;
    assigned_to: string;
    deadline: Date;
    created_at: Date;
    updated_at: Date;
}
