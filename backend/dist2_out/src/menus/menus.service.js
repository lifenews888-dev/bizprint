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
exports.MenusService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const menu_entity_1 = require("./menu.entity");
let MenusService = class MenusService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll() {
        return this.repo.find({ order: { order: 'ASC' } });
    }
    findByLocation(location) {
        return this.repo.find({
            where: { location, isActive: true },
            order: { order: 'ASC' },
        });
    }
    findOne(id) {
        return this.repo.findOne({ where: { id } });
    }
    create(data) {
        return this.repo.save(this.repo.create(data));
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findOne(id);
    }
    async remove(id) {
        await this.repo.delete(id);
        return { success: true };
    }
    async bulkUpdate(items) {
        for (const item of items) {
            if (item.id)
                await this.repo.update(item.id, item);
        }
        return this.findAll();
    }
};
exports.MenusService = MenusService;
exports.MenusService = MenusService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(menu_entity_1.Menu)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MenusService);
//# sourceMappingURL=menus.service.js.map