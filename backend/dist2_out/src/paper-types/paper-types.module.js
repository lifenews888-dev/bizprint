"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperTypesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const paper_type_entity_1 = require("./paper-type.entity");
const paper_types_service_1 = require("./paper-types.service");
const paper_types_controller_1 = require("./paper-types.controller");
let PaperTypesModule = class PaperTypesModule {
};
exports.PaperTypesModule = PaperTypesModule;
exports.PaperTypesModule = PaperTypesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([paper_type_entity_1.PaperType])],
        controllers: [paper_types_controller_1.PaperTypesController],
        providers: [paper_types_service_1.PaperTypesService],
        exports: [paper_types_service_1.PaperTypesService],
    })
], PaperTypesModule);
//# sourceMappingURL=paper-types.module.js.map