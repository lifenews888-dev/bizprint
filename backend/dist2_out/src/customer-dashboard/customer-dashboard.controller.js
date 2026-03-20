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
exports.CustomerDashboardController = void 0;
const common_1 = require("@nestjs/common");
const customer_dashboard_service_1 = require("./customer-dashboard.service");
let CustomerDashboardController = class CustomerDashboardController {
    constructor(service) {
        this.service = service;
    }
    getOrders(customerId) {
        return this.service.getOrders(customerId);
    }
    getPayments(customerId) {
        return this.service.getPayments(customerId);
    }
    getProduction(customerId) {
        return this.service.getProductionStatus(customerId);
    }
};
exports.CustomerDashboardController = CustomerDashboardController;
__decorate([
    (0, common_1.Get)(':customerId/orders'),
    __param(0, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomerDashboardController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)(':customerId/payments'),
    __param(0, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomerDashboardController.prototype, "getPayments", null);
__decorate([
    (0, common_1.Get)(':customerId/production'),
    __param(0, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomerDashboardController.prototype, "getProduction", null);
exports.CustomerDashboardController = CustomerDashboardController = __decorate([
    (0, common_1.Controller)('customer-dashboard'),
    __metadata("design:paramtypes", [customer_dashboard_service_1.CustomerDashboardService])
], CustomerDashboardController);
//# sourceMappingURL=customer-dashboard.controller.js.map