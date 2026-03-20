"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangrunService = void 0;
const common_1 = require("@nestjs/common");
let GangrunService = class GangrunService {
    calculate(data) {
        const sheetCapacity = data.sheetCapacity;
        const orders = data.orders;
        if (!Array.isArray(orders)) {
            return { error: 'orders must be an array' };
        }
        const totalOrders = orders.reduce((sum, val) => sum + val, 0);
        const sheetsNeeded = Math.ceil(totalOrders / sheetCapacity);
        const waste = sheetsNeeded * sheetCapacity - totalOrders;
        return {
            total_orders: totalOrders,
            sheet_capacity: sheetCapacity,
            sheets_needed: sheetsNeeded,
            waste_capacity: waste
        };
    }
};
exports.GangrunService = GangrunService;
exports.GangrunService = GangrunService = __decorate([
    (0, common_1.Injectable)()
], GangrunService);
//# sourceMappingURL=gangrun.service.js.map