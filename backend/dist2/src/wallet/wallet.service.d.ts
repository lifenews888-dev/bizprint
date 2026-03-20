import { Repository } from 'typeorm';
import { Wallet, WalletTransaction } from './wallet.entity';
export declare class WalletService {
    private walletRepo;
    private txRepo;
    constructor(walletRepo: Repository<Wallet>, txRepo: Repository<WalletTransaction>);
    getOrCreate(userId: string): Promise<Wallet>;
    getBalance(userId: string): Promise<{
        balance: number;
        total_earned: number;
        total_withdrawn: number;
    }>;
    credit(userId: string, amount: number, source: string, referenceId?: string, note?: string): Promise<WalletTransaction>;
    debit(userId: string, amount: number, source: string, referenceId?: string, note?: string): Promise<WalletTransaction>;
    requestWithdraw(userId: string, amount: number, note?: string, bankName?: string, bankAccount?: string, bankAccountName?: string): Promise<WalletTransaction>;
    approveWithdraw(txId: string): Promise<{
        success: boolean;
    }>;
    rejectWithdraw(txId: string, reason: string): Promise<{
        success: boolean;
    }>;
    getTransactions(userId: string): Promise<WalletTransaction[]>;
    getAllWithdrawRequests(): Promise<WalletTransaction[]>;
}
