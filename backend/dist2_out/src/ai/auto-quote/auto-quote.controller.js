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
exports.AutoQuoteController = void 0;
const common_1 = require("@nestjs/common");
const auto_quote_service_1 = require("./auto-quote.service");
let AutoQuoteController = class AutoQuoteController {
    constructor(service) {
        this.service = service;
    }
    calculate(body) {
        return this.service.calculate(body);
    }
};
exports.AutoQuoteController = AutoQuoteController;
__decorate([
    (0, common_1.Post)('calculate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AutoQuoteController.prototype, "calculate", null);
exports.AutoQuoteController = AutoQuoteController = __decorate([
    (0, common_1.Controller)('ai/auto-quote'),
    __metadata("design:paramtypes", [auto_quote_service_1.AutoQuoteService])
], AutoQuoteController);
//# sourceMappingURL=auto-quote.controller.js.map