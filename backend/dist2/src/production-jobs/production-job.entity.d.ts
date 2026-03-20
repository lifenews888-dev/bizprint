import { Order } from '../orders/entities/order.entity';
export declare enum ProductionJobStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare class ProductionJob {
    id: number;
    status: ProductionJobStatus;
    notes: string;
    order: Order;
    created_at: Date;
    updated_at: Date;
}
