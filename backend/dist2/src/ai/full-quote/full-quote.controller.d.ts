import { FullQuoteService } from './full-quote.service';
export declare class FullQuoteController {
    private readonly service;
    constructor(service: FullQuoteService);
    quote(file: Express.Multer.File): Promise<{
        pdf_analysis: import("../pdf-inspector/pdf-inspector.service").PreflightResult;
        size: {
            detected_size: string;
            width_mm: number;
            height_mm: number;
        };
        layout: {
            sheet: {
                width: number;
                height: number;
            };
            item: {
                width: number;
                height: number;
            };
            layouts: {
                normal: {
                    horizontal: number;
                    vertical: number;
                    total: number;
                    wasteArea: number;
                };
                rotated: {
                    horizontal: number;
                    vertical: number;
                    total: number;
                    wasteArea: number;
                };
            };
            best_layout: {
                orientation: string;
                horizontal_fit: number;
                vertical_fit: number;
                total_per_sheet: number;
                waste_area: number;
            };
        };
        gang_run: {
            sheet_capacity: number;
            sheets: {
                order_id: number;
                qty: number;
            }[][];
            total_sheets: number;
        };
        machine: {
            selected_machine: any;
            machine_type: any;
            estimated_cost: any;
        };
        cost: {
            material_cost: number;
            machine_cost: number;
            base_cost: number;
            margin: number;
            final_price: number;
        };
        price: number;
    }>;
}
