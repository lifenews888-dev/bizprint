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
exports.PrintSizeController = void 0;
const common_1 = require("@nestjs/common");
const print_size_service_1 = require("./print-size.service");
let PrintSizeController = class PrintSizeController {
    constructor(service) {
        this.service = service;
    }
    detect(body) {
        return this.service.detect(Number(body.width_mm), Number(body.height_mm));
    }
};
exports.PrintSizeController = PrintSizeController;
__decorate([
    (0, common_1.Post)('detect'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PrintSizeController.prototype, "detect", null);
exports.PrintSizeController = PrintSizeController = __decorate([
    (0, common_1.Controller)('ai/print-size'),
    __metadata("design:paramtypes", [print_size_service_1.PrintSizeService])
], PrintSizeController);
//# sourceMappingURL=print-size.controller.js.map