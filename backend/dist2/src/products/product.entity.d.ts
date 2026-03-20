export declare enum ProductType {
    PRINT = "print",
    READY = "ready"
}
export declare class Product {
    id: string;
    product_type: string;
    vendor_id: string;
    name: string;
    name_mn: string;
    slug: string;
    category: string;
    subcategory: string;
    description: string;
    base_price: number;
    min_quantity: number;
    max_quantity: number;
    lead_time_days: number;
    thumbnail_url: string;
    sale_price: number;
    stock_quantity: number;
    sku: string;
    is_active: boolean;
    sort_order: number;
    created_at: Date;
    updated_at: Date;
}
