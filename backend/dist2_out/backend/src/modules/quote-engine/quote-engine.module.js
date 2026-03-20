"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteEngineModule = void 0;
const common_1 = require("@nestjs/common");
const quote_controller_1 = require("./quote.controller");
const quote_service_1 = require("./quote.service");
const parser_service_1 = require("./parser.service");
const pricing_service_1 = require("./pricing.service");
const machine_service_1 = require("./machine.service");
let QuoteEngineModule = class QuoteEngineModule {
};
exports.QuoteEngineModule = QuoteEngineModule;
exports.QuoteEngineModule = QuoteEngineModule = __decorate([
    (0, common_1.Module)({
        controllers: [quote_controller_1.QuoteController],
        providers: [
            quote_service_1.QuoteService,
            parser_service_1.ParserService,
            pricing_service_1.PricingService,
            machine_service_1.MachineService,
        ],
    })
], QuoteEngineModule);
//# sourceMappingURL=quote-engine.module.js.map