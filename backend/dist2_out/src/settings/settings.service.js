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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const settings_entity_1 = require("./settings.entity");
let SettingsService = class SettingsService {
    constructor(repo) {
        this.repo = repo;
    }
    async getAll() {
        const settings = await this.repo.find();
        const result = {};
        settings.forEach(s => (result[s.key] = s.value));
        return result;
    }
    async get(key) {
        const s = await this.repo.findOne({ where: { key } });
        return s ? s.value : null;
    }
    async set(key, value, type = 'text', label = '') {
        let s = await this.repo.findOne({ where: { key } });
        if (s) {
            s.value = value;
            s.type = type;
            if (label)
                s.label = label;
        }
        else {
            s = this.repo.create({ key, value, type, label });
        }
        return this.repo.save(s);
    }
    async bulkSet(data) {
        for (const [key, value] of Object.entries(data)) {
            await this.set(key, value);
        }
    }
    async delete(key) {
        await this.repo.delete({ key });
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(settings_entity_1.Setting)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SettingsService);
//# sourceMappingURL=settings.service.js.map