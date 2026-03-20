"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FactoriesService = void 0;
const common_1 = require("@nestjs/common");
let FactoriesService = class FactoriesService {
    constructor() {
        this.factories = [
            { id: 1, name: 'Print Factory A', machine_type: 'Digital Press', speed_per_hour: 5000, setup_cost: 200, run_cost: 0.05, current_load: 20 },
            { id: 2, name: 'Print Factory B', machine_type: 'Offset Press', speed_per_hour: 10000, setup_cost: 500, run_cost: 0.02, current_load: 50 },
            { id: 3, name: 'Print Factory C', machine_type: 'Digital Press', speed_per_hour: 3000, setup_cost: 150, run_cost: 0.06, current_load: 10 },
        ];
    }
    findAll() {
        return this.factories;
    }
    selectBestFactory(machineType, quantity) {
        let bestFactory = null;
        let bestScore = Infinity;
        for (const factory of this.factories) {
            if (factory.machine_type !== machineType)
                continue;
            const productionTime = quantity / factory.speed_per_hour;
            const loadPenalty = factory.current_load * 2;
            const score = factory.setup_cost + (quantity * factory.run_cost) + productionTime + loadPenalty;
            if (score < bestScore) {
                bestScore = score;
                bestFactory = factory;
            }
        }
        return bestFactory;
    }
};
exports.FactoriesService = FactoriesService;
exports.FactoriesService = FactoriesService = __decorate([
    (0, common_1.Injectable)()
], FactoriesService);
//# sourceMappingURL=factories.service.js.map