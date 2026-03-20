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
exports.AutoQuoteService = void 0;
const common_1 = require("@nestjs/common");
const imposition_service_1 = require("../imposition/imposition.service");
const gang_run_service_1 = require("../gang-run/gang-run.service");
const print_cost_service_1 = require("../print-cost/print-cost.service");
let AutoQuoteService = class AutoQuoteService {
    constructor(imposition, gangRun, printCost) {
        this.imposition = imposition;
        this.gangRun = gangRun;
        this.printCost = printCost;
    }
    calculate(body) {
        const layout = this.imposition.calculate(body.sheet_width, body.sheet_height, body.item_width, body.item_height);
        const perSheet = layout.best_layout.total_per_sheet;
        const gang = this.gangRun.optimize(body.orders, perSheet);
        const cost = this.printCost.calculate({
            sheet_cost: body.sheet_cost,
            total_sheets: gang.sheets.length,
            machine_cost_per_hour: body.machine_cost_per_hour,
            production_minutes: body.production_minutes
        });
        return {
            layout,
            gang_run: gang,
            cost
        };
    }
};
exports.AutoQuoteService = AutoQuoteService;
exports.AutoQuoteService = AutoQuoteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [imposition_service_1.ImpositionService,
        gang_run_service_1.GangRunService,
        print_cost_service_1.PrintCostService])
], AutoQuoteService);
//# sourceMappingURL=auto-quote.service.js.map