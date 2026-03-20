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
exports.DesignRequest = exports.DesignStatus = void 0;
const typeorm_1 = require("typeorm");
var DesignStatus;
(function (DesignStatus) {
    DesignStatus["PENDING"] = "pending";
    DesignStatus["ASSIGNED"] = "assigned";
    DesignStatus["IN_PROGRESS"] = "in_progress";
    DesignStatus["REVIEW"] = "review";
    DesignStatus["APPROVED"] = "approved";
    DesignStatus["REJECTED"] = "rejected";
})(DesignStatus || (exports.DesignStatus = DesignStatus = {}));
let DesignRequest = class DesignRequest {
};
exports.DesignRequest = DesignRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DesignRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DesignRequest.prototype, "order_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DesignRequest.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DesignRequest.prototype, "customer_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DesignRequest.prototype, "customer_email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DesignRequest.prototype, "customer_phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DesignRequest.prototype, "designer_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DesignRequest.prototype, "designer_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DesignRequest.prototype, "designer_phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DesignRequest.prototype, "designer_zoom", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: DesignStatus.PENDING }),
    __metadata("design:type", String)
], DesignRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DesignRequest.prototype, "product_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DesignRequest.prototype, "requirements", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DesignRequest.prototype, "file_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DesignRequest.prototype, "preview_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DesignRequest.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DesignRequest.prototype, "reject_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], DesignRequest.prototype, "deadline", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DesignRequest.prototype, "design_fee", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DesignRequest.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DesignRequest.prototype, "updated_at", void 0);
exports.DesignRequest = DesignRequest = __decorate([
    (0, typeorm_1.Entity)('design_requests')
], DesignRequest);
//# sourceMappingURL=design-request.entity.js.map