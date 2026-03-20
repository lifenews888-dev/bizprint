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
exports.QuotesV2Service = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const quote_v2_entity_1 = require("./quote-v2.entity");
let QuotesV2Service = class QuotesV2Service {
    constructor(repo) {
        this.repo = repo;
    }
    async generateNumber() {
        const today = new Date();
        const d = today.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await this.repo.count();
        return 'QT-' + d + '-' + String(count + 1).padStart(3, '0');
    }
    async create(data) {
        const quote_number = await this.generateNumber();
        const valid_until = new Date();
        valid_until.setDate(valid_until.getDate() + 3);
        const q = this.repo.create({ ...data, quote_number, valid_until, status: 'sent' });
        return this.repo.save(q);
    }
    findAll() {
        return this.repo.find({ order: { created_at: 'DESC' } });
    }
    findOne(id) {
        return this.repo.findOne({ where: { id } });
    }
    findByNumber(quote_number) {
        return this.repo.findOne({ where: { quote_number } });
    }
    async findToday() {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        return this.repo.find({
            where: { created_at: (0, typeorm_2.Between)(start, end) },
            order: { created_at: 'ASC' },
        });
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findOne(id);
    }
    async markExpired() {
        const now = new Date();
        await this.repo
            .createQueryBuilder()
            .update(quote_v2_entity_1.QuoteV2)
            .set({ status: 'expired' })
            .where('valid_until < :now AND status NOT IN (:...statuses)', {
            now, statuses: ['ordered', 'expired'],
        })
            .execute();
    }
};
exports.QuotesV2Service = QuotesV2Service;
exports.QuotesV2Service = QuotesV2Service = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quote_v2_entity_1.QuoteV2)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], QuotesV2Service);
//# sourceMappingURL=quotes-v2.service.js.map