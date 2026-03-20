import { SheetOptimizerService } from './sheet-optimizer.service';
export declare class SheetOptimizerController {
    private readonly service;
    constructor(service: SheetOptimizerService);
    optimize(body: any): {
        layout: {
            orientation: string;
            cols: number;
            rows: number;
            total: number;
        };
        waste_percent: number;
    };
}
