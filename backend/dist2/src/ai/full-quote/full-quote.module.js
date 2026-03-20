"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FullQuoteModule = void 0;
const common_1 = require("@nestjs/common");
const full_quote_controller_1 = require("./full-quote.controller");
const full_quote_service_1 = require("./full-quote.service");
const pdf_inspector_module_1 = require("../pdf-inspector/pdf-inspector.module");
const print_size_module_1 = require("../print-size/print-size.module");
const imposition_module_1 = require("../imposition/imposition.module");
const gang_run_module_1 = require("../gang-run/gang-run.module");
const machine_selector_module_1 = require("../machine-selector/machine-selector.module");
const print_cost_module_1 = require("../print-cost/print-cost.module");
let FullQuoteModule = class FullQuoteModule {
};
exports.FullQuoteModule = FullQuoteModule;
exports.FullQuoteModule = FullQuoteModule = __decorate([
    (0, common_1.Module)({
        imports: [
            pdf_inspector_module_1.PdfInspectorModule,
            print_size_module_1.PrintSizeModule,
            imposition_module_1.ImpositionModule,
            gang_run_module_1.GangRunModule,
            machine_selector_module_1.MachineSelectorModule,
            print_cost_module_1.PrintCostModule
        ],
        controllers: [full_quote_controller_1.FullQuoteController],
        providers: [full_quote_service_1.FullQuoteService]
    })
], FullQuoteModule);
//# sourceMappingURL=full-quote.module.js.map