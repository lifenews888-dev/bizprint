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
exports.GangRunController = void 0;
const common_1 = require("@nestjs/common");
const gang_run_service_1 = require("./gang-run.service");
let GangRunController = class GangRunController {
    constructor(service) {
        this.service = service;
    }
    optimize(body) {
        return this.service.optimize(body.orders, body.sheet_capacity);
    }
};
exports.GangRunController = GangRunController;
__decorate([
    (0, common_1.Post)('optimize'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GangRunController.prototype, "optimize", null);
exports.GangRunController = GangRunController = __decorate([
    (0, common_1.Controller)('ai/gang-run'),
    __metadata("design:paramtypes", [gang_run_service_1.GangRunService])
], GangRunController);
//# sourceMappingURL=gang-run.controller.js.map