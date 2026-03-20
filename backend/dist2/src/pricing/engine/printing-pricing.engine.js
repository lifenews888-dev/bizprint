"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintingPricingEngine = void 0;
const imposition_engine_1 = require("./imposition.engine");
class PrintingPricingEngine {
    static calculate(config) {
        const imposition = imposition_engine_1.ImpositionEngine.calculate({
            sheet_width_mm: 450,
            sheet_height_mm: 320,
            product_width_mm: config.product_width_mm,
            product_height_mm: config.product_height_mm,
            bleed_mm: 3
        });
        const quantity = config.quantity;
        const sheetsNeeded = Math.ceil(quantity / imposition.per_sheet);
        const wasteFactor = 1.05;
        const sheetsWithWaste = Math.ceil(sheetsNeeded * wasteFactor);
        const paperPrice = 150;
        const machineRate = 20000;
        const machineSpeed = 5000;
        const laborCost = 5000;
        const setupCost = 10000;
        const paperCost = sheetsWithWaste * paperPrice;
        const machineCost = (sheetsWithWaste / machineSpeed) * machineRate;
        const productionCost = paperCost +
            machineCost +
            laborCost +
            setupCost;
        const platformMargin = 0.25;
        const finalPrice = productionCost * (1 + platformMargin);
        return {
            quantity,
            per_sheet: imposition.per_sheet,
            sheets_needed: sheetsWithWaste,
            paper_cost: paperCost,
            machine_cost: machineCost,
            production_cost: productionCost,
            final_price: finalPrice
        };
    }
}
exports.PrintingPricingEngine = PrintingPricingEngine;
//# sourceMappingURL=printing-pricing.engine.js.map