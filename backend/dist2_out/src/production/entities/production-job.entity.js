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
exports.ProductionJob = exports.ProductionStatus = void 0;
const typeorm_1 = require("typeorm");
var ProductionStatus;
(function (ProductionStatus) {
    ProductionStatus["QUEUED"] = "queued";
    ProductionStatus["ASSIGNED"] = "assigned";
    ProductionStatus["PRINTING"] = "printing";
    ProductionStatus["FINISHING"] = "finishing";
    ProductionStatus["COMPLETED"] = "completed";
})(ProductionStatus || (exports.ProductionStatus = ProductionStatus = {}));
let ProductionJob = class ProductionJob {
};
exports.ProductionJob = ProductionJob;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProductionJob.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductionJob.prototype, "order_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProductionJob.prototype, "machine_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProductionJob.prototype, "vendor_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ProductionStatus,
        default: ProductionStatus.QUEUED
    }),
    __metadata("design:type", String)
], ProductionJob.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ProductionJob.prototype, "start_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ProductionJob.prototype, "end_time", void 0);
exports.ProductionJob = ProductionJob = __decorate([
    (0, typeorm_1.Entity)('production_jobs')
], ProductionJob);
//# sourceMappingURL=production-job.entity.js.map