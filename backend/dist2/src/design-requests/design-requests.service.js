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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignRequestsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const design_request_entity_1 = require("./design-request.entity");
const mail_service_1 = require("../mail/mail.service");
const wallet_service_1 = require("../wallet/wallet.service");
const settings_service_1 = require("../settings/settings.service");
const DEFAULT_DESIGNER_FEE = 15000;
const DEFAULT_TAX_PERCENT = 10;
let DesignRequestsService = class DesignRequestsService {
    constructor(repo, mailService, walletService, settingsService) {
        this.repo = repo;
        this.mailService = mailService;
        this.walletService = walletService;
        this.settingsService = settingsService;
    }
    findAll() { return this.repo.find({ order: { created_at: 'DESC' } }); }
    findByOrder(order_id) { return this.repo.find({ where: { order_id } }); }
    findByDesigner(designer_id) { return this.repo.find({ where: { designer_id }, order: { created_at: 'DESC' } }); }
    findByCustomer(customer_id) { return this.repo.find({ where: { customer_id }, order: { created_at: 'DESC' } }); }
    findPending() { return this.repo.find({ where: { status: design_request_entity_1.DesignStatus.PENDING }, order: { created_at: 'ASC' } }); }
    findOne(id) { return this.repo.findOne({ where: { id } }); }
    create(data) {
        return this.repo.save(this.repo.create({ ...data, status: design_request_entity_1.DesignStatus.PENDING }));
    }
    async assign(id, designerId, designerName, designerPhone, designerZoom) {
        await this.repo.update(id, {
            designer_id: designerId,
            designer_name: designerName,
            designer_phone: designerPhone,
            designer_zoom: designerZoom,
            status: design_request_entity_1.DesignStatus.ASSIGNED,
        });
        const dr = await this.findOne(id);
        if (dr && dr.customer_email) {
            this.mailService.sendDesignerAssigned({
                to: dr.customer_email,
                customerName: dr.customer_name || 'Customer',
                designerName: designerName,
                productName: dr.product_name || 'Product',
                orderId: dr.order_id,
                zoomLink: designerZoom,
            }).catch(() => { });
        }
        return dr;
    }
    async submitFile(id, fileUrl, previewUrl) {
        await this.repo.update(id, {
            status: design_request_entity_1.DesignStatus.IN_PROGRESS,
            file_url: fileUrl,
            preview_url: previewUrl,
        });
        return this.findOne(id);
    }
    async approve(id) {
        await this.repo.update(id, { status: design_request_entity_1.DesignStatus.APPROVED });
        const dr = await this.findOne(id);
        if (dr && dr.designer_id) {
            await this.processDesignerPayment(dr);
        }
        if (dr && dr.customer_email) {
            this.mailService.sendDesignApproved({
                to: dr.customer_email,
                customerName: dr.customer_name || 'Customer',
                productName: dr.product_name || 'Product',
                orderId: dr.order_id,
            }).catch(() => { });
        }
        return dr;
    }
    async reject(id, reason) {
        await this.repo.update(id, { status: design_request_entity_1.DesignStatus.REJECTED, reject_reason: reason });
        return this.findOne(id);
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.findOne(id);
    }
    async remove(id) {
        await this.repo.delete(id);
        return { deleted: true };
    }
    async processDesignerPayment(dr) {
        try {
            const designerId = dr.designer_id;
            const customFeeSetting = await this.settingsService.get(`designer_fee_${designerId}`);
            const defaultFeeSetting = await this.settingsService.get('designer_fee_per_job');
            const taxSetting = await this.settingsService.get('tax_haoat_percent');
            const grossFee = customFeeSetting
                ? parseFloat(customFeeSetting)
                : defaultFeeSetting
                    ? parseFloat(defaultFeeSetting)
                    : DEFAULT_DESIGNER_FEE;
            const taxPercent = taxSetting ? parseFloat(taxSetting) : DEFAULT_TAX_PERCENT;
            const taxAmount = Math.round(grossFee * taxPercent / 100);
            const netFee = grossFee - taxAmount;
            await this.walletService.credit(designerId, netFee, 'design_fee', dr.id, `Design #${dr.id.slice(0, 8)} fee: ${grossFee} - ${taxPercent}% HAOAT (${taxAmount}) = ${netFee}`);
            console.log(`Designer ${designerId} paid: ${netFee} (gross: ${grossFee}, tax: ${taxAmount})`);
        }
        catch (e) {
            console.log('Designer payment error:', e.message);
        }
    }
};
exports.DesignRequestsService = DesignRequestsService;
exports.DesignRequestsService = DesignRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(design_request_entity_1.DesignRequest)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        mail_service_1.MailService,
        wallet_service_1.WalletService,
        settings_service_1.SettingsService])
], DesignRequestsService);
//# sourceMappingURL=design-requests.service.js.map