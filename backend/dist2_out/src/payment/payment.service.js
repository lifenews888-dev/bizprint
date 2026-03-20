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
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payment_entity_1 = require("./entities/payment.entity");
const order_entity_1 = require("../orders/entities/order.entity");
const mail_service_1 = require("../mail/mail.service");
const production_jobs_service_1 = require("../production-jobs/production-jobs.service");
let PaymentService = class PaymentService {
    constructor(paymentRepo, orderRepo, mailService, productionJobsService) {
        this.paymentRepo = paymentRepo;
        this.orderRepo = orderRepo;
        this.mailService = mailService;
        this.productionJobsService = productionJobsService;
    }
    async createPayment(order_id, amount, customer_id) {
        const invoice_code = `BIZ-${Date.now()}`;
        const payment = this.paymentRepo.create({
            order_id,
            customer_id,
            amount,
            invoice_code,
            status: 'pending',
            provider: 'qpay',
        });
        const saved = await this.paymentRepo.save(payment);
        const qpay_url = `https://qpay.mn/payment/qr/${invoice_code}`;
        const qr_text = `QPay:${invoice_code}:${amount}`;
        return {
            payment_id: saved.id,
            invoice_code,
            amount,
            currency: 'MNT',
            provider: 'qpay',
            status: 'pending',
            qpay_url,
            qr_text,
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            message: 'QPay QR code created. Please pay within 30 minutes.',
        };
    }
    async checkPayment(payment_id) {
        const payment = await this.paymentRepo.findOne({ where: { id: payment_id } });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        return {
            payment_id: payment.id,
            invoice_code: payment.invoice_code,
            amount: payment.amount,
            status: payment.status,
            provider: payment.provider,
        };
    }
    async confirmPayment(invoice_code) {
        const payment = await this.paymentRepo.findOne({ where: { invoice_code } });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        payment.status = 'paid';
        payment.paid_at = new Date();
        await this.paymentRepo.save(payment);
        const order = await this.orderRepo.findOne({
            where: { id: payment.order_id },
        });
        if (order) {
            order.status = 'paid';
            order.payment_status = 'paid';
            await this.orderRepo.save(order);
            try {
                await this.productionJobsService.createFromOrder(payment.order_id);
                order.status = 'in_production';
                await this.orderRepo.save(order);
            }
            catch (e) {
                console.log('Production job creation error:', e.message);
            }
            const email = order.customer_email;
            const name = order.customer_name || 'Khereglech';
            if (email) {
                this.mailService.sendOrderConfirmation({
                    to: email,
                    name,
                    orderId: order.id,
                    productName: order.product_name || 'Buteegedkheen',
                    quantity: order.quantity,
                    total: Number(order.total_price),
                    invoiceCode: invoice_code,
                }).catch(() => { });
            }
        }
        return {
            success: true,
            payment_id: payment.id,
            invoice_code,
            order_id: payment.order_id,
            order_status: 'in_production',
            status: 'paid',
            message: 'Payment confirmed. Production job created automatically!',
        };
    }
    async getPaymentsByCustomer(customer_id) {
        return this.paymentRepo.find({
            where: { customer_id },
            order: { created_at: 'DESC' },
        });
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(1, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        mail_service_1.MailService,
        production_jobs_service_1.ProductionJobsService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map