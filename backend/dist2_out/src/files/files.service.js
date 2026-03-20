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
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const file_entity_1 = require("./file.entity");
let FilesService = class FilesService {
    constructor(repo) {
        this.repo = repo;
    }
    async findByOrder(orderId) {
        return this.repo.find({
            where: { order_id: orderId },
            order: { version: 'DESC', created_at: 'DESC' },
        });
    }
    async findFinal(orderId) {
        return this.repo.findOne({
            where: { order_id: orderId, is_final: true },
        });
    }
    async getNextVersion(orderId) {
        const latest = await this.repo.findOne({
            where: { order_id: orderId },
            order: { version: 'DESC' },
        });
        return latest ? latest.version + 1 : 1;
    }
    async create(data) {
        const version = await this.getNextVersion(data.order_id);
        const file = this.repo.create({
            ...data,
            version,
            file_type: data.file_type || file_entity_1.FileType.ORIGINAL,
            status: file_entity_1.FileStatus.UPLOADED,
        });
        return this.repo.save(file);
    }
    async updateAnalysis(id, analysis) {
        const file = await this.repo.findOne({ where: { id } });
        if (!file)
            throw new common_1.NotFoundException('File not found');
        file.analysis = analysis;
        file.status = file_entity_1.FileStatus.CHECKING;
        return this.repo.save(file);
    }
    async approve(id) {
        const file = await this.repo.findOne({ where: { id } });
        if (!file)
            throw new common_1.NotFoundException('File not found');
        file.status = file_entity_1.FileStatus.APPROVED;
        return this.repo.save(file);
    }
    async reject(id, notes) {
        const file = await this.repo.findOne({ where: { id } });
        if (!file)
            throw new common_1.NotFoundException('File not found');
        file.status = file_entity_1.FileStatus.REJECTED;
        if (notes)
            file.notes = notes;
        return this.repo.save(file);
    }
    async setFinal(id) {
        const file = await this.repo.findOne({ where: { id } });
        if (!file)
            throw new common_1.NotFoundException('File not found');
        await this.repo.update({ order_id: file.order_id }, { is_final: false });
        file.is_final = true;
        file.status = file_entity_1.FileStatus.APPROVED;
        return this.repo.save(file);
    }
    async findOne(id) {
        const file = await this.repo.findOne({ where: { id } });
        if (!file)
            throw new common_1.NotFoundException('File not found');
        return file;
    }
    async remove(id) {
        await this.repo.delete(id);
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(file_entity_1.File)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], FilesService);
//# sourceMappingURL=files.service.js.map