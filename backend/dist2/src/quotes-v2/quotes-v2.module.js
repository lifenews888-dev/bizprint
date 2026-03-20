"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotesV2Module = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const quote_v2_entity_1 = require("./quote-v2.entity");
const quotes_v2_service_1 = require("./quotes-v2.service");
const quotes_v2_controller_1 = require("./quotes-v2.controller");
const mail_module_1 = require("../mail/mail.module");
let QuotesV2Module = class QuotesV2Module {
};
exports.QuotesV2Module = QuotesV2Module;
exports.QuotesV2Module = QuotesV2Module = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([quote_v2_entity_1.QuoteV2]), mail_module_1.MailModule],
        controllers: [quotes_v2_controller_1.QuotesV2Controller],
        providers: [quotes_v2_service_1.QuotesV2Service],
        exports: [quotes_v2_service_1.QuotesV2Service],
    })
], QuotesV2Module);
//# sourceMappingURL=quotes-v2.module.js.map