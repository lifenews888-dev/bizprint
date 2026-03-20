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
exports.ProductionSchedulerController = void 0;
const common_1 = require("@nestjs/common");
const production_scheduler_service_1 = require("./production-scheduler.service");
let ProductionSchedulerController = class ProductionSchedulerController {
    constructor(service) {
        this.service = service;
    }
    schedule(body) {
        const orders = body.orders.map((o) => ({
            id: Number(o.id),
            quantity: Number(o.quantity),
            machine_speed: Number(o.machine_speed)
        }));
        return this.service.scheduleOrders(orders);
    }
};
exports.ProductionSchedulerController = ProductionSchedulerController;
__decorate([
    (0, common_1.Post)('schedule'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductionSchedulerController.prototype, "schedule", null);
exports.ProductionSchedulerController = ProductionSchedulerController = __decorate([
    (0, common_1.Controller)('production-scheduler'),
    __metadata("design:paramtypes", [production_scheduler_service_1.ProductionSchedulerService])
], ProductionSchedulerController);
//# sourceMappingURL=production-scheduler.controller.js.map