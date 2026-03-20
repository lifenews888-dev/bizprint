import { ImpositionService } from './imposition.service';
export declare class ImpositionController {
    private readonly service;
    constructor(service: ImpositionService);
    calculate(body: any): {
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
}
