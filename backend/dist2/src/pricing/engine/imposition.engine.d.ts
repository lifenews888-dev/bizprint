export interface ImpositionInput {
    sheet_width_mm: number;
    sheet_height_mm: number;
    product_width_mm: number;
    product_height_mm: number;
    bleed_mm?: number;
}
export interface ImpositionResult {
    per_sheet: number;
    columns: number;
    rows: number;
    rotated: boolean;
}
export declare class ImpositionEngine {
    static calculate(input: ImpositionInput): ImpositionResult;
}
