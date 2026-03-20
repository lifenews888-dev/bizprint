import { PricingCatalogService } from './pricing-catalog.service';
import { QuoteRequest, QuoteResponse } from './pricing-catalog.interfaces';
export declare class PricingCatalogController {
    private readonly svc;
    constructor(svc: PricingCatalogService);
    quote(body: QuoteRequest): QuoteResponse;
}
