import { Repository } from 'typeorm';
import { Delivery, DeliveryStatus } from './delivery.entity';
import { MailService } from '../mail/mail.service';
import { WalletService } from '../wallet/wallet.service';
import { SettingsService } from '../settings/settings.service';
import { WebhookService } from './webhook.service';
export declare class DeliveryService {
    private repo;
    private mailService;
    private walletService;
    private settingsService;
    private webhookService;
    private readonly logger;
    constructor(repo: Repository<Delivery>, mailService: MailService, walletService: WalletService, settingsService: SettingsService, webhookService: WebhookService);
    findAll(): Promise<Delivery[]>;
    findByOrder(orderId: number): Promise<Delivery>;
    findOne(id: number): Promise<Delivery>;
    create(data: Partial<Delivery>): Promise<Delivery>;
    updateStatus(id: number, status: DeliveryStatus): Promise<Delivery>;
    createFromProvider(data: {
        order_id: string;
        provider: string;
        provider_order_id: string;
        provider_tracking_url?: string;
        provider_data?: Record<string, any>;
        courier_name?: string;
        courier_phone?: string;
        estimated_at?: string;
    }): Promise<Delivery>;
    providerCallback(providerOrderId: string, data: {
        status: string;
        courier_name?: string;
        courier_phone?: string;
        lat?: number;
        lng?: number;
        note?: string;
        estimated_at?: string;
    }): Promise<Delivery>;
    getTracking(deliveryId: number): Promise<{
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
    private processCourierPayment;
}
