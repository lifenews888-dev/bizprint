import { Product } from '../products/product.entity';
export declare class PricingRule {
    id: string;
    product_id: string;
    product: Product;
    category_id: string;
    attribute_key: string;
    attribute_value: string;
    price_multiplier: number;
    price_addition: number;
    price_override: number;
    min_quantity: number;
    is_active: boolean;
}
