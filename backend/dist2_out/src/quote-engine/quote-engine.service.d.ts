import { Repository } from 'typeorm';
import { Machine } from '../machines/machine.entity';
export declare class QuoteEngineService {
    private machineRepo;
    constructor(machineRepo: Repository<Machine>);
    calculateFromPdf(file: Express.Multer.File, input: any): Promise<{
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
    calculate(input: any): Promise<{
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
    detectSize(w: number, h: number): "A5" | "A4" | "A3" | "BusinessCard" | "Custom";
    private computeSheetFit;
    getPaperPrice(gsm: number): 60 | 220 | 35 | 45 | 85 | 110 | 145 | 180;
    getFinishingCost(finishing: string, quantity: number): number;
    getBindingCost(binding: string, quantity: number): number;
    selectBestMachine(params: {
        quantity: number;
        width_mm: number;
        height_mm: number;
        color_mode: string;
    }): Promise<{
        machine: Machine;
        bestFit: number;
        rotated: boolean;
    }>;
}
