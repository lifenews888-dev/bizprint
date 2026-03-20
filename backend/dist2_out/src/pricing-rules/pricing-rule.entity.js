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
exports.PricingRule = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("../products/product.entity");
let PricingRule = class PricingRule {
};
exports.PricingRule = PricingRule;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PricingRule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PricingRule.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], PricingRule.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PricingRule.prototype, "category_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PricingRule.prototype, "attribute_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '' }),
    __metadata("design:type", String)
], PricingRule.prototype, "attribute_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], PricingRule.prototype, "price_multiplier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PricingRule.prototype, "price_addition", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PricingRule.prototype, "price_override", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], PricingRule.prototype, "min_quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], PricingRule.prototype, "is_active", void 0);
exports.PricingRule = PricingRule = __decorate([
    (0, typeorm_1.Entity)('pricing_rules')
], PricingRule);
//# sourceMappingURL=pricing-rule.entity.js.map