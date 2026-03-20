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
exports.ProductionJobsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const production_job_entity_1 = require("./production-job.entity");
const order_entity_1 = require("../orders/entities/order.entity");
let ProductionJobsService = class ProductionJobsService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll() {
        return this.repo.find({
            relations: ['order', 'order.customer'],
            order: { created_at: 'DESC' },
        });
    }
    async updateStatus(id, status) {
        const job = await this.repo.findOne({ where: { id }, relations: ['order'] });
        if (!job)
            throw new common_1.NotFoundException('Job not found');
        job.status = status;
        await this.repo.save(job);
        if (status === production_job_entity_1.ProductionJobStatus.COMPLETED && job.order) {
            try {
                const orderRepo = this.repo.manager.getRepository(order_entity_1.Order);
                await orderRepo.update(job.order.id, { status: 'completed' });
            }
            catch (e) {
                console.log('Order status update error:', e.message);
            }
        }
        return job;
    }
    async createFromOrder(orderId) {
        const id = String(orderId);
        const existing = await this.repo.findOne({
            where: { order: { id: id } },
            relations: ['order'],
        });
        if (existing)
            return existing;
        const job = this.repo.create({
            order: { id: id },
            status: production_job_entity_1.ProductionJobStatus.PENDING,
        });
        return this.repo.save(job);
    }
};
exports.ProductionJobsService = ProductionJobsService;
exports.ProductionJobsService = ProductionJobsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(production_job_entity_1.ProductionJob)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductionJobsService);
//# sourceMappingURL=production-jobs.service.js.map