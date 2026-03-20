export declare class ImpositionService {
    private calculateFit;
    calculate(sheetW: number, sheetH: number, itemW: number, itemH: number): {
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
