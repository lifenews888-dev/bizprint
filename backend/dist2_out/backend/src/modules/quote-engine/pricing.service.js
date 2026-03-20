"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
let PricingService = class PricingService {
    calculate(specs, machine, quantity) {
        const costPerPage = specs.color === 'BW' ? 15 : 50;
        const materialCost = specs.pages * costPerPage * quantity;
        const machineCost = machine.type === 'offset' ? 5000 : 2000;
        const laborCost = 3000;
        const margin = 0.2;
        const total = (materialCost + machineCost + laborCost) * (1 + margin);
        return {
            materialCost,
            machineCost,
            laborCost,
            total: Math.round(total),
        };
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)()
], PricingService);
//# sourceMappingURL=pricing.service.js.map