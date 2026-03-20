import { WalletService } from './wallet.service';
export declare class WalletController {
    private svc;
    constructor(svc: WalletService);
    getBalance(req: any): Promise<{
        balance: number;
        total_earned: number;
        total_withdrawn: number;
    }>;
    getTransactions(req: any): Promise<import("./wallet.entity").WalletTransaction[]>;
    requestWithdraw(req: any, body: {
        amount: number;
        note?: string;
        bank_name?: string;
        bank_account?: string;
        bank_account_name?: string;
    }): Promise<import("./wallet.entity").WalletTransaction>;
    getAllWithdrawRequests(): Promise<import("./wallet.entity").WalletTransaction[]>;
    approveWithdraw(id: string): Promise<{
        success: boolean;
    }>;
    rejectWithdraw(id: string, body: {
        reason: string;
    }): Promise<{
        success: boolean;
    }>;
}
