"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingCatalogService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path_1 = require("path");
let PricingCatalogService = class PricingCatalogService {
    constructor() {
        this.catalog = null;
    }
    loadCatalog() {
        if (this.catalog)
            return this.catalog;
        const filePath = (0, path_1.join)(__dirname, '..', 'pricing-rules', 'catalog.manual.json');
        if (!(0, fs_1.existsSync)(filePath)) {
            throw new Error('pricing catalog file not found: ' + filePath);
        }
        const json = (0, fs_1.readFileSync)(filePath, 'utf8');
        this.catalog = JSON.parse(json);
        return this.catalog;
    }
    quote(req) {
        const catalog = this.loadCatalog();
        const item = this.pickItem(catalog.items, req.product_type);
        const quantity = req.quantity ?? 1;
        const area_m2 = req.area_m2 ?? this.calcArea(req.width_mm, req.height_mm, quantity);
        const base_total = item.unit === 'm2' && area_m2
            ? item.price * area_m2
            : item.price * quantity;
        const applyVat = req.apply_vat ?? true;
        const vatPct = catalog.meta.vat_percent;
        const vat = applyVat && item.price_vat
            ? base_total * (vatPct / 100)
            : undefined;
        return {
            product_type: req.product_type,
            item,
            unit_price: item.price,
            total: vat ? Math.round(base_total + vat) : Math.round(base_total),
            total_vat: vat ? Math.round(base_total + vat) : undefined,
            quantity,
            area_m2,
            vat_percent: applyVat ? vatPct : undefined,
            breakdown: {
                base_total: Math.round(base_total),
                vat: vat ? Math.round(vat) : undefined,
            },
        };
    }
    pickItem(items, product_type) {
        const hit = items.find(i => i.category === product_type) || items.find(i => i.name === product_type);
        if (!hit) {
            throw new Error(`pricing item not found for product_type=${product_type}`);
        }
        return hit;
    }
    calcArea(w, h, qty) {
        if (!w || !h || !qty)
            return undefined;
        const one = (w / 1000) * (h / 1000);
        return Math.round(one * qty * 1000) / 1000;
    }
};
exports.PricingCatalogService = PricingCatalogService;
exports.PricingCatalogService = PricingCatalogService = __decorate([
    (0, common_1.Injectable)()
], PricingCatalogService);
//# sourceMappingURL=pricing-catalog.service.js.map