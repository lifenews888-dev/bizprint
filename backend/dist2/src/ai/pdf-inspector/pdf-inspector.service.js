"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfInspectorService = void 0;
const common_1 = require("@nestjs/common");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
let PdfInspectorService = class PdfInspectorService {
    async inspect(file) {
        const data = await (0, pdf_parse_1.default)(file);
        const issues = [];
        let score = 100;
        if (data.numpages === 0) {
            issues.push({ type: 'NO_PAGES', severity: 'error', message: 'PDF хуудас байхгүй байна' });
            score -= 30;
        }
        const avgPageSize = file.length / (data.numpages || 1);
        let resolutionStatus = 'pass';
        let resolutionDetail = 'Файлын хэмжээ хэвлэлд тохиромжтой';
        if (avgPageSize < 50000) {
            issues.push({
                type: 'LOW_RESOLUTION',
                severity: 'error',
                message: 'Зургийн чанар хэт бага байж болно (хуудас бүр < 50KB)'
            });
            score -= 25;
            resolutionStatus = 'fail';
            resolutionDetail = 'Хуудас бүр < 50KB — зургийн чанар бага байж болно';
        }
        else if (avgPageSize < 200000) {
            issues.push({
                type: 'MEDIUM_RESOLUTION',
                severity: 'warning',
                message: 'Зургийн чанар дунд зэрэг (хуудас бүр < 200KB). 300 DPI шалгана уу'
            });
            score -= 10;
            resolutionStatus = 'warning';
            resolutionDetail = 'Хуудас бүр < 200KB — 300 DPI шалгахыг зөвлөж байна';
        }
        let colorStatus = 'pass';
        let colorDetail = 'Өнгөний мэдээлэл хэвийн';
        const pdfText = JSON.stringify(data.info || {}).toLowerCase();
        if (pdfText.includes('rgb') && !pdfText.includes('cmyk')) {
            issues.push({
                type: 'RGB_COLOR',
                severity: 'warning',
                message: 'RGB өнгөний горим илэрсэн. Хэвлэлд CMYK шаардлагатай'
            });
            score -= 15;
            colorStatus = 'warning';
            colorDetail = 'RGB илэрсэн — CMYK болгох шаардлагатай байж болно';
        }
        let fontStatus = 'pass';
        let fontDetail = 'Фонт хэвийн';
        if (data.text.length > 0 && data.text.includes('\ufffd')) {
            issues.push({
                type: 'FONT_ISSUE',
                severity: 'warning',
                message: 'Зарим фонт embed хийгдээгүй байж болно'
            });
            score -= 10;
            fontStatus = 'warning';
            fontDetail = 'Зарим тэмдэгт зөв уншигдахгүй — фонт embed шалгана уу';
        }
        let pageSizeStatus = 'info';
        let pageSizeDetail = 'PDF metadata-аас хэмжээ авах боломжгүй';
        let transparencyStatus = 'pass';
        let transparencyDetail = 'Хэвийн';
        const pdfVersion = data.info?.PDFFormatVersion;
        if (pdfVersion && parseFloat(pdfVersion) >= 1.4) {
            transparencyStatus = 'info';
            transparencyDetail = `PDF ${pdfVersion} — transparency дэмжих боломжтой. Flatten хийсэн эсэхийг шалгана уу`;
        }
        let bleedStatus = 'warning';
        let bleedDetail = 'Bleed байгаа эсэхийг PDF metadata-аас тодорхойлох боломжгүй. 3mm bleed нэмсэн эсэхийг шалгана уу';
        issues.push({
            type: 'BLEED_UNKNOWN',
            severity: 'info',
            message: 'Bleed (3мм) байгаа эсэхийг гараар шалгана уу'
        });
        score = Math.max(0, Math.min(100, score));
        let risk = 'LOW';
        if (score < 40)
            risk = 'CRITICAL';
        else if (score < 60)
            risk = 'HIGH';
        else if (score < 80)
            risk = 'MEDIUM';
        const errorCount = issues.filter(i => i.severity === 'error').length;
        const warningCount = issues.filter(i => i.severity === 'warning').length;
        let summary = '';
        if (score >= 80) {
            summary = 'Хэвлэлд бэлэн. Жижиг анхааруулга байж болно.';
        }
        else if (score >= 60) {
            summary = `${warningCount} анхааруулга илэрсэн. Шалгаад засахыг зөвлөж байна.`;
        }
        else {
            summary = `${errorCount} алдаа, ${warningCount} анхааруулга. Хэвлэхэд асуудал гарах магадлалтай.`;
        }
        return {
            pages: data.numpages,
            text_length: data.text.length,
            info: data.info,
            issues,
            score,
            risk,
            summary,
            checks: {
                resolution: { status: resolutionStatus, detail: resolutionDetail },
                color_mode: { status: colorStatus, detail: colorDetail },
                bleed: { status: bleedStatus, detail: bleedDetail },
                fonts: { status: fontStatus, detail: fontDetail },
                page_size: { status: pageSizeStatus, detail: pageSizeDetail },
                transparency: { status: transparencyStatus, detail: transparencyDetail },
            },
        };
    }
};
exports.PdfInspectorService = PdfInspectorService;
exports.PdfInspectorService = PdfInspectorService = __decorate([
    (0, common_1.Injectable)()
], PdfInspectorService);
//# sourceMappingURL=pdf-inspector.service.js.map