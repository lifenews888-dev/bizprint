"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const paper_type_entity_1 = require("./paper-type.entity");
const print_size_entity_1 = require("./print-size.entity");
const finish_type_entity_1 = require("./finish-type.entity");
const machine_entity_1 = require("../machines/machine.entity");
let PriceService = class PriceService {
    constructor(paperRepo, sizeRepo, finishRepo, machineRepo) {
        this.paperRepo = paperRepo;
        this.sizeRepo = sizeRepo;
        this.finishRepo = finishRepo;
        this.machineRepo = machineRepo;
    }
    async printQuote(data) {
        const paper = await this.paperRepo.findOne({
            where: { id: data.paper_id }
        });
        if (!paper) {
            throw new common_1.NotFoundException('Paper type not found');
        }
        const size = await this.sizeRepo.findOne({
            where: { id: data.size_id }
        });
        if (!size) {
            throw new common_1.NotFoundException('Print size not found');
        }
        const machines = await this.machineRepo.find();
        let bestMachine = null;
        let bestCost = Infinity;
        let sheet_capacity = 0;
        let sheets_needed = 0;
        let waste_percent = 0;
        for (const machine of machines) {
            const sheet_width = machine.sheet_width_mm;
            const sheet_height = machine.sheet_height_mm;
            const normal_x = Math.floor(sheet_width / size.width_mm);
            const normal_y = Math.floor(sheet_height / size.height_mm);
            const normal_capacity = normal_x * normal_y;
            const rotated_x = Math.floor(sheet_width / size.height_mm);
            const rotated_y = Math.floor(sheet_height / size.width_mm);
            const rotated_capacity = rotated_x * rotated_y;
            const capacity = Math.max(normal_capacity, rotated_capacity);
            if (capacity <= 0)
                continue;
            const sheets = Math.ceil(data.quantity / capacity);
            const run_time = sheets / machine.speed_per_hour;
            const machine_cost = run_time * machine.hour_rate;
            if (machine_cost < bestCost) {
                bestCost = machine_cost;
                bestMachine = machine;
                sheet_capacity = capacity;
                sheets_needed = sheets;
                const sheet_area = sheet_width * sheet_height;
                const used_area = capacity * (size.width_mm * size.height_mm);
                waste_percent =
                    ((sheet_area - used_area) / sheet_area) * 100;
            }
        }
        if (!bestMachine) {
            throw new common_1.NotFoundException('No suitable machine found');
        }
        const paper_cost = sheets_needed * paper.price_per_sheet;
        const production_cost = paper_cost + bestCost;
        const unit_price = production_cost / data.quantity;
        const total_price = production_cost * 1.4;
        return {
            machine: bestMachine.name,
            sheet_capacity,
            sheets_needed,
            paper_cost,
            machine_cost: bestCost,
            production_cost,
            unit_price,
            total_price,
            waste_percent
        };
    }
    async gangQuote(data) {
        const paper = await this.paperRepo.findOne({
            where: { id: data.paper_id }
        });
        if (!paper) {
            throw new common_1.NotFoundException('Paper type not found');
        }
        const size = await this.sizeRepo.findOne({
            where: { id: data.size_id }
        });
        if (!size) {
            throw new common_1.NotFoundException('Print size not found');
        }
        const machines = await this.machineRepo.find();
        let bestMachine = null;
        let bestCost = Infinity;
        let sheet_capacity = 0;
        let sheets_needed = 0;
        const total_quantity = data.orders.reduce((sum, o) => sum + o.quantity, 0);
        for (const machine of machines) {
            const normal_x = Math.floor(machine.sheet_width_mm / size.width_mm);
            const normal_y = Math.floor(machine.sheet_height_mm / size.height_mm);
            const normal_capacity = normal_x * normal_y;
            const rotated_x = Math.floor(machine.sheet_width_mm / size.height_mm);
            const rotated_y = Math.floor(machine.sheet_height_mm / size.width_mm);
            const rotated_capacity = rotated_x * rotated_y;
            const capacity = Math.max(normal_capacity, rotated_capacity);
            if (capacity <= 0)
                continue;
            const sheets = Math.ceil(total_quantity / capacity);
            const run_time = sheets / machine.speed_per_hour;
            const machine_cost = run_time * machine.hour_rate;
            if (machine_cost < bestCost) {
                bestCost = machine_cost;
                bestMachine = machine;
                sheet_capacity = capacity;
                sheets_needed = sheets;
            }
        }
        if (!bestMachine) {
            throw new common_1.NotFoundException('No suitable machine found');
        }
        const paper_cost = sheets_needed * paper.price_per_sheet;
        const production_cost = paper_cost + bestCost;
        const total_price = production_cost * 1.4;
        const price_per_order = data.orders.map((order) => {
            const ratio = order.quantity / total_quantity;
            return {
                name: order.name,
                quantity: order.quantity,
                price: total_price * ratio
            };
        });
        return {
            machine: bestMachine.name,
            sheet_capacity,
            sheets_needed,
            total_quantity,
            production_cost,
            total_price,
            orders: price_per_order
        };
    }
};
exports.PriceService = PriceService;
exports.PriceService = PriceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(paper_type_entity_1.PaperType)),
    __param(1, (0, typeorm_1.InjectRepository)(print_size_entity_1.PrintSize)),
    __param(2, (0, typeorm_1.InjectRepository)(finish_type_entity_1.FinishType)),
    __param(3, (0, typeorm_1.InjectRepository)(machine_entity_1.Machine)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PriceService);
//# sourceMappingURL=price.service.js.map