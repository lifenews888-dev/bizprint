"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintEngineService = void 0;
const common_1 = require("@nestjs/common");
let PrintEngineService = class PrintEngineService {
    run(data) {
        const quote = this.calculateQuote(data);
        const machine = this.selectMachine(data);
        const gang = this.optimizeGangRun(data);
        const production = this.scheduleProduction(data);
        const price = this.calculatePrice(quote, production);
        return {
            quote,
            machine,
            gang,
            production,
            price
        };
    }
    calculateQuote(data) {
        const sheets = Math.ceil(data.quantity / data.imposition);
        return {
            sheets,
            pages: data.pages
        };
    }
    selectMachine(data) {
        if (data.quantity > 5000) {
            return "OFFSET";
        }
        return "DIGITAL";
    }
    optimizeGangRun(data) {
        return {
            sheet_usage: "optimized"
        };
    }
    scheduleProduction(data) {
        const minutes = Math.ceil(data.quantity / data.machine_speed);
        return {
            production_minutes: minutes
        };
    }
    calculatePrice(quote, production) {
        const paper = quote.sheets * 0.02;
        const machine = production.production_minutes * 0.5;
        return {
            total_price: paper + machine
        };
    }
};
exports.PrintEngineService = PrintEngineService;
exports.PrintEngineService = PrintEngineService = __decorate([
    (0, common_1.Injectable)()
], PrintEngineService);
//# sourceMappingURL=print-engine.service.js.map