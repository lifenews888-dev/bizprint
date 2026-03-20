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
exports.ReferralService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const referral_entity_1 = require("./referral.entity");
let ReferralService = class ReferralService {
    constructor(repo) {
        this.repo = repo;
    }
    async getOrCreate(userId) {
        let ref = await this.repo.findOne({ where: { sales_user_id: userId } });
        if (!ref) {
            const code = userId.slice(0, 8).toUpperCase();
            ref = this.repo.create({ sales_user_id: userId, code, commission_rate: 10 });
            await this.repo.save(ref);
        }
        return ref;
    }
    async getStats(userId) {
        const ref = await this.repo.findOne({ where: { sales_user_id: userId } });
        if (!ref)
            return { code: null, total_commission: 0, referral_count: 0 };
        const count = await this.repo.count({ where: { code: ref.code } });
        return {
            code: ref.code,
            commission_rate: ref.commission_rate,
            total_commission: ref.total_commission,
            referral_count: count,
            is_active: ref.is_active,
        };
    }
    async findByCode(code) {
        return this.repo.findOne({ where: { code } });
    }
};
exports.ReferralService = ReferralService;
exports.ReferralService = ReferralService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(referral_entity_1.Referral)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ReferralService);
//# sourceMappingURL=referral.service.js.map