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
exports.VendorDashboardController = void 0;
const common_1 = require("@nestjs/common");
const vendor_dashboard_service_1 = require("./vendor-dashboard.service");
let VendorDashboardController = class VendorDashboardController {
    constructor(service) {
        this.service = service;
    }
    getVendorJobs(vendorId) {
        return this.service.getVendorJobs(vendorId);
    }
    getQueue(vendorId) {
        return this.service.getQueue(vendorId);
    }
    assignMachine(jobId, machineId) {
        return this.service.assignMachine(jobId, machineId);
    }
    startPrinting(jobId) {
        return this.service.startPrinting(jobId);
    }
    finish(jobId) {
        return this.service.finishJob(jobId);
    }
};
exports.VendorDashboardController = VendorDashboardController;
__decorate([
    (0, common_1.Get)(':vendorId/jobs'),
    __param(0, (0, common_1.Param)('vendorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VendorDashboardController.prototype, "getVendorJobs", null);
__decorate([
    (0, common_1.Get)(':vendorId/queue'),
    __param(0, (0, common_1.Param)('vendorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VendorDashboardController.prototype, "getQueue", null);
__decorate([
    (0, common_1.Patch)(':jobId/assign-machine'),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Body)('machine_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], VendorDashboardController.prototype, "assignMachine", null);
__decorate([
    (0, common_1.Patch)(':jobId/start'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VendorDashboardController.prototype, "startPrinting", null);
__decorate([
    (0, common_1.Patch)(':jobId/finish'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VendorDashboardController.prototype, "finish", null);
exports.VendorDashboardController = VendorDashboardController = __decorate([
    (0, common_1.Controller)('vendor-dashboard'),
    __metadata("design:paramtypes", [vendor_dashboard_service_1.VendorDashboardService])
], VendorDashboardController);
//# sourceMappingURL=vendor-dashboard.controller.js.map