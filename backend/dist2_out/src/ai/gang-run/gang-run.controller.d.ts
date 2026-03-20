import { GangRunService } from './gang-run.service';
export declare class GangRunController {
    private readonly service;
    constructor(service: GangRunService);
    optimize(body: any): {
        sheet_capacity: number;
        sheets: {
            order_id: number;
            qty: number;
        }[][];
        total_sheets: number;
    };
}
