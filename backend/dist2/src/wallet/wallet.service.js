"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wallet_entity_1 = require("./wallet.entity");
let WalletService = class WalletService {
    constructor(walletRepo, txRepo) {
        this.walletRepo = walletRepo;
        this.txRepo = txRepo;
    }
    async getOrCreate(userId) {
        let w = await this.walletRepo.findOne({ where: { user_id: userId } });
        if (!w) {
            w = this.walletRepo.create({ user_id: userId, balance: 0, total_earned: 0, total_withdrawn: 0 });
            w = await this.walletRepo.save(w);
        }
        return w;
    }
    async getBalance(userId) {
        const w = await this.getOrCreate(userId);
        return { balance: Number(w.balance), total_earned: Number(w.total_earned), total_withdrawn: Number(w.total_withdrawn) };
    }
    async credit(userId, amount, source, referenceId, note) {
        const w = await this.getOrCreate(userId);
        const newBalance = Number(w.balance) + Number(amount);
        await this.walletRepo.update(w.id, { balance: newBalance, total_earned: Number(w.total_earned) + Number(amount) });
        const tx = this.txRepo.create({ wallet_id: w.id, type: 'credit', source, amount, balance_after: newBalance, reference_id: referenceId, note, status: 'approved' });
        return this.txRepo.save(tx);
    }
    async debit(userId, amount, source, referenceId, note) {
        const w = await this.getOrCreate(userId);
        if (Number(w.balance) < Number(amount))
            throw new common_1.ForbiddenException('Үлдэгдэл хүрэлцэхгүй');
        const newBalance = Number(w.balance) - Number(amount);
        await this.walletRepo.update(w.id, { balance: newBalance, total_withdrawn: Number(w.total_withdrawn) + Number(amount) });
        const tx = this.txRepo.create({ wallet_id: w.id, type: 'debit', source, amount, balance_after: newBalance, reference_id: referenceId, note, status: 'approved' });
        return this.txRepo.save(tx);
    }
    async requestWithdraw(userId, amount, note, bankName, bankAccount, bankAccountName) {
        const w = await this.getOrCreate(userId);
        if (Number(w.balance) < Number(amount))
            throw new common_1.ForbiddenException('Үлдэгдэл хүрэлцэхгүй');
        if (amount < 10000)
            throw new common_1.ForbiddenException('Хамгийн бага 10,000 төгрөг');
        const tx = this.txRepo.create({ wallet_id: w.id, type: 'withdraw', source: 'withdraw', amount, balance_after: Number(w.balance), note, bank_name: bankName, bank_account: bankAccount, bank_account_name: bankAccountName, status: 'pending' });
        return this.txRepo.save(tx);
    }
    async approveWithdraw(txId) {
        const tx = await this.txRepo.findOne({ where: { id: txId } });
        if (!tx)
            throw new common_1.NotFoundException('Хүсэлт олдсонгүй');
        if (tx.status !== 'pending')
            throw new common_1.ForbiddenException('Аль хэдийн шийдвэрлэгдсэн');
        const w = await this.walletRepo.findOne({ where: { id: tx.wallet_id } });
        if (!w)
            throw new common_1.NotFoundException('Хэтэвч олдсонгүй');
        const newBalance = Number(w.balance) - Number(tx.amount);
        await this.walletRepo.update(w.id, { balance: newBalance, total_withdrawn: Number(w.total_withdrawn) + Number(tx.amount) });
        await this.txRepo.update(txId, { status: 'approved', balance_after: newBalance });
        return { success: true };
    }
    async rejectWithdraw(txId, reason) {
        const tx = await this.txRepo.findOne({ where: { id: txId } });
        if (!tx)
            throw new common_1.NotFoundException('Хүсэлт олдсонгүй');
        if (tx.status !== 'pending')
            throw new common_1.ForbiddenException('Аль хэдийн шийдвэрлэгдсэн');
        await this.txRepo.update(txId, { status: 'rejected', reject_reason: reason });
        return { success: true };
    }
    async getTransactions(userId) {
        const w = await this.getOrCreate(userId);
        return this.txRepo.find({ where: { wallet_id: w.id }, order: { created_at: 'DESC' }, take: 50 });
    }
    async getAllWithdrawRequests() {
        return this.txRepo.find({ where: { type: 'withdraw' }, order: { created_at: 'DESC' }, relations: ['wallet', 'wallet.user'] });
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __param(1, (0, typeorm_1.InjectRepository)(wallet_entity_1.WalletTransaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], WalletService);
//# sourceMappingURL=wallet.service.js.map