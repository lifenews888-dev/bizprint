import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DeliveryWebhook } from './delivery-webhook.entity'
import { createHmac } from 'crypto'

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name)

  constructor(
    @InjectRepository(DeliveryWebhook)
    private repo: Repository<DeliveryWebhook>,
  ) {}

  // Register a new webhook
  async register(data: {
    name: string
    url: string
    secret?: string
    events?: string[]
    provider?: string
    config?: Record<string, any>
  }) {
    const webhook = this.repo.create({
      ...data,
      events: data.events || ['status_changed', 'delivery_created', 'delivery_completed'],
    })
    return this.repo.save(webhook)
  }

  // List all webhooks
  findAll() {
    return this.repo.find({ order: { created_at: 'DESC' } })
  }

  // Update webhook
  async update(id: number, data: Partial<DeliveryWebhook>) {
    await this.repo.update(id, data)
    return this.repo.findOne({ where: { id } })
  }

  // Delete webhook
  async remove(id: number) {
    await this.repo.delete(id)
    return { deleted: true }
  }

  // Trigger all active webhooks for an event
  async trigger(event: string, payload: any) {
    const webhooks = await this.repo.find({
      where: { is_active: true },
    })

    for (const webhook of webhooks) {
      // Check if webhook listens to this event
      if (webhook.events && !webhook.events.includes(event)) continue

      this.sendWebhook(webhook, event, payload)
    }
  }

  // Send webhook request (fire and forget)
  private async sendWebhook(webhook: DeliveryWebhook, event: string, payload: any) {
    try {
      const body = JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      })

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
        'X-Webhook-Source': 'bizprint',
      }

      // Sign payload if secret exists
      if (webhook.secret) {
        const signature = createHmac('sha256', webhook.secret)
          .update(body)
          .digest('hex')
        headers['X-Webhook-Signature'] = `sha256=${signature}`
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10000), // 10s timeout
      })

      // Update last triggered
      await this.repo.update(webhook.id, {
        last_triggered_at: new Date(),
        failure_count: 0,
      })

      this.logger.log(`Webhook ${webhook.name} triggered: ${event} → ${response.status}`)
    } catch (error) {
      // Increment failure count
      await this.repo.update(webhook.id, {
        failure_count: () => 'failure_count + 1',
      } as any)

      // Disable after 10 consecutive failures
      if (webhook.failure_count >= 9) {
        await this.repo.update(webhook.id, { is_active: false })
        this.logger.warn(`Webhook ${webhook.name} disabled after 10 failures`)
      }

      this.logger.error(`Webhook ${webhook.name} failed: ${error.message}`)
    }
  }
}
