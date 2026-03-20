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
exports.QuoteFromFileController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const quote_from_file_service_1 = require("./quote-from-file.service");
let QuoteFromFileController = class QuoteFromFileController {
    constructor(service) {
        this.service = service;
    }
    async quote(file) {
        return this.service.process(file);
    }
};
exports.QuoteFromFileController = QuoteFromFileController;
__decorate([
    (0, common_1.Post)('quote-from-file'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuoteFromFileController.prototype, "quote", null);
exports.QuoteFromFileController = QuoteFromFileController = __decorate([
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [quote_from_file_service_1.QuoteFromFileService])
], QuoteFromFileController);
//# sourceMappingURL=quote-from-file.controller.js.map