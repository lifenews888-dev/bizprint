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
exports.AuditTrailService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_trail_entity_1 = require("./audit-trail.entity");
let AuditTrailService = class AuditTrailService {
    constructor(repo) {
        this.repo = repo;
    }
    async create(data) {
        const entry = this.repo.create(data);
        return this.repo.save(entry);
    }
    async getByOrderId(orderId) {
        return this.repo.find({
            where: { order_id: orderId },
            order: { created_at: 'DESC' },
        });
    }
    async bulkCreate(entries) {
        const items = entries.map(e => this.repo.create(e));
        return this.repo.save(items);
    }
};
exports.AuditTrailService = AuditTrailService;
exports.AuditTrailService = AuditTrailService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_trail_entity_1.AuditTrail)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuditTrailService);
//# sourceMappingURL=audit-trail.service.js.map