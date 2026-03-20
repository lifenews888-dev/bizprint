import { Repository } from 'typeorm';
import { AuditTrail } from './audit-trail.entity';
export declare class AuditTrailService {
    private repo;
    constructor(repo: Repository<AuditTrail>);
    create(data: {
        order_id: string;
        user: string;
        action: string;
        file?: string;
    }): Promise<AuditTrail>;
    getByOrderId(orderId: string): Promise<AuditTrail[]>;
    bulkCreate(entries: {
        order_id: string;
        user: string;
        action: string;
        file?: string;
    }[]): Promise<AuditTrail[]>;
}
