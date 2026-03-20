import { QuoteService } from './quote.service';
export declare class QuoteController {
    private quoteService;
    constructor(quoteService: QuoteService);
    createQuote(body: any): {
        quantity: any;
        materialCost: number;
        setupCost: number;
        total: number;
    };
}
