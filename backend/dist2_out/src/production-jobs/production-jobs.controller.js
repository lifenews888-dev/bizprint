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
exports.ProductionJobsController = void 0;
const common_1 = require("@nestjs/common");
const production_jobs_service_1 = require("./production-jobs.service");
const production_job_entity_1 = require("./production-job.entity");
let ProductionJobsController = class ProductionJobsController {
    constructor(service) {
        this.service = service;
    }
    findAll() {
        return this.service.findAll();
    }
    updateStatus(id, status) {
        return this.service.updateStatus(id, status);
    }
    createFromOrder(orderId) {
        return this.service.createFromOrder(orderId);
    }
};
exports.ProductionJobsController = ProductionJobsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProductionJobsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], ProductionJobsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)('from-order/:orderId'),
    __param(0, (0, common_1.Param)('orderId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProductionJobsController.prototype, "createFromOrder", null);
exports.ProductionJobsController = ProductionJobsController = __decorate([
    (0, common_1.Controller)('production-jobs'),
    __metadata("design:paramtypes", [production_jobs_service_1.ProductionJobsService])
], ProductionJobsController);
//# sourceMappingURL=production-jobs.controller.js.map