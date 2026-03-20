import { PrintQuoteService } from './print-quote.service';
import { CreatePrintQuoteDto } from './dto/create-print-quote.dto';
export declare class PrintQuoteController {
    private readonly service;
    constructor(service: PrintQuoteService);
    calculate(data: CreatePrintQuoteDto): {
        paper_cost: number;
        print_cost: number;
        total_price: number;
    };
}
