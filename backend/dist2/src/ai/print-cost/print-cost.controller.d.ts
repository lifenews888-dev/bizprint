import { PrintCostService } from './print-cost.service';
export declare class PrintCostController {
    private readonly service;
    constructor(service: PrintCostService);
    calculate(body: any): {
        material_cost: number;
        machine_cost: number;
        base_cost: number;
        margin: number;
        final_price: number;
    };
}
