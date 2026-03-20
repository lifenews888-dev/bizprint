export declare class DeliveryWebhook {
    id: number;
    name: string;
    url: string;
    secret: string;
    is_active: boolean;
    events: string[];
    provider: string;
    config: Record<string, any>;
    failure_count: number;
    last_triggered_at: Date;
    created_at: Date;
    updated_at: Date;
}
