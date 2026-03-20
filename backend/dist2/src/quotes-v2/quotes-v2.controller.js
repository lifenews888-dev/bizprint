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
exports.QuotesV2Controller = void 0;
const common_1 = require("@nestjs/common");
const quotes_v2_service_1 = require("./quotes-v2.service");
const mail_service_1 = require("../mail/mail.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let QuotesV2Controller = class QuotesV2Controller {
    constructor(svc, mail) {
        this.svc = svc;
        this.mail = mail;
    }
    async create(body) {
        const quote = await this.svc.create({
            customer_name: body.customer_name,
            customer_phone: body.customer_phone,
            customer_email: body.customer_email,
            product_name: body.product_name,
            product_description: body.product_description,
            quantity: Number(body.quantity),
            pages: Number(body.pages),
            size: body.size,
            width_mm: Number(body.width_mm),
            height_mm: Number(body.height_mm),
            paper_type: body.paper_type,
            paper_gsm: Number(body.paper_gsm),
            color_mode: body.color_mode,
            sides: body.sides,
            finishing: body.finishing,
            binding: body.binding,
            unit_price: Number(body.unit_price),
            total_price: Number(body.total_price),
            breakdown: body.breakdown,
            notes: body.notes,
        });
        try {
            await this.mail.sendQuoteToCustomer({
                to: quote.customer_email,
                name: quote.customer_name,
                phone: quote.customer_phone,
                quote_number: quote.quote_number,
                product_name: quote.product_name || '',
                quantity: quote.quantity,
                pages: quote.pages,
                size: quote.size || '',
                width_mm: quote.width_mm,
                height_mm: quote.height_mm,
                paper_type: quote.paper_type || '',
                paper_gsm: quote.paper_gsm,
                color_mode: quote.color_mode || 'color',
                sides: quote.sides || 'single',
                finishing: quote.finishing || 'none',
                binding: quote.binding || 'none',
                unit_price: Number(quote.unit_price),
                total_price: Number(quote.total_price),
                valid_until: quote.valid_until,
                breakdown: quote.breakdown,
            });
            await this.svc.update(quote.id, { email_sent: true });
        }
        catch (e) {
            console.error('Email илгээхэд алдаа:', e.message);
        }
        return quote;
    }
    findAll(date) {
        return this.svc.findAll();
    }
    findToday() {
        return this.svc.findToday();
    }
    findOne(id) {
        return this.svc.findOne(id);
    }
    update(id, body) {
        return this.svc.update(id, body);
    }
    async sendDailyReport(body) {
        const quotes = await this.svc.findToday();
        const date = new Date().toLocaleDateString('mn-MN');
        await this.mail.sendDailyReport(body.admin_email, quotes, date);
        await Promise.all(quotes.map(q => this.svc.update(q.id, { daily_report_sent: true })));
        return { sent: quotes.length };
    }
};
exports.QuotesV2Controller = QuotesV2Controller;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuotesV2Controller.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuotesV2Controller.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('today'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QuotesV2Controller.prototype, "findToday", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuotesV2Controller.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QuotesV2Controller.prototype, "update", null);
__decorate([
    (0, common_1.Post)('daily-report'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuotesV2Controller.prototype, "sendDailyReport", null);
exports.QuotesV2Controller = QuotesV2Controller = __decorate([
    (0, common_1.Controller)('quotes-v2'),
    __metadata("design:paramtypes", [quotes_v2_service_1.QuotesV2Service,
        mail_service_1.MailService])
], QuotesV2Controller);
//# sourceMappingURL=quotes-v2.controller.js.map