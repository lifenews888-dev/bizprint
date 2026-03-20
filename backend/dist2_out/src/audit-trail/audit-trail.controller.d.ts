import { AuditTrailService } from './audit-trail.service';
export declare class AuditTrailController {
    private service;
    constructor(service: AuditTrailService);
    create(body: {
        order_id: string;
        user: string;
        action: string;
        file?: string;
    }): Promise<import("./audit-trail.entity").AuditTrail>;
    bulkCreate(body: {
        entries: {
            order_id: string;
            user: string;
            action: string;
            file?: string;
        }[];
    }): Promise<import("./audit-trail.entity").AuditTrail[]>;
    getByOrder(orderId: string): Promise<import("./audit-trail.entity").AuditTrail[]>;
}
