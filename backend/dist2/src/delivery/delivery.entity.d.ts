import { Order } from '../orders/entities/order.entity';
export declare enum DeliveryStatus {
    PENDING = "pending",
    ASSIGNED = "assigned",
    PICKED_UP = "picked_up",
    ON_THE_WAY = "on_the_way",
    IN_TRANSIT = "in_transit",
    DELIVERED = "delivered",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare class Delivery {
    id: number;
    order: Order;
    courier_id: number;
    courier_name: string;
    courier_phone: string;
    status: DeliveryStatus;
    address: string;
    note: string;
    estimated_at: Date;
    provider: string;
    provider_order_id: string;
    provider_tracking_url: string;
    provider_data: Record<string, any>;
    recipient_name: string;
    recipient_phone: string;
    lat: number;
    lng: number;
    created_at: Date;
    updated_at: Date;
}
