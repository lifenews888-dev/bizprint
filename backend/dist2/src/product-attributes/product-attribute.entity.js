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
exports.ProductAttribute = exports.AttributeType = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("../products/product.entity");
var AttributeType;
(function (AttributeType) {
    AttributeType["SELECT"] = "select";
    AttributeType["NUMBER"] = "number";
    AttributeType["DIMENSIONS"] = "dimensions";
    AttributeType["CHECKBOX"] = "checkbox";
    AttributeType["TEXT"] = "text";
})(AttributeType || (exports.AttributeType = AttributeType = {}));
let ProductAttribute = class ProductAttribute {
};
exports.ProductAttribute = ProductAttribute;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProductAttribute.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductAttribute.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], ProductAttribute.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductAttribute.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductAttribute.prototype, "name_mn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: 'select' }),
    __metadata("design:type", String)
], ProductAttribute.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ProductAttribute.prototype, "options", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProductAttribute.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProductAttribute.prototype, "default_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ProductAttribute.prototype, "required", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], ProductAttribute.prototype, "sort_order", void 0);
exports.ProductAttribute = ProductAttribute = __decorate([
    (0, typeorm_1.Entity)('product_attributes')
], ProductAttribute);
//# sourceMappingURL=product-attribute.entity.js.map