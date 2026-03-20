export declare class PrintEngineService {
    run(data: any): {
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
    calculateQuote(data: any): {
        sheets: number;
        pages: any;
    };
    selectMachine(data: any): "OFFSET" | "DIGITAL";
    optimizeGangRun(data: any): {
        sheet_usage: string;
    };
    scheduleProduction(data: any): {
        production_minutes: number;
    };
    calculatePrice(quote: any, production: any): {
        total_price: number;
    };
}
