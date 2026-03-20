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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const vendor_entity_1 = require("../vendors/vendor.entity");
const order_entity_1 = require("../orders/entities/order.entity");
const machine_entity_1 = require("../machines/machine.entity");
const production_job_entity_1 = require("../production/entities/production-job.entity");
const user_entity_1 = require("../users/user.entity");
let AdminService = class AdminService {
    constructor(vendorRepo, orderRepo, machineRepo, productionRepo, userRepo) {
        this.vendorRepo = vendorRepo;
        this.orderRepo = orderRepo;
        this.machineRepo = machineRepo;
        this.productionRepo = productionRepo;
        this.userRepo = userRepo;
    }
    async getUsers() { return this.userRepo.find(); }
    async getVendors() { return this.vendorRepo.find(); }
    async getMachines() { return this.machineRepo.find(); }
    async getOrders() { return this.orderRepo.find({ relations: ['customer', 'product'] }); }
    async getProductionJobs() { return this.productionRepo.find(); }
    async updateUserRole(id, role) {
        await this.userRepo.update(id, { role });
        return this.userRepo.findOne({ where: { id } });
    }
    async getStats() {
        const [users, orders, vendors, machines, production] = await Promise.all([
            this.userRepo.count(), this.orderRepo.count(), this.vendorRepo.count(),
            this.machineRepo.count(), this.productionRepo.count(),
        ]);
        return { users, orders, vendors, machines, production };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(vendor_entity_1.Vendor)),
    __param(1, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(2, (0, typeorm_1.InjectRepository)(machine_entity_1.Machine)),
    __param(3, (0, typeorm_1.InjectRepository)(production_job_entity_1.ProductionJob)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map