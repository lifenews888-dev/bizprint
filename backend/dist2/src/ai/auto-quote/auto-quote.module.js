"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoQuoteModule = void 0;
const common_1 = require("@nestjs/common");
const auto_quote_controller_1 = require("./auto-quote.controller");
const auto_quote_service_1 = require("./auto-quote.service");
const imposition_module_1 = require("../imposition/imposition.module");
const gang_run_module_1 = require("../gang-run/gang-run.module");
const print_cost_module_1 = require("../print-cost/print-cost.module");
let AutoQuoteModule = class AutoQuoteModule {
};
exports.AutoQuoteModule = AutoQuoteModule;
exports.AutoQuoteModule = AutoQuoteModule = __decorate([
    (0, common_1.Module)({
        imports: [
            imposition_module_1.ImpositionModule,
            gang_run_module_1.GangRunModule,
            print_cost_module_1.PrintCostModule
        ],
        controllers: [auto_quote_controller_1.AutoQuoteController],
        providers: [auto_quote_service_1.AutoQuoteService],
        exports: [auto_quote_service_1.AutoQuoteService]
    })
], AutoQuoteModule);
//# sourceMappingURL=auto-quote.module.js.map