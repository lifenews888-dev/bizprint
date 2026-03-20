import { PrintEngineService } from './print-engine.service';
export declare class PrintEngineController {
    private readonly service;
    constructor(service: PrintEngineService);
    run(body: any): {
        quote: {
            sheets: number;
            pages: any;
        };
        machine: string;
        gang: {
            sheet_usage: string;
        };
        production: {
            production_minutes: number;
        };
        price: {
            total_price: number;
        };
    };
}
