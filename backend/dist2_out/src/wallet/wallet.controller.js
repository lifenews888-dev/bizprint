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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("./wallet.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let WalletController = class WalletController {
    constructor(svc) {
        this.svc = svc;
    }
    getBalance(req) {
        return this.svc.getBalance(req.user.id);
    }
    getTransactions(req) {
        return this.svc.getTransactions(req.user.id);
    }
    requestWithdraw(req, body) {
        return this.svc.requestWithdraw(req.user.id, body.amount, body.note, body.bank_name, body.bank_account, body.bank_account_name);
    }
    getAllWithdrawRequests() {
        return this.svc.getAllWithdrawRequests();
    }
    approveWithdraw(id) {
        return this.svc.approveWithdraw(id);
    }
    rejectWithdraw(id, body) {
        return this.svc.rejectWithdraw(id, body.reason);
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)('balance'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Post)('withdraw'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "requestWithdraw", null);
__decorate([
    (0, common_1.Get)('withdraw-requests'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getAllWithdrawRequests", null);
__decorate([
    (0, common_1.Patch)('withdraw-requests/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "approveWithdraw", null);
__decorate([
    (0, common_1.Patch)('withdraw-requests/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "rejectWithdraw", null);
exports.WalletController = WalletController = __decorate([
    (0, common_1.Controller)('wallet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map