"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintQuoteService = void 0;
const common_1 = require("@nestjs/common");
let PrintQuoteService = class PrintQuoteService {
    calculate(data) {
        const paperPrices = {
            A4: 120,
            A3: 220
        };
        const printPrices = {
            bw: 40,
            color: 120
        };
        const paper_cost = paperPrices[data.paper_size] *
            data.quantity *
            data.pages;
        const print_cost = printPrices[data.color_mode] *
            data.quantity *
            data.pages;
        const total = paper_cost + print_cost;
        return {
            paper_cost,
            print_cost,
            total_price: total
        };
    }
};
exports.PrintQuoteService = PrintQuoteService;
exports.PrintQuoteService = PrintQuoteService = __decorate([
    (0, common_1.Injectable)()
], PrintQuoteService);
//# sourceMappingURL=print-quote.service.js.map