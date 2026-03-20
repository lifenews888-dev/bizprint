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
exports.QuoteV2 = exports.QuoteStatus = void 0;
const typeorm_1 = require("typeorm");
var QuoteStatus;
(function (QuoteStatus) {
    QuoteStatus["DRAFT"] = "draft";
    QuoteStatus["SENT"] = "sent";
    QuoteStatus["CONFIRMED"] = "confirmed";
    QuoteStatus["ORDERED"] = "ordered";
    QuoteStatus["EXPIRED"] = "expired";
})(QuoteStatus || (exports.QuoteStatus = QuoteStatus = {}));
let QuoteV2 = class QuoteV2 {
};
exports.QuoteV2 = QuoteV2;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], QuoteV2.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], QuoteV2.prototype, "quote_number", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuoteV2.prototype, "customer_name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuoteV2.prototype, "customer_phone", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuoteV2.prototype, "customer_email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], QuoteV2.prototype, "product_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], QuoteV2.prototype, "product_description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], QuoteV2.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], QuoteV2.prototype, "pages", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], QuoteV2.prototype, "size", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], QuoteV2.prototype, "width_mm", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], QuoteV2.prototype, "height_mm", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], QuoteV2.prototype, "paper_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], QuoteV2.prototype, "paper_gsm", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], QuoteV2.prototype, "color_mode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], QuoteV2.prototype, "sides", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], QuoteV2.prototype, "finishing", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], QuoteV2.prototype, "binding", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], QuoteV2.prototype, "unit_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], QuoteV2.prototype, "total_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], QuoteV2.prototype, "breakdown", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: QuoteStatus.DRAFT }),
    __metadata("design:type", String)
], QuoteV2.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], QuoteV2.prototype, "valid_until", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], QuoteV2.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], QuoteV2.prototype, "email_sent", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], QuoteV2.prototype, "daily_report_sent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], QuoteV2.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], QuoteV2.prototype, "updated_at", void 0);
exports.QuoteV2 = QuoteV2 = __decorate([
    (0, typeorm_1.Entity)('quotes_v2')
], QuoteV2);
//# sourceMappingURL=quote-v2.entity.js.map