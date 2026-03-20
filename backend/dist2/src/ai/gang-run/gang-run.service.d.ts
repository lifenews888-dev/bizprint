type SheetItem = {
    order_id: number;
    qty: number;
};
export declare class GangRunService {
    optimize(orders: any[], sheetCapacity: number): {
        sheet_capacity: number;
        sheets: SheetItem[][];
        total_sheets: number;
    };
}
export {};
