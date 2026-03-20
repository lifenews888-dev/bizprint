import { Repository } from 'typeorm';
import { DeliveryWebhook } from './delivery-webhook.entity';
export declare class WebhookService {
    private repo;
    private readonly logger;
    constructor(repo: Repository<DeliveryWebhook>);
    register(data: {
        name: string;
        url: string;
        secret?: string;
        events?: string[];
        provider?: string;
        config?: Record<string, any>;
    }): Promise<DeliveryWebhook>;
    findAll(): Promise<DeliveryWebhook[]>;
    update(id: number, data: Partial<DeliveryWebhook>): Promise<DeliveryWebhook>;
    remove(id: number): Promise<{
        deleted: boolean;
    }>;
    trigger(event: string, payload: any): Promise<void>;
    private sendWebhook;
}
