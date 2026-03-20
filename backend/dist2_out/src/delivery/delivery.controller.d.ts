import { DeliveryService } from './delivery.service';
import { WebhookService } from './webhook.service';
import { DeliveryStatus } from './delivery.entity';
export declare class DeliveryController {
    private readonly service;
    private readonly webhookService;
    constructor(service: DeliveryService, webhookService: WebhookService);
    findAll(): Promise<import("./delivery.entity").Delivery[]>;
    findByOrder(orderId: string): Promise<import("./delivery.entity").Delivery>;
    getTracking(id: number): Promise<{
        id: number;
        status: DeliveryStatus;
        courier_name: string;
        courier_phone: string;
        provider: string;
        tracking_url: string;
        estimated_at: Date;
        lat: number;
        lng: number;
        address: string;
        created_at: Date;
        updated_at: Date;
    }>;
    create(body: any): Promise<import("./delivery.entity").Delivery>;
    updateStatus(id: number, status: DeliveryStatus): Promise<import("./delivery.entity").Delivery>;
    providerAssign(body: {
        order_id: string;
        provider: string;
        provider_order_id: string;
        provider_tracking_url?: string;
        provider_data?: Record<string, any>;
        courier_name?: string;
        courier_phone?: string;
        estimated_at?: string;
    }): Promise<import("./delivery.entity").Delivery>;
    providerCallback(body: {
        provider_order_id: string;
        status: string;
        courier_name?: string;
        courier_phone?: string;
        lat?: number;
        lng?: number;
        note?: string;
        estimated_at?: string;
    }): Promise<import("./delivery.entity").Delivery>;
    listWebhooks(): Promise<import("./delivery-webhook.entity").DeliveryWebhook[]>;
    registerWebhook(body: {
        name: string;
        url: string;
        secret?: string;
        events?: string[];
        provider?: string;
        config?: Record<string, any>;
    }): Promise<import("./delivery-webhook.entity").DeliveryWebhook>;
    updateWebhook(id: number, body: any): Promise<import("./delivery-webhook.entity").DeliveryWebhook>;
    deleteWebhook(id: number): Promise<{
        deleted: boolean;
    }>;
    testWebhook(id: number): Promise<{
        error: string;
        success?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        error?: undefined;
    }>;
}
