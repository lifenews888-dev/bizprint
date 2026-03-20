import { PriceService } from './price.service';
export declare class PriceController {
    private priceService;
    constructor(priceService: PriceService);
    printQuote(data: {
        paper_id: string;
        size_id: string;
        machine_id: string;
        quantity: number;
        colors: number;
        finish_ids: string[];
    }): Promise<{
        machine: string;
        sheet_capacity: number;
        sheets_needed: number;
        paper_cost: number;
        machine_cost: number;
        production_cost: number;
        unit_price: number;
        total_price: number;
        waste_percent: number;
    }>;
}
