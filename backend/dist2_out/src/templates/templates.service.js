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
exports.TemplatesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const template_entity_1 = require("./template.entity");
let TemplatesService = class TemplatesService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll(query = {}) {
        const where = {};
        if (query.category)
            where.category = query.category;
        if (query.status)
            where.status = query.status;
        else
            where.status = 'approved';
        if (query.designer_id)
            where.designer_id = query.designer_id;
        return this.repo.find({ where, order: { sort_order: 'ASC', created_at: 'DESC' } });
    }
    findOne(id) {
        return this.repo.findOne({ where: { id } });
    }
    create(data) {
        return this.repo.save(this.repo.create({ ...data, status: 'pending' }));
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findOne(id);
    }
    async approve(id) {
        await this.repo.update(id, { status: 'approved' });
        return this.findOne(id);
    }
    async reject(id) {
        await this.repo.update(id, { status: 'rejected' });
        return this.findOne(id);
    }
    async incrementUse(id) {
        await this.repo.increment({ id }, 'use_count', 1);
    }
    remove(id) {
        return this.repo.delete(id);
    }
    findPending() {
        return this.repo.find({ where: { status: 'pending' }, order: { created_at: 'ASC' } });
    }
    findByDesigner(designer_id) {
        return this.repo.find({ where: { designer_id }, order: { created_at: 'DESC' } });
    }
};
exports.TemplatesService = TemplatesService;
exports.TemplatesService = TemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(template_entity_1.Template)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TemplatesService);
//# sourceMappingURL=templates.service.js.map