export declare enum ProductionStatus {
    QUEUED = "queued",
    ASSIGNED = "assigned",
    PRINTING = "printing",
    FINISHING = "finishing",
    COMPLETED = "completed"
}
export declare class ProductionJob {
    id: string;
    order_id: string;
    machine_id: string;
    vendor_id: string;
    status: ProductionStatus;
    start_time: Date;
    end_time: Date;
}
