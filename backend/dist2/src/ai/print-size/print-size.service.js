"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintSizeService = void 0;
const common_1 = require("@nestjs/common");
let PrintSizeService = class PrintSizeService {
    detect(width, height) {
        const sizes = [
            { name: "A6", w: 105, h: 148 },
            { name: "A5", w: 148, h: 210 },
            { name: "A4", w: 210, h: 297 },
            { name: "A3", w: 297, h: 420 }
        ];
        for (const s of sizes) {
            if ((Math.abs(width - s.w) < 5 && Math.abs(height - s.h) < 5) ||
                (Math.abs(width - s.h) < 5 && Math.abs(height - s.w) < 5)) {
                return {
                    detected_size: s.name,
                    width_mm: width,
                    height_mm: height
                };
            }
        }
        return {
            detected_size: "CUSTOM",
            width_mm: width,
            height_mm: height
        };
    }
};
exports.PrintSizeService = PrintSizeService;
exports.PrintSizeService = PrintSizeService = __decorate([
    (0, common_1.Injectable)()
], PrintSizeService);
//# sourceMappingURL=print-size.service.js.map