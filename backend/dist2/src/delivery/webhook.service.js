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
var WebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const delivery_webhook_entity_1 = require("./delivery-webhook.entity");
const crypto_1 = require("crypto");
let WebhookService = WebhookService_1 = class WebhookService {
    constructor(repo) {
        this.repo = repo;
        this.logger = new common_1.Logger(WebhookService_1.name);
    }
    async register(data) {
        const webhook = this.repo.create({
            ...data,
            events: data.events || ['status_changed', 'delivery_created', 'delivery_completed'],
        });
        return this.repo.save(webhook);
    }
    findAll() {
        return this.repo.find({ order: { created_at: 'DESC' } });
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return this.repo.findOne({ where: { id } });
    }
    async remove(id) {
        await this.repo.delete(id);
        return { deleted: true };
    }
    async trigger(event, payload) {
        const webhooks = await this.repo.find({
            where: { is_active: true },
        });
        for (const webhook of webhooks) {
            if (webhook.events && !webhook.events.includes(event))
                continue;
            this.sendWebhook(webhook, event, payload);
        }
    }
    async sendWebhook(webhook, event, payload) {
        try {
            const body = JSON.stringify({
                event,
                timestamp: new Date().toISOString(),
                data: payload,
            });
            const headers = {
                'Content-Type': 'application/json',
                'X-Webhook-Event': event,
                'X-Webhook-Source': 'bizprint',
            };
            if (webhook.secret) {
                const signature = (0, crypto_1.createHmac)('sha256', webhook.secret)
                    .update(body)
                    .digest('hex');
                headers['X-Webhook-Signature'] = `sha256=${signature}`;
            }
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers,
                body,
                signal: AbortSignal.timeout(10000),
            });
            await this.repo.update(webhook.id, {
                last_triggered_at: new Date(),
                failure_count: 0,
            });
            this.logger.log(`Webhook ${webhook.name} triggered: ${event} → ${response.status}`);
        }
        catch (error) {
            await this.repo.update(webhook.id, {
                failure_count: () => 'failure_count + 1',
            });
            if (webhook.failure_count >= 9) {
                await this.repo.update(webhook.id, { is_active: false });
                this.logger.warn(`Webhook ${webhook.name} disabled after 10 failures`);
            }
            this.logger.error(`Webhook ${webhook.name} failed: ${error.message}`);
        }
    }
};
exports.WebhookService = WebhookService;
exports.WebhookService = WebhookService = WebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(delivery_webhook_entity_1.DeliveryWebhook)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map