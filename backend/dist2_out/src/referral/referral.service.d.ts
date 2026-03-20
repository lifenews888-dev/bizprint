import { Repository } from 'typeorm';
import { Referral } from './referral.entity';
export declare class ReferralService {
    private repo;
    constructor(repo: Repository<Referral>);
    getOrCreate(userId: string): Promise<Referral>;
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
    findByCode(code: string): Promise<Referral>;
}
