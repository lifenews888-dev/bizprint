"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineSelectorService = void 0;
const common_1 = require("@nestjs/common");
let MachineSelectorService = class MachineSelectorService {
    constructor() {
        this.machines = [
            {
                name: 'Digital Press',
                type: 'digital',
                max_sheet: [330, 480],
                speed_per_hour: 2000,
                setup_cost: 2000,
                run_cost: 0.5
            },
            {
                name: 'Offset 4 Color',
                type: 'offset',
                max_sheet: [520, 740],
                speed_per_hour: 8000,
                setup_cost: 15000,
                run_cost: 0.2
            },
            {
                name: 'Large Format Printer',
                type: 'large_format',
                max_sheet: [1600, 5000],
                speed_per_hour: 100,
                setup_cost: 5000,
                run_cost: 5
            }
        ];
    }
    select(job) {
        let bestMachine = null;
        for (const machine of this.machines) {
            const fits = job.width <= machine.max_sheet[0] &&
                job.height <= machine.max_sheet[1];
            if (!fits)
                continue;
            const productionHours = job.quantity / machine.speed_per_hour;
            const cost = machine.setup_cost +
                productionHours * machine.run_cost * job.quantity;
            if (!bestMachine || cost < bestMachine.cost) {
                bestMachine = {
                    ...machine,
                    cost
                };
            }
        }
        return {
            selected_machine: bestMachine?.name,
            machine_type: bestMachine?.type,
            estimated_cost: bestMachine?.cost
        };
    }
};
exports.MachineSelectorService = MachineSelectorService;
exports.MachineSelectorService = MachineSelectorService = __decorate([
    (0, common_1.Injectable)()
], MachineSelectorService);
//# sourceMappingURL=machine-selector.service.js.map