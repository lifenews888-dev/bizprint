export declare enum MachineStatus {
    AVAILABLE = "available",
    BUSY = "busy",
    MAINTENANCE = "maintenance"
}
export declare class Machine {
    id: number;
    name: string;
    type: string;
    speed_per_hour: number;
    sheet_width_mm: number;
    sheet_height_mm: number;
    hour_rate: number;
    factory_id: number;
    status: MachineStatus;
    created_at: Date;
}
