export declare class SheetOptimizerService {
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
