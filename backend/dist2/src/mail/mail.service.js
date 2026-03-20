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
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const mailer_1 = require("@nestjs-modules/mailer");
let MailService = class MailService {
    constructor(mailerService) {
        this.mailerService = mailerService;
    }
    fmt(n) {
        return Number(n).toLocaleString('mn-MN');
    }
    async sendOrderConfirmation(params) {
        await this.mailerService.sendMail({
            to: params.to,
            subject: 'BizPrint - Zakhialgaa batalgaajlaa - ' + params.invoiceCode,
            html: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">' +
                '<div style="background:#FF6B00;padding:24px;color:#fff"><h2 style="margin:0">BizPrint</h2></div>' +
                '<div style="padding:28px">' +
                '<h3>Sain baina uu, ' + params.name + '!</h3>' +
                '<p>Tanii zakhialgaa <strong>' + params.invoiceCode + '</strong> amjilttai batalgaajlaa.</p>' +
                '<table style="width:100%;border-collapse:collapse">' +
                '<tr><td style="padding:8px;color:#666">Buteegedkheen</td><td style="padding:8px">' + params.productName + '</td></tr>' +
                '<tr><td style="padding:8px;color:#666">Too</td><td style="padding:8px">' + params.quantity + '</td></tr>' +
                '<tr><td style="padding:8px;color:#666;font-weight:700">Niit</td><td style="padding:8px;color:#FF6B00;font-weight:700">' + this.fmt(params.total) + 'T</td></tr>' +
                '</table>' +
                '</div></div>',
        });
    }
    async sendDesignerAssigned(params) {
        const zoomHtml = params.zoomLink
            ? '<div style="margin-top:10px"><a href="' + params.zoomLink + '" style="background:#7C3AED;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px">Zoom uulzaltad negdekh</a></div>'
            : '';
        await this.mailerService.sendMail({
            to: params.to,
            subject: 'BizPrint - Tanii dizain ajil ekhellee',
            html: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
                '<div style="background:linear-gradient(135deg,#8B5CF6,#7C3AED);padding:24px 32px;color:#fff">' +
                '<h2 style="margin:0">BizPrint - Dizain update</h2>' +
                '</div>' +
                '<div style="padding:28px">' +
                '<h3 style="margin:0 0 16px;color:#111">Sain baina uu, ' + params.customerName + '!</h3>' +
                '<p style="color:#6b7280;margin:0 0 20px">Tanii <strong>' + params.productName + '</strong> buteegedkheenii dizain ajil ekhelleel.</p>' +
                '<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px;margin-bottom:20px">' +
                '<div style="font-size:13px;color:#6b7280;margin-bottom:4px">Dizainer</div>' +
                '<div style="font-size:16px;font-weight:700;color:#7C3AED">' + params.designerName + '</div>' +
                zoomHtml +
                '</div>' +
                '<p style="color:#6b7280;font-size:13px">Dizain duusmagts medegdel irne.</p>' +
                '</div></div>',
        });
    }
    async sendDesignApproved(params) {
        const fileHtml = params.fileUrl
            ? '<div style="margin-bottom:20px;text-align:center"><a href="' + params.fileUrl + '" style="background:#10B981;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700">Dizain file tatakh</a></div>'
            : '';
        await this.mailerService.sendMail({
            to: params.to,
            subject: 'BizPrint - Dizain batlagdlaa - Khevleld orloo',
            html: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
                '<div style="background:linear-gradient(135deg,#10B981,#059669);padding:24px 32px;color:#fff">' +
                '<h2 style="margin:0">BizPrint - Dizain batlagdlaa!</h2>' +
                '</div>' +
                '<div style="padding:28px">' +
                '<h3 style="margin:0 0 16px;color:#111">Sain baina uu, ' + params.customerName + '!</h3>' +
                '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin-bottom:20px;text-align:center">' +
                '<div style="font-size:32px;margin-bottom:8px">OK</div>' +
                '<div style="font-size:16px;font-weight:700;color:#16a34a">' + params.productName + '</div>' +
                '<div style="font-size:13px;color:#6b7280;margin-top:4px">Dizain batlagdaj khevleld orloo</div>' +
                '</div>' +
                fileHtml +
                '<p style="color:#6b7280;font-size:13px;text-align:center">Khevlel duusmagts hurgeltin medeelel irne.</p>' +
                '</div></div>',
        });
    }
    async sendDeliveryStarted(params) {
        await this.mailerService.sendMail({
            to: params.to,
            subject: 'BizPrint - Tanii zakhialgaa zamdaa!',
            html: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
                '<div style="background:linear-gradient(135deg,#FF6B00,#F59E0B);padding:24px 32px;color:#fff">' +
                '<h2 style="margin:0">BizPrint - Khurgelt ekhlelle!</h2>' +
                '</div>' +
                '<div style="padding:28px">' +
                '<h3 style="margin:0 0 16px;color:#111">Sain baina uu, ' + params.customerName + '!</h3>' +
                '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin-bottom:20px">' +
                '<div style="font-size:15px;font-weight:700;color:#FF6B00;text-align:center;margin-bottom:16px">' + params.productName + ' zamdaa!</div>' +
                '<table style="width:100%">' +
                '<tr><td style="padding:6px;color:#9a3412;font-size:11px;font-weight:600">JOLOOCH</td><td style="padding:6px;color:#9a3412;font-size:11px;font-weight:600">KHAYAG</td></tr>' +
                '<tr><td style="padding:6px"><strong>' + params.courierName + '</strong><br><span style="color:#666">' + params.courierPhone + '</span></td>' +
                '<td style="padding:6px;font-size:13px">' + params.address + '</td></tr>' +
                '</table>' +
                '</div>' +
                '<p style="color:#6b7280;font-size:13px;text-align:center">Asuult baival: <strong>' + params.courierPhone + '</strong></p>' +
                '</div></div>',
        });
    }
    async sendDeliveryCompleted(params) {
        await this.mailerService.sendMail({
            to: params.to,
            subject: 'BizPrint - Zakhialgaa khurgegdlee!',
            html: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
                '<div style="background:linear-gradient(135deg,#10B981,#059669);padding:24px 32px;color:#fff">' +
                '<h2 style="margin:0">BizPrint - Khurgegdlee!</h2>' +
                '</div>' +
                '<div style="padding:28px;text-align:center">' +
                '<div style="font-size:48px;margin-bottom:16px">:)</div>' +
                '<h3 style="margin:0 0 8px;color:#111">Sain baina uu, ' + params.customerName + '!</h3>' +
                '<p style="color:#6b7280;margin:0 0 20px">' + params.productName + ' amjilttai khurgegdlee.</p>' +
                '<a href="http://localhost:3000/dashboard" style="background:#10B981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Dashboard kharakh</a>' +
                '</div></div>',
        });
    }
    async sendQuoteToCustomer(q) {
        const fmt = (n) => Number(n).toLocaleString('mn-MN');
        const bd = q.breakdown || {};
        await this.mailerService.sendMail({
            to: q.to,
            subject: 'BizPrint - ' + q.quote_number + ' - Uniin sanal',
            html: '<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">' +
                '<div style="background:linear-gradient(135deg,#FF6B00,#FF8C42);padding:28px 32px;color:#fff">' +
                '<h1 style="margin:0;font-size:24px">BizPrint</h1>' +
                '</div>' +
                '<div style="padding:32px">' +
                '<h2 style="margin:0 0 8px;color:#111">Sain baina uu, ' + q.name + '!</h2>' +
                '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:20px;margin-bottom:24px">' +
                '<div style="font-size:22px;font-weight:800;color:#FF6B00">' + q.quote_number + '</div>' +
                '<div style="font-size:28px;font-weight:800;color:#FF6B00">' + fmt(q.total_price) + 'T</div>' +
                '</div>' +
                '<p>Une: ' + fmt(q.unit_price) + 'T/shirkheg | Niit: ' + fmt(q.total_price) + 'T</p>' +
                '</div></div>',
        });
    }
    async sendDailyReport(adminEmail, quotes, date) {
        const total = quotes.reduce((s, q) => s + Number(q.total_price), 0);
        const fmt = (n) => Number(n).toLocaleString('mn-MN');
        await this.mailerService.sendMail({
            to: adminEmail,
            subject: 'BizPrint - ' + date + ' - ' + quotes.length + ' uniin sanal',
            html: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">' +
                '<div style="background:#FF6B00;padding:24px;color:#fff"><h2 style="margin:0">BizPrint - Odoriin tailan</h2><p style="margin:4px 0 0">' + date + '</p></div>' +
                '<div style="padding:24px">' +
                '<p>Niit quote: <strong>' + quotes.length + '</strong></p>' +
                '<p>Niit dun: <strong style="color:#FF6B00">' + fmt(total) + 'T</strong></p>' +
                '</div></div>',
        });
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService])
], MailService);
//# sourceMappingURL=mail.service.js.map