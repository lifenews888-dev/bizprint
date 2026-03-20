import { CreatePrintQuoteDto } from './dto/create-print-quote.dto';
export declare class PrintQuoteService {
    calculate(data: CreatePrintQuoteDto): {
        paper_cost: number;
        print_cost: number;
        total_price: number;
    };
}
