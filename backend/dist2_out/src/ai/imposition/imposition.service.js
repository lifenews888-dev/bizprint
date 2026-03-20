"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImpositionService = void 0;
const common_1 = require("@nestjs/common");
let ImpositionService = class ImpositionService {
    calculateFit(sheetW, sheetH, itemW, itemH) {
        const horizontal = Math.floor(sheetW / itemW);
        const vertical = Math.floor(sheetH / itemH);
        const total = horizontal * vertical;
        const usedW = horizontal * itemW;
        const usedH = vertical * itemH;
        const wasteArea = (sheetW * sheetH) - (usedW * usedH);
        return {
            horizontal,
            vertical,
            total,
            wasteArea
        };
    }
    calculate(sheetW, sheetH, itemW, itemH) {
        const normal = this.calculateFit(sheetW, sheetH, itemW, itemH);
        const rotated = this.calculateFit(sheetW, sheetH, itemH, itemW);
        let best = normal;
        let orientation = "NORMAL";
        if (rotated.total > normal.total) {
            best = rotated;
            orientation = "ROTATED";
        }
        return {
            sheet: {
                width: sheetW,
                height: sheetH
            },
            item: {
                width: itemW,
                height: itemH
            },
            layouts: {
                normal,
                rotated
            },
            best_layout: {
                orientation,
                horizontal_fit: best.horizontal,
                vertical_fit: best.vertical,
                total_per_sheet: best.total,
                waste_area: best.wasteArea
            }
        };
    }
};
exports.ImpositionService = ImpositionService;
exports.ImpositionService = ImpositionService = __decorate([
    (0, common_1.Injectable)()
], ImpositionService);
//# sourceMappingURL=imposition.service.js.map