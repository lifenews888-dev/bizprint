import { ReferralService } from './referral.service';
export declare class ReferralController {
    private svc;
    constructor(svc: ReferralService);
    getMyReferral(req: any): Promise<import("./referral.entity").Referral>;
    getStats(userId: string): Promise<{
        code: any;
        total_commission: number;
        referral_count: number;
        commission_rate?: undefined;
        is_active?: undefined;
    } | {
        code: string;
        commission_rate: number;
        total_commission: number;
        referral_count: number;
        is_active: boolean;
    }>;
    findByCode(code: string): Promise<import("./referral.entity").Referral>;
}
