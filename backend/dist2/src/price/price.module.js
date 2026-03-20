"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const price_service_1 = require("./price.service");
const price_controller_1 = require("./price.controller");
const paper_type_entity_1 = require("./paper-type.entity");
const print_size_entity_1 = require("./print-size.entity");
const finish_type_entity_1 = require("./finish-type.entity");
const machine_entity_1 = require("../machines/machine.entity");
let PriceModule = class PriceModule {
};
exports.PriceModule = PriceModule;
exports.PriceModule = PriceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                paper_type_entity_1.PaperType,
                print_size_entity_1.PrintSize,
                finish_type_entity_1.FinishType,
                machine_entity_1.Machine
            ])
        ],
        controllers: [
            price_controller_1.PriceController,
        ],
        providers: [
            price_service_1.PriceService
        ]
    })
], PriceModule);
//# sourceMappingURL=price.module.js.map