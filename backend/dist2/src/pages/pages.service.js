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
exports.PagesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const page_entity_1 = require("./page.entity");
let PagesService = class PagesService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll() {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }
    findPublished() {
        return this.repo.find({ where: { isPublished: true }, order: { createdAt: 'DESC' } });
    }
    findByType(type) {
        return this.repo.find({ where: { type, isPublished: true }, order: { createdAt: 'DESC' } });
    }
    async findBySlug(slug) {
        const page = await this.repo.findOne({ where: { slug, isPublished: true } });
        if (!page)
            throw new common_1.NotFoundException('Хуудас олдсонгүй');
        return page;
    }
    findOne(id) {
        return this.repo.findOne({ where: { id } });
    }
    create(data) {
        const page = this.repo.create(data);
        return this.repo.save(page);
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findOne(id);
    }
    async remove(id) {
        await this.repo.delete(id);
        return { success: true };
    }
};
exports.PagesService = PagesService;
exports.PagesService = PagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(page_entity_1.Page)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PagesService);
//# sourceMappingURL=pages.service.js.map