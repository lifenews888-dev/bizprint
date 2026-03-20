"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const design_request_entity_1 = require("./design-request.entity");
const design_requests_service_1 = require("./design-requests.service");
const design_requests_controller_1 = require("./design-requests.controller");
const mail_module_1 = require("../mail/mail.module");
const wallet_module_1 = require("../wallet/wallet.module");
const settings_module_1 = require("../settings/settings.module");
let DesignRequestsModule = class DesignRequestsModule {
};
exports.DesignRequestsModule = DesignRequestsModule;
exports.DesignRequestsModule = DesignRequestsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([design_request_entity_1.DesignRequest]),
            mail_module_1.MailModule,
            wallet_module_1.WalletModule,
            settings_module_1.SettingsModule,
        ],
        controllers: [design_requests_controller_1.DesignRequestsController],
        providers: [design_requests_service_1.DesignRequestsService],
        exports: [design_requests_service_1.DesignRequestsService],
    })
], DesignRequestsModule);
//# sourceMappingURL=design-requests.module.js.map