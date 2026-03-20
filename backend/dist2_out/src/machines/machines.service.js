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
exports.MachinesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const machine_entity_1 = require("./machine.entity");
let MachinesService = class MachinesService {
    constructor(machineRepo) {
        this.machineRepo = machineRepo;
    }
    async createMachine(data) {
        const machine = this.machineRepo.create(data);
        return this.machineRepo.save(machine);
    }
    async getAllMachines() {
        return this.machineRepo.find();
    }
    async getMachine(id) {
        return this.machineRepo.findOne({ where: { id } });
    }
    async updateStatus(id, status) {
        await this.machineRepo.update(id, { status });
        return this.machineRepo.findOne({ where: { id } });
    }
    async deleteMachine(id) {
        await this.machineRepo.delete(id);
        return { message: 'Машин устгагдлаа' };
    }
};
exports.MachinesService = MachinesService;
exports.MachinesService = MachinesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(machine_entity_1.Machine)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MachinesService);
//# sourceMappingURL=machines.service.js.map