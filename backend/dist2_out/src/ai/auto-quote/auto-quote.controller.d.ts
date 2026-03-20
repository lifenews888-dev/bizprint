import { AutoQuoteService } from './auto-quote.service';
export declare class AutoQuoteController {
    private readonly service;
    constructor(service: AutoQuoteService);
    calculate(body: any): {
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
        cost: {
            material_cost: number;
            machine_cost: number;
            base_cost: number;
            margin: number;
            final_price: number;
        };
    };
}
