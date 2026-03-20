import { QuoteService } from './quote.service';
export declare class QuoteController {
    private readonly quoteService;
    constructor(quoteService: QuoteService);
    analyze(body: {
        fileUrl: string;
        quantity: number;
    }): Promise<{
        specs: {
            pages: number;
            size: string;
            color: string;
        };
        machine: {
            type: string;
            speed: number;
        };
        price: {
            materialCost: number;
            machineCost: number;
            laborCost: number;
            total: number;
        };
    }>;
}
