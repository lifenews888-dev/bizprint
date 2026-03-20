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
exports.FactoriesController = void 0;
const common_1 = require("@nestjs/common");
const factories_service_1 = require("./factories.service");
let FactoriesController = class FactoriesController {
    constructor(factoriesService) {
        this.factoriesService = factoriesService;
    }
    getAll() {
        return this.factoriesService.findAll();
    }
    selectFactory(body) {
        const { machine_type, quantity } = body;
        return this.factoriesService.selectBestFactory(machine_type, quantity);
    }
};
exports.FactoriesController = FactoriesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], FactoriesController.prototype, "getAll", null);
__decorate([
    (0, common_1.Post)('select'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], FactoriesController.prototype, "selectFactory", null);
exports.FactoriesController = FactoriesController = __decorate([
    (0, common_1.Controller)('factories'),
    __metadata("design:paramtypes", [factories_service_1.FactoriesService])
], FactoriesController);
//# sourceMappingURL=factories.controller.js.map