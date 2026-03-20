import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { PricingRule } from '../pricing-rules/pricing-rule.entity';
export interface QuoteInput {
    product_id: string;
    quantity: number;
    options?: Record<string, string>;
    rush?: boolean;
    delivery?: boolean;
}
export interface QuoteResult {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    setup_fee: number;
    subtotal: number;
    platform_margin: number;
    delivery_fee: number;
    total: number;
    currency: string;
    valid_until: string;
    breakdown: Record<string, any>;
}
export declare class PricingService {
    private productRepo;
    private rulesRepo;
    constructor(productRepo: Repository<Product>, rulesRepo: Repository<PricingRule>);
    calculateQuote(input: QuoteInput): Promise<QuoteResult>;
}
