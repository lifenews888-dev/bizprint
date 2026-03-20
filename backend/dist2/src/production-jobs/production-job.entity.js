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
exports.ProductionJob = exports.ProductionJobStatus = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("../orders/entities/order.entity");
var ProductionJobStatus;
(function (ProductionJobStatus) {
    ProductionJobStatus["PENDING"] = "pending";
    ProductionJobStatus["IN_PROGRESS"] = "in_progress";
    ProductionJobStatus["COMPLETED"] = "completed";
    ProductionJobStatus["CANCELLED"] = "cancelled";
})(ProductionJobStatus || (exports.ProductionJobStatus = ProductionJobStatus = {}));
let ProductionJob = class ProductionJob {
};
exports.ProductionJob = ProductionJob;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ProductionJob.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ProductionJobStatus, default: ProductionJobStatus.PENDING }),
    __metadata("design:type", String)
], ProductionJob.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProductionJob.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_entity_1.Order, { nullable: true, eager: true }),
    __metadata("design:type", order_entity_1.Order)
], ProductionJob.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ProductionJob.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ProductionJob.prototype, "updated_at", void 0);
exports.ProductionJob = ProductionJob = __decorate([
    (0, typeorm_1.Entity)()
], ProductionJob);
//# sourceMappingURL=production-job.entity.js.map