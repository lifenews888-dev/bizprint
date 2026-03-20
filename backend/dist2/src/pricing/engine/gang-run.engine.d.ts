export interface GangOrder {
    id: string;
    width_mm: number;
    height_mm: number;
    quantity: number;
}
export interface GangPlacement {
    order_id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface GangSheet {
    sheet_index: number;
    placements: GangPlacement[];
}
export interface GangInput {
    sheet_width_mm: number;
    sheet_height_mm: number;
    orders: GangOrder[];
}
export declare class GangRunEngine {
    static optimize(input: GangInput): GangSheet[];
}
