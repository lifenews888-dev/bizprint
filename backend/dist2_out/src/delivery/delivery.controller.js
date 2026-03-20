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
exports.DeliveryController = void 0;
const common_1 = require("@nestjs/common");
const delivery_service_1 = require("./delivery.service");
const webhook_service_1 = require("./webhook.service");
const delivery_entity_1 = require("./delivery.entity");
let DeliveryController = class DeliveryController {
    constructor(service, webhookService) {
        this.service = service;
        this.webhookService = webhookService;
    }
    findAll() {
        return this.service.findAll();
    }
    findByOrder(orderId) {
        return this.service.findByOrder(orderId);
    }
    getTracking(id) {
        return this.service.getTracking(id);
    }
    create(body) {
        return this.service.create(body);
    }
    updateStatus(id, status) {
        return this.service.updateStatus(id, status);
    }
    providerAssign(body) {
        return this.service.createFromProvider(body);
    }
    providerCallback(body) {
        return this.service.providerCallback(body.provider_order_id, body);
    }
    listWebhooks() {
        return this.webhookService.findAll();
    }
    registerWebhook(body) {
        return this.webhookService.register(body);
    }
    updateWebhook(id, body) {
        return this.webhookService.update(id, body);
    }
    deleteWebhook(id) {
        return this.webhookService.remove(id);
    }
    async testWebhook(id) {
        const webhooks = await this.webhookService.findAll();
        const webhook = webhooks.find(w => w.id === id);
        if (!webhook)
            return { error: 'Webhook not found' };
        await this.webhookService.trigger('test', {
            message: 'This is a test webhook from BizPrint',
            timestamp: new Date().toISOString(),
        });
        return { success: true, message: 'Test webhook sent' };
    }
};
exports.DeliveryController = DeliveryController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('order/:orderId'),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "findByOrder", null);
__decorate([
    (0, common_1.Get)(':id/tracking'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "getTracking", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)('provider/assign'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "providerAssign", null);
__decorate([
    (0, common_1.Post)('provider/callback'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "providerCallback", null);
__decorate([
    (0, common_1.Get)('webhooks/list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "listWebhooks", null);
__decorate([
    (0, common_1.Post)('webhooks'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "registerWebhook", null);
__decorate([
    (0, common_1.Patch)('webhooks/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "updateWebhook", null);
__decorate([
    (0, common_1.Delete)('webhooks/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "deleteWebhook", null);
__decorate([
    (0, common_1.Post)('webhooks/:id/test'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "testWebhook", null);
exports.DeliveryController = DeliveryController = __decorate([
    (0, common_1.Controller)('delivery'),
    __metadata("design:paramtypes", [delivery_service_1.DeliveryService,
        webhook_service_1.WebhookService])
], DeliveryController);
//# sourceMappingURL=delivery.controller.js.map