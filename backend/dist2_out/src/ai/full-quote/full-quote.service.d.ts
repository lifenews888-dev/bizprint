import { PdfInspectorService } from '../pdf-inspector/pdf-inspector.service';
import { PrintSizeService } from '../print-size/print-size.service';
import { ImpositionService } from '../imposition/imposition.service';
import { GangRunService } from '../gang-run/gang-run.service';
import { MachineSelectorService } from '../machine-selector/machine-selector.service';
import { PrintCostService } from '../print-cost/print-cost.service';
export declare class FullQuoteService {
    private readonly pdfInspector;
    private readonly printSize;
    private readonly imposition;
    private readonly gangRun;
    private readonly machineSelector;
    private readonly printCost;
    constructor(pdfInspector: PdfInspectorService, printSize: PrintSizeService, imposition: ImpositionService, gangRun: GangRunService, machineSelector: MachineSelectorService, printCost: PrintCostService);
    calculate(file: any): Promise<{
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
