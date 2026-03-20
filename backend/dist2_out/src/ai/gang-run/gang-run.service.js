"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangRunService = void 0;
const common_1 = require("@nestjs/common");
let GangRunService = class GangRunService {
    optimize(orders, sheetCapacity) {
        const result = [];
        let currentSheet = [];
        let remaining = sheetCapacity;
        for (const order of orders) {
            let qty = order.quantity;
            while (qty > 0) {
                if (qty <= remaining) {
                    currentSheet.push({
                        order_id: order.id,
                        qty: qty
                    });
                    remaining -= qty;
                    qty = 0;
                }
                else {
                    currentSheet.push({
                        order_id: order.id,
                        qty: remaining
                    });
                    qty -= remaining;
                    result.push(currentSheet);
                    currentSheet = [];
                    remaining = sheetCapacity;
                }
            }
        }
        if (currentSheet.length > 0) {
            result.push(currentSheet);
        }
        return {
            sheet_capacity: sheetCapacity,
            sheets: result,
            total_sheets: result.length
        };
    }
};
exports.GangRunService = GangRunService;
exports.GangRunService = GangRunService = __decorate([
    (0, common_1.Injectable)()
], GangRunService);
//# sourceMappingURL=gang-run.service.js.map