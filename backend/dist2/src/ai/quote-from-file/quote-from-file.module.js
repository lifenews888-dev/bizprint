"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteFromFileModule = void 0;
const common_1 = require("@nestjs/common");
const quote_from_file_controller_1 = require("./quote-from-file.controller");
const quote_from_file_service_1 = require("./quote-from-file.service");
const pdf_inspector_module_1 = require("../pdf-inspector/pdf-inspector.module");
const print_size_module_1 = require("../print-size/print-size.module");
const auto_quote_module_1 = require("../auto-quote/auto-quote.module");
let QuoteFromFileModule = class QuoteFromFileModule {
};
exports.QuoteFromFileModule = QuoteFromFileModule;
exports.QuoteFromFileModule = QuoteFromFileModule = __decorate([
    (0, common_1.Module)({
        imports: [
            pdf_inspector_module_1.PdfInspectorModule,
            print_size_module_1.PrintSizeModule,
            auto_quote_module_1.AutoQuoteModule
        ],
        controllers: [quote_from_file_controller_1.QuoteFromFileController],
        providers: [quote_from_file_service_1.QuoteFromFileService]
    })
], QuoteFromFileModule);
//# sourceMappingURL=quote-from-file.module.js.map