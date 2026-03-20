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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("./payment.service");
const axios_1 = __importDefault(require("axios"));
let PaymentController = class PaymentController {
    constructor(paymentService) {
        this.paymentService = paymentService;
        this.BASE_URL = 'https://qrservice.tdbmlabs.mn';
        this.USERNAME = 'tdbm';
        this.PASSWORD = 'tdbm';
        this.TERMINAL_ID = '91200026';
    }
    async getToken() {
        const res = await axios_1.default.post(this.BASE_URL + '/api/v1/login', {
            username: this.USERNAME,
            password: this.PASSWORD,
        });
        return res.data?.data?.token || '';
    }
    async createInvoice(body) {
        try {
            const token = await this.getToken();
            const res = await axios_1.default.post(this.BASE_URL + '/api/v1/invoice', {
                qrType: 'dynamic',
                transactionType: 1,
                qrGenerator: 'TDBM',
                accountNumber: ' ',
                amount: body.amount,
                bankCode: 'TDBMNUB',
                curCode: 'MNT',
                terminalId: this.TERMINAL_ID,
                additional: {
                    purposeTransaction: 'BizPrint ' + body.orderId,
                    callbackUrl: 'http://localhost:4000/payment/callback',
                },
            }, { headers: { Authorization: 'Bearer ' + token } });
            return res.data;
        }
        catch (e) {
            return { success: false, msg: e.message };
        }
    }
    async getStatus(invoiceNo) {
        try {
            const token = await this.getToken();
            const res = await axios_1.default.get(this.BASE_URL + '/api/v1/invoice/' + invoiceNo, {
                headers: { Authorization: 'Bearer ' + token },
            });
            return res.data;
        }
        catch (e) {
            return { success: false, msg: e.message };
        }
    }
    async callback(body) {
        console.log('TDB Payment Callback:', body);
        try {
            const invoiceNo = body?.invoiceNo || body?.invoice_code || body?.invoiceCode;
            if (invoiceNo) {
                const result = await this.paymentService.confirmPayment(invoiceNo);
                console.log('Order updated:', result);
                return { success: true, result };
            }
            return { success: false, msg: 'invoice_code not found in callback' };
        }
        catch (e) {
            console.error('Callback error:', e.message);
            return { success: false, msg: e.message };
        }
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createInvoice", null);
__decorate([
    (0, common_1.Get)('status/:invoiceNo'),
    __param(0, (0, common_1.Param)('invoiceNo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('callback'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "callback", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)('payment'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map