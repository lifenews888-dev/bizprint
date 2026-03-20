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
exports.QuoteEngineController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const quote_engine_service_1 = require("./quote-engine.service");
let QuoteEngineController = class QuoteEngineController {
    constructor(svc) {
        this.svc = svc;
    }
    async calculate(body) {
        return this.svc.calculate({
            quantity: Number(body.quantity) || 100,
            pages: Number(body.pages) || 1,
            width_mm: Number(body.width_mm) || 210,
            height_mm: Number(body.height_mm) || 297,
            color_mode: body.color_mode || 'color',
            sides: body.sides || 'single',
            paper_gsm: Number(body.paper_gsm) || 150,
            finishing: body.finishing || 'none',
            binding: body.binding || 'none',
        });
    }
    async fromPdf(file, body) {
        return this.svc.calculateFromPdf(file, {
            quantity: Number(body.quantity) || 100,
            color_mode: body.color_mode || 'color',
            sides: body.sides || 'single',
            paper_gsm: Number(body.paper_gsm) || 150,
            finishing: body.finishing || 'none',
            binding: body.binding || 'none',
        });
    }
};
exports.QuoteEngineController = QuoteEngineController;
__decorate([
    (0, common_1.Post)('calculate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuoteEngineController.prototype, "calculate", null);
__decorate([
    (0, common_1.Post)('from-pdf'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], QuoteEngineController.prototype, "fromPdf", null);
exports.QuoteEngineController = QuoteEngineController = __decorate([
    (0, common_1.Controller)('quote-engine'),
    __metadata("design:paramtypes", [quote_engine_service_1.QuoteEngineService])
], QuoteEngineController);
//# sourceMappingURL=quote-engine.controller.js.map