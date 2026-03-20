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
exports.ProductionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const production_job_entity_1 = require("./entities/production-job.entity");
let ProductionService = class ProductionService {
    constructor(productionRepo) {
        this.productionRepo = productionRepo;
    }
    async createJob(orderId) {
        const job = this.productionRepo.create({
            order_id: orderId,
            status: production_job_entity_1.ProductionStatus.QUEUED,
        });
        return this.productionRepo.save(job);
    }
    async getAllJobs() {
        return this.productionRepo.find();
    }
    async getJob(id) {
        return this.productionRepo.findOne({ where: { id } });
    }
    async assignMachine(jobId, machineId, vendorId) {
        await this.productionRepo.update(jobId, {
            machine_id: machineId,
            vendor_id: vendorId,
            status: production_job_entity_1.ProductionStatus.ASSIGNED,
        });
        return this.productionRepo.findOne({ where: { id: jobId } });
    }
    async startJob(jobId) {
        await this.productionRepo.update(jobId, {
            status: production_job_entity_1.ProductionStatus.PRINTING,
            start_time: new Date(),
        });
        return this.productionRepo.findOne({ where: { id: jobId } });
    }
    async completeJob(jobId) {
        await this.productionRepo.update(jobId, {
            status: production_job_entity_1.ProductionStatus.COMPLETED,
            end_time: new Date(),
        });
        return this.productionRepo.findOne({ where: { id: jobId } });
    }
    async getJobsByOrder(orderId) {
        return this.productionRepo.find({ where: { order_id: orderId } });
    }
};
exports.ProductionService = ProductionService;
exports.ProductionService = ProductionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(production_job_entity_1.ProductionJob)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductionService);
//# sourceMappingURL=production.service.js.map