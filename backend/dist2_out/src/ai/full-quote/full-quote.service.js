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
exports.FullQuoteService = void 0;
const common_1 = require("@nestjs/common");
const pdf_inspector_service_1 = require("../pdf-inspector/pdf-inspector.service");
const print_size_service_1 = require("../print-size/print-size.service");
const imposition_service_1 = require("../imposition/imposition.service");
const gang_run_service_1 = require("../gang-run/gang-run.service");
const machine_selector_service_1 = require("../machine-selector/machine-selector.service");
const print_cost_service_1 = require("../print-cost/print-cost.service");
let FullQuoteService = class FullQuoteService {
    constructor(pdfInspector, printSize, imposition, gangRun, machineSelector, printCost) {
        this.pdfInspector = pdfInspector;
        this.printSize = printSize;
        this.imposition = imposition;
        this.gangRun = gangRun;
        this.machineSelector = machineSelector;
        this.printCost = printCost;
    }
    async calculate(file) {
        const pdf = await this.pdfInspector.inspect(file.buffer);
        const width = 90;
        const height = 50;
        const size = this.printSize.detect(width, height);
        const layout = this.imposition.calculate(297, 420, size.width_mm, size.height_mm);
        const perSheet = layout.best_layout.total_per_sheet;
        const gang = this.gangRun.optimize([{ id: 1, quantity: 5000 }], perSheet);
        const machine = this.machineSelector.select({
            width: size.width_mm,
            height: size.height_mm,
            quantity: 5000
        });
        const cost = this.printCost.calculate({
            sheet_cost: 1200,
            total_sheets: gang.total_sheets || gang.sheets || 100,
            machine_cost_per_hour: 50000,
            production_minutes: 20
        });
        return {
            pdf_analysis: pdf,
            size,
            layout,
            gang_run: gang,
            machine,
            cost,
            price: cost.final_price
        };
    }
};
exports.FullQuoteService = FullQuoteService;
exports.FullQuoteService = FullQuoteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pdf_inspector_service_1.PdfInspectorService,
        print_size_service_1.PrintSizeService,
        imposition_service_1.ImpositionService,
        gang_run_service_1.GangRunService,
        machine_selector_service_1.MachineSelectorService,
        print_cost_service_1.PrintCostService])
], FullQuoteService);
//# sourceMappingURL=full-quote.service.js.map