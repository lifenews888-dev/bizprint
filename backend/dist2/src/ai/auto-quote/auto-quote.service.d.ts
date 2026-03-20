import { ImpositionService } from '../imposition/imposition.service';
import { GangRunService } from '../gang-run/gang-run.service';
import { PrintCostService } from '../print-cost/print-cost.service';
export declare class AutoQuoteService {
    private readonly imposition;
    private readonly gangRun;
    private readonly printCost;
    constructor(imposition: ImpositionService, gangRun: GangRunService, printCost: PrintCostService);
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
