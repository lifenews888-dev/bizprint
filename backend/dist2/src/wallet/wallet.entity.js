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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletTransaction = exports.Wallet = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
let Wallet = class Wallet {
};
exports.Wallet = Wallet;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Wallet.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Wallet.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Wallet.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "balance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "total_earned", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Wallet.prototype, "total_withdrawn", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Wallet.prototype, "created_at", void 0);
exports.Wallet = Wallet = __decorate([
    (0, typeorm_1.Entity)('wallets')
], Wallet);
let WalletTransaction = class WalletTransaction {
};
exports.WalletTransaction = WalletTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WalletTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WalletTransaction.prototype, "wallet_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Wallet),
    (0, typeorm_1.JoinColumn)({ name: 'wallet_id' }),
    __metadata("design:type", Wallet)
], WalletTransaction.prototype, "wallet", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    __metadata("design:type", Number)
], WalletTransaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], WalletTransaction.prototype, "balance_after", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "reference_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: 'approved' }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "bank_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "bank_account", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "bank_account_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WalletTransaction.prototype, "reject_reason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WalletTransaction.prototype, "created_at", void 0);
exports.WalletTransaction = WalletTransaction = __decorate([
    (0, typeorm_1.Entity)('wallet_transactions')
], WalletTransaction);
//# sourceMappingURL=wallet.entity.js.map