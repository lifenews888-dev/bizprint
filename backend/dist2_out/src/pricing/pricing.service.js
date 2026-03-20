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
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../products/product.entity");
const pricing_rule_entity_1 = require("../pricing-rules/pricing-rule.entity");
let PricingService = class PricingService {
    constructor(productRepo, rulesRepo) {
        this.productRepo = productRepo;
        this.rulesRepo = rulesRepo;
    }
    async calculateQuote(input) {
        const product = await this.productRepo.findOne({
            where: { id: input.product_id, is_active: true },
        });
        if (!product)
            throw new common_1.NotFoundException('\u0411\u04af\u0442\u044d\u044d\u0433\u0434\u044d\u0445\u04af\u04af\u043d \u043e\u043b\u0434\u0441\u043e\u043d\u0433\u04af\u0439');
        const base_price = Number(product.base_price);
        const quantity = input.quantity;
        let qty_multiplier = 1.0;
        if (quantity >= 5000)
            qty_multiplier = 0.70;
        else if (quantity >= 2000)
            qty_multiplier = 0.80;
        else if (quantity >= 1000)
            qty_multiplier = 0.85;
        else if (quantity >= 500)
            qty_multiplier = 0.90;
        else if (quantity >= 250)
            qty_multiplier = 0.95;
        const rules = await this.rulesRepo.find({
            where: { product_id: input.product_id, is_active: true },
        });
        let option_multiplier = 1.0;
        let option_addition = 0;
        const applied_rules = [];
        if (input.options && rules.length > 0) {
            for (const [key, value] of Object.entries(input.options)) {
                const rule = rules.find(r => r.attribute_key === key && r.attribute_value === value);
                if (rule) {
                    option_multiplier += Number(rule.price_multiplier);
                    option_addition += Number(rule.price_addition);
                    applied_rules.push(key + '=' + value);
                }
            }
        }
        const rush_multiplier = input.rush ? 1.35 : 1.0;
        const unit_price = Math.round(base_price * qty_multiplier * option_multiplier * rush_multiplier + option_addition);
        const setup_fee = quantity < 500 ? 15000 : 0;
        const subtotal = unit_price * quantity + setup_fee;
        const platform_margin = Math.round(subtotal * 0.15);
        const delivery_fee = input.delivery ? 15000 : 0;
        const total = subtotal + platform_margin + delivery_fee;
        const valid_until = new Date();
        valid_until.setHours(valid_until.getHours() + 24);
        return {
            product_id: product.id,
            product_name: product.name_mn || product.name,
            quantity,
            unit_price,
            setup_fee,
            subtotal,
            platform_margin,
            delivery_fee,
            total,
            currency: 'MNT',
            valid_until: valid_until.toISOString(),
            breakdown: {
                base_price,
                qty_multiplier,
                option_multiplier,
                rush_multiplier,
                option_addition,
                applied_rules,
                unit_price,
                setup_fee,
                subtotal,
                platform_margin_15pct: platform_margin,
                delivery_fee,
                total,
            },
        };
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(pricing_rule_entity_1.PricingRule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PricingService);
//# sourceMappingURL=pricing.service.js.map