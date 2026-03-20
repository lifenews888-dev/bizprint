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
exports.PrepressController = void 0;
const common_1 = require("@nestjs/common");
const prepress_ai_engine_1 = require("./prepress-ai.engine");
let PrepressController = class PrepressController {
    check(body) {
        const result = prepress_ai_engine_1.PrepressAIEngine.analyze({
            dpi: body.dpi,
            bleed_mm: body.bleed_mm,
            color_mode: body.color_mode,
            fonts_embedded: body.fonts_embedded,
            page_width_mm: body.page_width_mm,
            page_height_mm: body.page_height_mm
        });
        return result;
    }
};
exports.PrepressController = PrepressController;
__decorate([
    (0, common_1.Post)('check'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PrepressController.prototype, "check", null);
exports.PrepressController = PrepressController = __decorate([
    (0, common_1.Controller)('ai/prepress')
], PrepressController);
//# sourceMappingURL=prepress.controller.js.map