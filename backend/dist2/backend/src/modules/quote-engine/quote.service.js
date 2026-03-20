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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteService = void 0;
const common_1 = require("@nestjs/common");
const parser_service_1 = require("./parser.service");
const pricing_service_1 = require("./pricing.service");
const machine_service_1 = require("./machine.service");
let QuoteService = class QuoteService {
    constructor(parser, pricing, machine) {
        this.parser = parser;
        this.pricing = pricing;
        this.machine = machine;
    }
    async analyze(fileUrl, quantity) {
        const specs = await this.parser.parse(fileUrl);
        const machine = this.machine.select(specs, quantity);
        const price = this.pricing.calculate(specs, machine, quantity);
        return {
            specs,
            machine,
            price,
        };
    }
};
exports.QuoteService = QuoteService;
exports.QuoteService = QuoteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [parser_service_1.ParserService,
        pricing_service_1.PricingService,
        machine_service_1.MachineService])
], QuoteService);
//# sourceMappingURL=quote.service.js.map