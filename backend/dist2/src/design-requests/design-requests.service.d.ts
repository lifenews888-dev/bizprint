import { Repository } from 'typeorm';
import { DesignRequest } from './design-request.entity';
import { MailService } from '../mail/mail.service';
import { WalletService } from '../wallet/wallet.service';
import { SettingsService } from '../settings/settings.service';
export declare class DesignRequestsService {
    private repo;
    private mailService;
    private walletService;
    private settingsService;
    constructor(repo: Repository<DesignRequest>, mailService: MailService, walletService: WalletService, settingsService: SettingsService);
    findAll(): Promise<DesignRequest[]>;
    findByOrder(order_id: string): Promise<DesignRequest[]>;
    findByDesigner(designer_id: string): Promise<DesignRequest[]>;
    findByCustomer(customer_id: string): Promise<DesignRequest[]>;
    findPending(): Promise<DesignRequest[]>;
    findOne(id: string): Promise<DesignRequest>;
    create(data: Partial<DesignRequest>): Promise<DesignRequest>;
    assign(id: string, designerId: string, designerName: string, designerPhone?: string, designerZoom?: string): Promise<DesignRequest>;
    submitFile(id: string, fileUrl: string, previewUrl?: string): Promise<DesignRequest>;
    approve(id: string): Promise<DesignRequest>;
    reject(id: string, reason: string): Promise<DesignRequest>;
    update(id: string, data: Partial<DesignRequest>): Promise<DesignRequest>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
    private processDesignerPayment;
}
