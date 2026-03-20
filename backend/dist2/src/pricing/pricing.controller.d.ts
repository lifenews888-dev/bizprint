import { PricingService } from './pricing.service';
import type { QuoteInput } from './pricing.service';
export declare class PricingController {
    private readonly pricingService;
    constructor(pricingService: PricingService);
    calculateQuote(input: QuoteInput): Promise<import("./pricing.service").QuoteResult>;
}
