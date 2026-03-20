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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteFromFileService = void 0;
const common_1 = require("@nestjs/common");
const pdf_inspector_service_1 = require("../pdf-inspector/pdf-inspector.service");
const print_size_service_1 = require("../print-size/print-size.service");
const auto_quote_service_1 = require("../auto-quote/auto-quote.service");
let QuoteFromFileService = class QuoteFromFileService {
    constructor(pdfInspector, printSize, autoQuote) {
        this.pdfInspector = pdfInspector;
        this.printSize = printSize;
        this.autoQuote = autoQuote;
    }
    async process(file) {
        const pdf = await this.pdfInspector.inspect(file.buffer);
        const width = 90;
        const height = 50;
        const size = this.printSize.detect(width, height);
        const quote = this.autoQuote.calculate({
            sheet_width: 297,
            sheet_height: 420,
            item_width: size.width_mm,
            item_height: size.height_mm,
            orders: [
                { id: 1, quantity: 100 }
            ],
            sheet_cost: 1200,
            machine_cost_per_hour: 50000,
            production_minutes: 20
        });
        return {
            pdf_analysis: pdf,
            detected_size: size.detected_size,
            width_mm: size.width_mm,
            height_mm: size.height_mm,
            quote
        };
    }
};
exports.QuoteFromFileService = QuoteFromFileService;
exports.QuoteFromFileService = QuoteFromFileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pdf_inspector_service_1.PdfInspectorService,
        print_size_service_1.PrintSizeService,
        auto_quote_service_1.AutoQuoteService])
], QuoteFromFileService);
//# sourceMappingURL=quote-from-file.service.js.map