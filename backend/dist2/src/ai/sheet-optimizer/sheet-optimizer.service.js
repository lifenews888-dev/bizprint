"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheetOptimizerService = void 0;
const common_1 = require("@nestjs/common");
let SheetOptimizerService = class SheetOptimizerService {
    optimize(body) {
        const sheetW = body.sheet_width_mm;
        const sheetH = body.sheet_height_mm;
        const itemW = body.item_width_mm;
        const itemH = body.item_height_mm;
        const bleed = body.bleed_mm ?? 3;
        const gap = body.gap_mm ?? 5;
        const w = itemW + bleed * 2;
        const h = itemH + bleed * 2;
        const cols = Math.floor(sheetW / (w + gap));
        const rows = Math.floor(sheetH / (h + gap));
        const total = cols * rows;
        const rCols = Math.floor(sheetW / (h + gap));
        const rRows = Math.floor(sheetH / (w + gap));
        const rTotal = rCols * rRows;
        let best = {
            orientation: "normal",
            cols,
            rows,
            total
        };
        if (rTotal > total) {
            best = {
                orientation: "rotated",
                cols: rCols,
                rows: rRows,
                total: rTotal
            };
        }
        const sheetArea = sheetW * sheetH;
        const usedArea = best.total * itemW * itemH;
        const waste = sheetArea - usedArea;
        const wastePercent = (waste / sheetArea) * 100;
        return {
            layout: best,
            waste_percent: Number(wastePercent.toFixed(2))
        };
    }
};
exports.SheetOptimizerService = SheetOptimizerService;
exports.SheetOptimizerService = SheetOptimizerService = __decorate([
    (0, common_1.Injectable)()
], SheetOptimizerService);
//# sourceMappingURL=sheet-optimizer.service.js.map