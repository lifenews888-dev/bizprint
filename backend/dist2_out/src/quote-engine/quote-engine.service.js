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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteEngineService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const machine_entity_1 = require("../machines/machine.entity");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
let QuoteEngineService = class QuoteEngineService {
    constructor(machineRepo) {
        this.machineRepo = machineRepo;
    }
    async calculateFromPdf(file, input) {
        const data = await (0, pdf_parse_1.default)(file.buffer);
        const pages = data.numpages || 1;
        return this.calculate({ ...input, pages });
    }
    async calculate(input) {
        const quantity = Number(input.quantity) || 100;
        const pages = Number(input.pages) || 1;
        const width_mm = Number(input.width_mm) || 210;
        const height_mm = Number(input.height_mm) || 297;
        const color_mode = input.color_mode || 'color';
        const sides = input.sides || 'single';
        const paper_gsm = Number(input.paper_gsm) || 150;
        const finishing = input.finishing || 'none';
        const binding = input.binding || 'none';
        const size = this.detectSize(width_mm, height_mm);
        const sheets_per_copy = Math.ceil(pages / (sides === 'double' ? 2 : 1));
        const machineSelection = await this.selectBestMachine({
            quantity,
            width_mm,
            height_mm,
            color_mode,
        });
        const imposition = machineSelection.bestFit ?? 1;
        const total_sheets = Math.ceil((quantity * sheets_per_copy) / imposition);
        const machine_name = machineSelection.machine?.name ?? 'Digital Press';
        const machine_speed = machineSelection.machine?.speed_per_hour ?? 3000;
        const hour_rate = machineSelection.machine?.hour_rate ?? 50000;
        const print_hours = total_sheets / machine_speed;
        const color_rate = color_mode === 'color' ? 1.0 : 0.4;
        const paper_cost = Math.round(total_sheets * this.getPaperPrice(paper_gsm));
        const print_cost = Math.round(print_hours * hour_rate * color_rate);
        const finishing_cost = this.getFinishingCost(finishing, quantity);
        const binding_cost = this.getBindingCost(binding, quantity);
        const setup_cost = quantity < 500 ? 50000 : quantity < 2000 ? 30000 : 0;
        const subtotal = paper_cost + print_cost + finishing_cost + binding_cost + setup_cost;
        const overhead = Math.round(subtotal * 0.10);
        const margin = Math.round((subtotal + overhead) * 0.20);
        const total_price = subtotal + overhead + margin;
        const unit_price = Math.round(total_price / quantity);
        return {
            quantity, pages, size, width_mm, height_mm,
            color_mode, sides, paper_gsm, finishing, binding,
            sheets_per_copy, total_sheets,
            imposition_per_sheet: imposition,
            rotated: machineSelection.rotated,
            machine: machine_name,
            machine_speed,
            machine_sheet: machineSelection.machine
                ? { w: machineSelection.machine.sheet_width_mm, h: machineSelection.machine.sheet_height_mm }
                : null,
            print_hours: Math.round(print_hours * 100) / 100,
            paper_cost, print_cost, finishing_cost, binding_cost,
            setup_cost, subtotal, overhead, margin,
            total_price, unit_price,
            currency: 'MNT',
            breakdown: {
                paper_price_per_sheet: this.getPaperPrice(paper_gsm),
                color_rate, hour_rate, print_hours,
                overhead_10pct: overhead,
                margin_20pct: margin,
            },
        };
    }
    detectSize(w, h) {
        const W = Math.min(w, h), H = Math.max(w, h);
        if (W >= 195 && W <= 225 && H >= 280 && H <= 315)
            return 'A4';
        if (W >= 138 && W <= 158 && H >= 195 && H <= 225)
            return 'A5';
        if (W >= 280 && W <= 315 && H >= 400 && H <= 440)
            return 'A3';
        if (W >= 85 && W <= 95 && H >= 50 && H <= 60)
            return 'BusinessCard';
        return 'Custom';
    }
    computeSheetFit(machine, width, height) {
        const fitNormal = Math.floor(machine.sheet_width_mm / width) *
            Math.floor(machine.sheet_height_mm / height);
        const fitRotated = Math.floor(machine.sheet_width_mm / height) *
            Math.floor(machine.sheet_height_mm / width);
        if (fitRotated > fitNormal) {
            return { fit: Math.max(fitRotated, 1), rotated: true };
        }
        return { fit: Math.max(fitNormal, 1), rotated: false };
    }
    getPaperPrice(gsm) {
        if (gsm <= 90)
            return 35;
        if (gsm <= 115)
            return 45;
        if (gsm <= 150)
            return 60;
        if (gsm <= 200)
            return 85;
        if (gsm <= 250)
            return 110;
        if (gsm <= 300)
            return 145;
        if (gsm <= 350)
            return 180;
        return 220;
    }
    getFinishingCost(finishing, quantity) {
        const rates = {
            'none': 0, 'laminate_matte': 80, 'laminate_gloss': 75,
            'soft_touch': 120, 'uv': 60, 'fold': 30,
        };
        return Math.round((rates[finishing] || 0) * quantity);
    }
    getBindingCost(binding, quantity) {
        const rates = {
            'none': 0, 'staple': 50, 'perfect': 800,
            'spiral': 1200, 'hardcover': 3500,
        };
        return Math.round((rates[binding] || 0) * quantity);
    }
    async selectBestMachine(params) {
        const machines = await this.machineRepo.find();
        if (!machines.length) {
            return { machine: null, bestFit: 1, rotated: false };
        }
        const { quantity, width_mm, height_mm, color_mode } = params;
        const colorMultiplier = color_mode === 'color' ? 1.0 : 0.4;
        let best = null;
        for (const machine of machines) {
            const fitResult = this.computeSheetFit(machine, width_mm, height_mm);
            const fit = fitResult.fit || 1;
            if (fit <= 0)
                continue;
            const total_sheets = Math.ceil(quantity / fit);
            const hours = total_sheets / machine.speed_per_hour;
            const cost = hours * machine.hour_rate * colorMultiplier;
            if (!best || cost < best.cost) {
                best = { machine, cost, fit, rotated: fitResult.rotated };
            }
        }
        if (!best) {
            return { machine: null, bestFit: 1, rotated: false };
        }
        return { machine: best.machine, bestFit: best.fit, rotated: best.rotated };
    }
};
exports.QuoteEngineService = QuoteEngineService;
exports.QuoteEngineService = QuoteEngineService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(machine_entity_1.Machine)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], QuoteEngineService);
//# sourceMappingURL=quote-engine.service.js.map