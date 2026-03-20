import { PricingCatalog, QuoteRequest, QuoteResponse } from './pricing-catalog.interfaces';
export declare class PricingCatalogService {
    private catalog;
    loadCatalog(): PricingCatalog;
    quote(req: QuoteRequest): QuoteResponse;
    private pickItem;
    private calcArea;
}
