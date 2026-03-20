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
exports.PricingCatalogController = void 0;
const common_1 = require("@nestjs/common");
const pricing_catalog_service_1 = require("./pricing-catalog.service");
let PricingCatalogController = class PricingCatalogController {
    constructor(svc) {
        this.svc = svc;
    }
    quote(body) {
        return this.svc.quote(body);
    }
};
exports.PricingCatalogController = PricingCatalogController;
__decorate([
    (0, common_1.Post)('quote'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], PricingCatalogController.prototype, "quote", null);
exports.PricingCatalogController = PricingCatalogController = __decorate([
    (0, common_1.Controller)('pricing-catalog'),
    __metadata("design:paramtypes", [pricing_catalog_service_1.PricingCatalogService])
], PricingCatalogController);
//# sourceMappingURL=pricing-catalog.controller.js.map