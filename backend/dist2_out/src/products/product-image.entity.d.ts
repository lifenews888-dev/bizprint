import { Product } from './product.entity';
export declare class ProductImage {
    id: string;
    product_id: string;
    product: Product;
    url: string;
    alt: string;
    sort_order: number;
    is_primary: boolean;
    created_at: Date;
}
