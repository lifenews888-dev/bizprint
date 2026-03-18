import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet, WalletTransaction } from './wallet.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction) private txRepo: Repository<WalletTransaction>,
  ) {}

  async getOrCreate(userId: string) {
    let w = await this.walletRepo.findOne({ where: { user_id: userId } });
    if (!w) {
      w = this.walletRepo.create({ user_id: userId, balance: 0, total_earned: 0, total_withdrawn: 0 });
      w = await this.walletRepo.save(w);
    }
    return w;
  }

  async getBalance(userId: string) {
    const w = await this.getOrCreate(userId);
    return { balance: Number(w.balance), total_earned: Number(w.total_earned), total_withdrawn: Number(w.total_withdrawn) };
  }

  async credit(userId: string, amount: number, source: string, referenceId?: string, note?: string) {
    const w = await this.getOrCreate(userId);
    const newBalance = Number(w.balance) + Number(amount);
    await this.walletRepo.update(w.id, { balance: newBalance, total_earned: Number(w.total_earned) + Number(amount) });
    const tx = this.txRepo.create({ wallet_id: w.id, type: 'credit', source, amount, balance_after: newBalance, reference_id: referenceId, note, status: 'approved' });
    return this.txRepo.save(tx);
  }

  async debit(userId: string, amount: number, source: string, referenceId?: string, note?: string) {
    const w = await this.getOrCreate(userId);
    if (Number(w.balance) < Number(amount)) throw new ForbiddenException('Үлдэгдэл хүрэлцэхгүй');
    const newBalance = Number(w.balance) - Number(amount);
    await this.walletRepo.update(w.id, { balance: newBalance, total_withdrawn: Number(w.total_withdrawn) + Number(amount) });
    const tx = this.txRepo.create({ wallet_id: w.id, type: 'debit', source, amount, balance_after: newBalance, reference_id: referenceId, note, status: 'approved' });
    return this.txRepo.save(tx);
  }

  async requestWithdraw(userId: string, amount: number, note?: string, bankName?: string, bankAccount?: string, bankAccountName?: string) {
    const w = await this.getOrCreate(userId);
    if (Number(w.balance) < Number(amount)) throw new ForbiddenException('Үлдэгдэл хүрэлцэхгүй');
    if (amount < 10000) throw new ForbiddenException('Хамгийн бага 10,000 төгрөг');
    const tx = this.txRepo.create({ wallet_id: w.id, type: 'withdraw', source: 'withdraw', amount, balance_after: Number(w.balance), note, bank_name: bankName, bank_account: bankAccount, bank_account_name: bankAccountName, status: 'pending' });
    return this.txRepo.save(tx);
  }

  async approveWithdraw(txId: string) {
    const tx = await this.txRepo.findOne({ where: { id: txId } });
    if (!tx) throw new NotFoundException('Хүсэлт олдсонгүй');
    if (tx.status !== 'pending') throw new ForbiddenException('Аль хэдийн шийдвэрлэгдсэн');
    const w = await this.walletRepo.findOne({ where: { id: tx.wallet_id } });
    if (!w) throw new NotFoundException('Хэтэвч олдсонгүй');
    const newBalance = Number(w.balance) - Number(tx.amount);
    await this.walletRepo.update(w.id, { balance: newBalance, total_withdrawn: Number(w.total_withdrawn) + Number(tx.amount) });
    await this.txRepo.update(txId, { status: 'approved', balance_after: newBalance });
    return { success: true };
  }

  async rejectWithdraw(txId: string, reason: string) {
    const tx = await this.txRepo.findOne({ where: { id: txId } });
    if (!tx) throw new NotFoundException('Хүсэлт олдсонгүй');
    if (tx.status !== 'pending') throw new ForbiddenException('Аль хэдийн шийдвэрлэгдсэн');
    await this.txRepo.update(txId, { status: 'rejected', reject_reason: reason });
    return { success: true };
  }

  async getTransactions(userId: string) {
    const w = await this.getOrCreate(userId);
    return this.txRepo.find({ where: { wallet_id: w.id }, order: { created_at: 'DESC' }, take: 50 });
  }

  async getAllWithdrawRequests() {
    return this.txRepo.find({ where: { type: 'withdraw' }, order: { created_at: 'DESC' }, relations: ['wallet', 'wallet.user'] });
  }
}