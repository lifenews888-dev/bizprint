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
exports.PrintQuoteController = void 0;
const common_1 = require("@nestjs/common");
const print_quote_service_1 = require("./print-quote.service");
const create_print_quote_dto_1 = require("./dto/create-print-quote.dto");
let PrintQuoteController = class PrintQuoteController {
    constructor(service) {
        this.service = service;
    }
    calculate(data) {
        return this.service.calculate(data);
    }
};
exports.PrintQuoteController = PrintQuoteController;
__decorate([
    (0, common_1.Post)('calculate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_print_quote_dto_1.CreatePrintQuoteDto]),
    __metadata("design:returntype", void 0)
], PrintQuoteController.prototype, "calculate", null);
exports.PrintQuoteController = PrintQuoteController = __decorate([
    (0, common_1.Controller)('print-quote'),
    __metadata("design:paramtypes", [print_quote_service_1.PrintQuoteService])
], PrintQuoteController);
//# sourceMappingURL=print-quote.controller.js.map