import { User } from '../users/user.entity';
export declare class Referral {
    id: string;
    code: string;
    sales_user_id: string;
    sales_user: User;
    referred_user_id: string;
    referred_user: User;
    commission_rate: number;
    total_commission: number;
    is_active: boolean;
    created_at: Date;
}
