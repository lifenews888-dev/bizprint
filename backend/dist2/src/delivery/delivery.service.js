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
var DeliveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const delivery_entity_1 = require("./delivery.entity");
const mail_service_1 = require("../mail/mail.service");
const wallet_service_1 = require("../wallet/wallet.service");
const settings_service_1 = require("../settings/settings.service");
const webhook_service_1 = require("./webhook.service");
const DEFAULT_COURIER_FEE = 5000;
const DEFAULT_TAX_PERCENT = 10;
let DeliveryService = DeliveryService_1 = class DeliveryService {
    constructor(repo, mailService, walletService, settingsService, webhookService) {
        this.repo = repo;
        this.mailService = mailService;
        this.walletService = walletService;
        this.settingsService = settingsService;
        this.webhookService = webhookService;
        this.logger = new common_1.Logger(DeliveryService_1.name);
    }
    findAll() {
        return this.repo.find({
            relations: ['order', 'order.customer'],
            order: { created_at: 'DESC' },
        });
    }
    findByOrder(orderId) {
        return this.repo.findOne({
            where: { order: { id: orderId } },
            relations: ['order'],
        });
    }
    findOne(id) {
        return this.repo.findOne({
            where: { id },
            relations: ['order'],
        });
    }
    async create(data) {
        const delivery = this.repo.create(data);
        const saved = await this.repo.save(delivery);
        const full = await this.findOne(saved.id);
        this.webhookService.trigger('delivery_created', {
            delivery_id: saved.id,
            order_id: full?.order?.id,
            status: saved.status,
            address: saved.address,
            recipient_name: saved.recipient_name,
            recipient_phone: saved.recipient_phone,
        });
        return saved;
    }
    async updateStatus(id, status) {
        const delivery = await this.repo.findOne({
            where: { id },
            relations: ['order'],
        });
        if (!delivery)
            throw new common_1.NotFoundException('Delivery not found');
        const previousStatus = delivery.status;
        delivery.status = status;
        await this.repo.save(delivery);
        this.webhookService.trigger('status_changed', {
            delivery_id: id,
            order_id: delivery.order?.id,
            previous_status: previousStatus,
            new_status: status,
            provider: delivery.provider,
            provider_order_id: delivery.provider_order_id,
        });
        if (status === delivery_entity_1.DeliveryStatus.DELIVERED && delivery.order) {
            const order = delivery.order;
            this.webhookService.trigger('delivery_completed', {
                delivery_id: id,
                order_id: order.id,
                customer_name: order.customer_name,
                product_name: order.product_name,
            });
            const email = order.customer_email;
            if (email) {
                this.mailService.sendDeliveryCompleted({
                    to: email,
                    customerName: order.customer_name || 'Customer',
                    productName: order.product_name || 'Product',
                }).catch(() => { });
            }
            if (delivery.courier_id) {
                await this.processCourierPayment(delivery);
            }
        }
        return delivery;
    }
    async createFromProvider(data) {
        const delivery = await this.repo.findOne({
            where: { order: { id: data.order_id } },
        });
        if (delivery) {
            delivery.provider = data.provider;
            delivery.provider_order_id = data.provider_order_id;
            delivery.provider_tracking_url = data.provider_tracking_url || null;
            delivery.provider_data = data.provider_data || null;
            delivery.courier_name = data.courier_name || delivery.courier_name;
            delivery.courier_phone = data.courier_phone || delivery.courier_phone;
            delivery.status = delivery_entity_1.DeliveryStatus.ASSIGNED;
            if (data.estimated_at)
                delivery.estimated_at = new Date(data.estimated_at);
            return this.repo.save(delivery);
        }
        const newDelivery = this.repo.create({
            order: { id: data.order_id },
            provider: data.provider,
            provider_order_id: data.provider_order_id,
            provider_tracking_url: data.provider_tracking_url,
            provider_data: data.provider_data,
            courier_name: data.courier_name,
            courier_phone: data.courier_phone,
            status: delivery_entity_1.DeliveryStatus.ASSIGNED,
            estimated_at: data.estimated_at ? new Date(data.estimated_at) : null,
        });
        return this.repo.save(newDelivery);
    }
    async providerCallback(providerOrderId, data) {
        const delivery = await this.repo.findOne({
            where: { provider_order_id: providerOrderId },
            relations: ['order'],
        });
        if (!delivery)
            throw new common_1.NotFoundException(`Delivery not found for provider order: ${providerOrderId}`);
        const statusMap = {
            'pending': delivery_entity_1.DeliveryStatus.PENDING,
            'assigned': delivery_entity_1.DeliveryStatus.ASSIGNED,
            'accepted': delivery_entity_1.DeliveryStatus.ASSIGNED,
            'picking_up': delivery_entity_1.DeliveryStatus.PICKED_UP,
            'picked_up': delivery_entity_1.DeliveryStatus.PICKED_UP,
            'on_the_way': delivery_entity_1.DeliveryStatus.ON_THE_WAY,
            'in_transit': delivery_entity_1.DeliveryStatus.IN_TRANSIT,
            'delivering': delivery_entity_1.DeliveryStatus.IN_TRANSIT,
            'delivered': delivery_entity_1.DeliveryStatus.DELIVERED,
            'completed': delivery_entity_1.DeliveryStatus.DELIVERED,
            'failed': delivery_entity_1.DeliveryStatus.FAILED,
            'cancelled': delivery_entity_1.DeliveryStatus.CANCELLED,
        };
        const mappedStatus = statusMap[data.status.toLowerCase()] || delivery.status;
        if (data.courier_name)
            delivery.courier_name = data.courier_name;
        if (data.courier_phone)
            delivery.courier_phone = data.courier_phone;
        if (data.lat)
            delivery.lat = data.lat;
        if (data.lng)
            delivery.lng = data.lng;
        if (data.note)
            delivery.note = data.note;
        if (data.estimated_at)
            delivery.estimated_at = new Date(data.estimated_at);
        if (mappedStatus !== delivery.status) {
            return this.updateStatus(delivery.id, mappedStatus);
        }
        return this.repo.save(delivery);
    }
    async getTracking(deliveryId) {
        const delivery = await this.repo.findOne({
            where: { id: deliveryId },
            relations: ['order'],
        });
        if (!delivery)
            throw new common_1.NotFoundException('Delivery not found');
        return {
            id: delivery.id,
            status: delivery.status,
            courier_name: delivery.courier_name,
            courier_phone: delivery.courier_phone,
            provider: delivery.provider,
            tracking_url: delivery.provider_tracking_url,
            estimated_at: delivery.estimated_at,
            lat: delivery.lat,
            lng: delivery.lng,
            address: delivery.address,
            created_at: delivery.created_at,
            updated_at: delivery.updated_at,
        };
    }
    async processCourierPayment(delivery) {
        try {
            const courierId = String(delivery.courier_id);
            const feeSetting = await this.settingsService.get('courier_fee_per_delivery');
            const taxSetting = await this.settingsService.get('tax_haoat_percent');
            const grossFee = feeSetting ? parseFloat(feeSetting) : DEFAULT_COURIER_FEE;
            const taxPercent = taxSetting ? parseFloat(taxSetting) : DEFAULT_TAX_PERCENT;
            const taxAmount = Math.round(grossFee * taxPercent / 100);
            const netFee = grossFee - taxAmount;
            await this.walletService.credit(courierId, netFee, 'delivery_fee', String(delivery.id), `Delivery #${delivery.id} fee: ${grossFee} - ${taxPercent}% tax (${taxAmount}) = ${netFee}`);
            this.logger.log(`Courier ${courierId} paid: ${netFee}`);
        }
        catch (e) {
            this.logger.error('Courier payment error:', e.message);
        }
    }
};
exports.DeliveryService = DeliveryService;
exports.DeliveryService = DeliveryService = DeliveryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(delivery_entity_1.Delivery)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        mail_service_1.MailService,
        wallet_service_1.WalletService,
        settings_service_1.SettingsService,
        webhook_service_1.WebhookService])
], DeliveryService);
//# sourceMappingURL=delivery.service.js.map