import { User } from '../users/user.entity';
export declare class Wallet {
    id: string;
    user_id: string;
    user: User;
    balance: number;
    total_earned: number;
    total_withdrawn: number;
    created_at: Date;
}
export declare class WalletTransaction {
    id: string;
    wallet_id: string;
    wallet: Wallet;
    type: string;
    source: string;
    amount: number;
    balance_after: number;
    reference_id: string;
    note: string;
    status: string;
    bank_name: string;
    bank_account: string;
    bank_account_name: string;
    reject_reason: string;
    created_at: Date;
}
