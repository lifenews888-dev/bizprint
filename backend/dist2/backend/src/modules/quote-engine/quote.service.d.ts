import { ParserService } from './parser.service';
import { PricingService } from './pricing.service';
import { MachineService } from './machine.service';
export declare class QuoteService {
    private parser;
    private pricing;
    private machine;
    constructor(parser: ParserService, pricing: PricingService, machine: MachineService);
    analyze(fileUrl: string, quantity: number): Promise<{
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
