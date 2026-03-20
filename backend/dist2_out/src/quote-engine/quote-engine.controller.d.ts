import { QuoteEngineService } from './quote-engine.service';
export declare class QuoteEngineController {
    private readonly svc;
    constructor(svc: QuoteEngineService);
    calculate(body: any): Promise<{
        quantity: number;
        pages: number;
        size: string;
        width_mm: number;
        height_mm: number;
        color_mode: any;
        sides: any;
        paper_gsm: number;
        finishing: any;
        binding: any;
        sheets_per_copy: number;
        total_sheets: number;
        imposition_per_sheet: number;
        rotated: boolean;
        machine: string;
        machine_speed: number;
        machine_sheet: {
            w: number;
            h: number;
        };
        print_hours: number;
        paper_cost: number;
        print_cost: number;
        finishing_cost: number;
        binding_cost: number;
        setup_cost: number;
        subtotal: number;
        overhead: number;
        margin: number;
        total_price: number;
        unit_price: number;
        currency: string;
        breakdown: {
            paper_price_per_sheet: number;
            color_rate: number;
            hour_rate: number;
            print_hours: number;
            overhead_10pct: number;
            margin_20pct: number;
        };
    }>;
    fromPdf(file: Express.Multer.File, body: any): Promise<{
        quantity: number;
        pages: number;
        size: string;
        width_mm: number;
        height_mm: number;
        color_mode: any;
        sides: any;
        paper_gsm: number;
        finishing: any;
        binding: any;
        sheets_per_copy: number;
        total_sheets: number;
        imposition_per_sheet: number;
        rotated: boolean;
        machine: string;
        machine_speed: number;
        machine_sheet: {
            w: number;
            h: number;
        };
        print_hours: number;
        paper_cost: number;
        print_cost: number;
        finishing_cost: number;
        binding_cost: number;
        setup_cost: number;
        subtotal: number;
        overhead: number;
        margin: number;
        total_price: number;
        unit_price: number;
        currency: string;
        breakdown: {
            paper_price_per_sheet: number;
            color_rate: number;
            hour_rate: number;
            print_hours: number;
            overhead_10pct: number;
            margin_20pct: number;
        };
    }>;
}
