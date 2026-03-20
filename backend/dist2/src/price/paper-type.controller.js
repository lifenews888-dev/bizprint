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
exports.PaperTypeController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const paper_type_entity_1 = require("./paper-type.entity");
let PaperTypeController = class PaperTypeController {
    constructor(repo) {
        this.repo = repo;
    }
    async create(data) {
        const paper = this.repo.create(data);
        return await this.repo.save(paper);
    }
    async findAll() {
        return await this.repo.find();
    }
};
exports.PaperTypeController = PaperTypeController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaperTypeController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaperTypeController.prototype, "findAll", null);
exports.PaperTypeController = PaperTypeController = __decorate([
    (0, common_1.Controller)('paper-types'),
    __param(0, (0, typeorm_1.InjectRepository)(paper_type_entity_1.PaperType)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PaperTypeController);
//# sourceMappingURL=paper-type.controller.js.map