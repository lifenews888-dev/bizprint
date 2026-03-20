"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const delivery_entity_1 = require("./delivery.entity");
const delivery_webhook_entity_1 = require("./delivery-webhook.entity");
const delivery_service_1 = require("./delivery.service");
const delivery_controller_1 = require("./delivery.controller");
const webhook_service_1 = require("./webhook.service");
const mail_module_1 = require("../mail/mail.module");
const wallet_module_1 = require("../wallet/wallet.module");
const settings_module_1 = require("../settings/settings.module");
let DeliveryModule = class DeliveryModule {
};
exports.DeliveryModule = DeliveryModule;
exports.DeliveryModule = DeliveryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([delivery_entity_1.Delivery, delivery_webhook_entity_1.DeliveryWebhook]),
            mail_module_1.MailModule,
            wallet_module_1.WalletModule,
            settings_module_1.SettingsModule,
        ],
        controllers: [delivery_controller_1.DeliveryController],
        providers: [delivery_service_1.DeliveryService, webhook_service_1.WebhookService],
        exports: [delivery_service_1.DeliveryService, webhook_service_1.WebhookService],
    })
], DeliveryModule);
//# sourceMappingURL=delivery.module.js.map