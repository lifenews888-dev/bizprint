import { Product } from '../products/product.entity';
export declare enum AttributeType {
    SELECT = "select",
    NUMBER = "number",
    DIMENSIONS = "dimensions",
    CHECKBOX = "checkbox",
    TEXT = "text"
}
export declare class ProductAttribute {
    id: string;
    product_id: string;
    product: Product;
    name: string;
    name_mn: string;
    type: string;
    options: any;
    unit: string;
    default_value: string;
    required: boolean;
    sort_order: number;
}
