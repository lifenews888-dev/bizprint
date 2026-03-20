"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImpositionEngine = void 0;
class ImpositionEngine {
    static calculate(input) {
        const bleed = input.bleed_mm || 0;
        const productWidth = input.product_width_mm + bleed * 2;
        const productHeight = input.product_height_mm + bleed * 2;
        const colsNormal = Math.floor(input.sheet_width_mm / productWidth);
        const rowsNormal = Math.floor(input.sheet_height_mm / productHeight);
        const normalCount = colsNormal * rowsNormal;
        const colsRot = Math.floor(input.sheet_width_mm / productHeight);
        const rowsRot = Math.floor(input.sheet_height_mm / productWidth);
        const rotatedCount = colsRot * rowsRot;
        if (rotatedCount > normalCount) {
            return {
                per_sheet: rotatedCount,
                columns: colsRot,
                rows: rowsRot,
                rotated: true
            };
        }
        return {
            per_sheet: normalCount,
            columns: colsNormal,
            rows: rowsNormal,
            rotated: false
        };
    }
}
exports.ImpositionEngine = ImpositionEngine;
//# sourceMappingURL=imposition.engine.js.map