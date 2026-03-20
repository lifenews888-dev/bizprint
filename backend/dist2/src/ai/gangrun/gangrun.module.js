"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangrunModule = void 0;
const common_1 = require("@nestjs/common");
const gangrun_service_1 = require("./gangrun.service");
const gangrun_controller_1 = require("./gangrun.controller");
let GangrunModule = class GangrunModule {
};
exports.GangrunModule = GangrunModule;
exports.GangrunModule = GangrunModule = __decorate([
    (0, common_1.Module)({
        controllers: [gangrun_controller_1.GangrunController],
        providers: [gangrun_service_1.GangrunService]
    })
], GangrunModule);
//# sourceMappingURL=gangrun.module.js.map