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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("./entities/order.entity");
const audit_trail_entity_1 = require("../audit-trail/audit-trail.entity");
const mail_service_1 = require("../mail/mail.service");
const WORKFLOW_STAGES = [
    'pending',
    'designing',
    'prepress',
    'printing',
    'finishing',
    'qc',
    'ready',
    'delivering',
    'completed',
];
let OrdersService = class OrdersService {
    constructor(ordersRepo, auditRepo, mailService) {
        this.ordersRepo = ordersRepo;
        this.auditRepo = auditRepo;
        this.mailService = mailService;
    }
    async createOrder(data) {
        const order = this.ordersRepo.create({ ...data, status: order_entity_1.OrderStatus.PENDING });
        const saved = await this.ordersRepo.save(order);
        if (data.customer_email) {
            try {
                await this.mailService.sendOrderConfirmation({
                    to: data.customer_email,
                    name: data.customer_name || 'Хэрэглэгч',
                    orderId: saved.id,
                    productName: data.product_name || 'Бүтээгдэхүүн',
                    quantity: saved.quantity,
                    total: saved.total_price,
                    invoiceCode: data.invoice_code || '',
                });
            }
            catch (e) {
                console.log('Email error:', e.message);
            }
        }
        return saved;
    }
    async createFromQuote(quoteId, userId, paymentMethod) {
        const quoteRepo = this.ordersRepo.manager.connection.getRepository('QuoteV2');
        const quote = await quoteRepo.findOne({ where: { id: quoteId } });
        if (!quote)
            throw new common_1.NotFoundException('Quote олдсонгүй');
        const order = this.ordersRepo.create({
            customer_id: userId,
            quote_id: quoteId,
            quote_number: quote.quote_number,
            customer_name: quote.customer_name,
            customer_phone: quote.customer_phone,
            customer_email: quote.customer_email,
            product_name: quote.product_name,
            quantity: quote.quantity,
            unit_price: quote.unit_price,
            total_price: quote.total_price,
            paper_gsm: quote.paper_gsm,
            color_mode: quote.color_mode,
            sides: quote.sides,
            finishing: quote.finishing,
            payment_method: paymentMethod || 'pending',
            payment_status: 'pending',
            status: order_entity_1.OrderStatus.PENDING,
            notes: `Quote ${quote.quote_number}-аас үүсгэгдсэн`,
        });
        const saved = await this.ordersRepo.save(order);
        await quoteRepo.update(quoteId, { status: 'ordered' });
        if (quote.customer_email) {
            try {
                await this.mailService.sendOrderConfirmation({
                    to: quote.customer_email,
                    name: quote.customer_name || 'Хэрэглэгч',
                    orderId: saved.id,
                    productName: quote.product_name || 'Хэвлэл',
                    quantity: quote.quantity,
                    total: quote.total_price,
                    invoiceCode: saved.id.slice(0, 8).toUpperCase(),
                });
            }
            catch (e) {
                console.log('Email error:', e.message);
            }
        }
        return saved;
    }
    async updateStatus(id, status) {
        await this.ordersRepo.update(id, { status });
        return this.getOrderById(id);
    }
    async updateOrder(id, data) {
        const update = {};
        if (data.status)
            update.status = data.status;
        if (data.assigned_to !== undefined)
            update.assigned_to = data.assigned_to;
        if (data.deadline !== undefined)
            update.deadline = data.deadline;
        await this.ordersRepo.update(id, update);
        return this.getOrderById(id);
    }
    async revertStatus(id, reason, user, targetStage) {
        const order = await this.getOrderById(id);
        const currentStatus = order.status;
        const currentIndex = WORKFLOW_STAGES.indexOf(currentStatus);
        if (currentIndex <= 0) {
            throw new common_1.BadRequestException(`"${currentStatus}" төлөвөөс буцаах боломжгүй`);
        }
        if (currentStatus === 'completed' || currentStatus === 'cancelled') {
            throw new common_1.BadRequestException(`"${currentStatus}" төлөвөөс буцаах боломжгүй`);
        }
        let revertToIndex;
        if (targetStage) {
            revertToIndex = WORKFLOW_STAGES.indexOf(targetStage);
            if (revertToIndex < 0 || revertToIndex >= currentIndex) {
                throw new common_1.BadRequestException(`"${targetStage}" руу буцаах боломжгүй (одоогийн: ${currentStatus})`);
            }
        }
        else {
            revertToIndex = currentIndex - 1;
        }
        const revertTo = WORKFLOW_STAGES[revertToIndex];
        await this.ordersRepo.update(id, { status: revertTo });
        const auditEntry = this.auditRepo.create({
            order_id: id,
            user: user,
            action: `БУЦААГДСАН: "${currentStatus}" → "${revertTo}" | Шалтгаан: ${reason}`,
        });
        await this.auditRepo.save(auditEntry);
        return this.getOrderById(id);
    }
    async getOrders() {
        return this.ordersRepo.find({ order: { created_at: 'DESC' } });
    }
    async getOrdersByCustomer(customer_id) {
        return this.ordersRepo.find({
            where: { customer_id },
            order: { created_at: 'DESC' },
        });
    }
    async getOrderById(id) {
        const order = await this.ordersRepo.findOne({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Захиалга олдсонгүй');
        return order;
    }
    async cancelOrder(id) {
        const order = await this.getOrderById(id);
        order.status = order_entity_1.OrderStatus.CANCELLED;
        return this.ordersRepo.save(order);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(audit_trail_entity_1.AuditTrail)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        mail_service_1.MailService])
], OrdersService);
//# sourceMappingURL=order.service.js.map