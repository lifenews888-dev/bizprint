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
exports.Delivery = exports.DeliveryStatus = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("../orders/entities/order.entity");
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["PENDING"] = "pending";
    DeliveryStatus["ASSIGNED"] = "assigned";
    DeliveryStatus["PICKED_UP"] = "picked_up";
    DeliveryStatus["ON_THE_WAY"] = "on_the_way";
    DeliveryStatus["IN_TRANSIT"] = "in_transit";
    DeliveryStatus["DELIVERED"] = "delivered";
    DeliveryStatus["FAILED"] = "failed";
    DeliveryStatus["CANCELLED"] = "cancelled";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
let Delivery = class Delivery {
};
exports.Delivery = Delivery;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Delivery.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_entity_1.Order, { eager: true }),
    __metadata("design:type", order_entity_1.Order)
], Delivery.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Delivery.prototype, "courier_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "courier_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "courier_phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.ASSIGNED }),
    __metadata("design:type", String)
], Delivery.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Delivery.prototype, "estimated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "provider_order_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "provider_tracking_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Delivery.prototype, "provider_data", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "recipient_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "recipient_phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 6, nullable: true }),
    __metadata("design:type", Number)
], Delivery.prototype, "lat", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 6, nullable: true }),
    __metadata("design:type", Number)
], Delivery.prototype, "lng", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Delivery.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Delivery.prototype, "updated_at", void 0);
exports.Delivery = Delivery = __decorate([
    (0, typeorm_1.Entity)()
], Delivery);
//# sourceMappingURL=delivery.entity.js.map