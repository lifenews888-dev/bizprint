import { Product } from './product.entity';
import { Variant } from '../variants/variant.entity';
export declare class ProductVariant {
    id: string;
    product: Product;
    variant: Variant;
    base_price: number;
    is_default: boolean;
    created_at: Date;
}
