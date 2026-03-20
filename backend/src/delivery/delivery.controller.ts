import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, Query, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { DeliveryService } from './delivery.service'
import { WebhookService } from './webhook.service'
import { DeliveryStatus } from './delivery.entity'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('delivery')
export class DeliveryController {
  constructor(
    private readonly service: DeliveryService,
    private readonly webhookService: WebhookService,
  ) {}

  // ==========================================
  // DELIVERY CRUD
  // ==========================================

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get('order/:orderId')
  findByOrder(@Param('orderId') orderId: string) {
    return this.service.findByOrder(orderId as any)
  }

  @Get(':id/tracking')
  getTracking(@Param('id', ParseIntPipe) id: number) {
    return this.service.getTracking(id)
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: DeliveryStatus,
  ) {
    return this.service.updateStatus(id, status)
  }

  // ==========================================
  // DRIVER ENDPOINTS
  // ==========================================

  @Patch(':id/location')
  @UseGuards(JwtAuthGuard)
  updateLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { lat: number; lng: number; accuracy?: number },
  ) {
    return this.service.updateLocation(id, body.lat, body.lng, body.accuracy)
  }

  @Get('driver/active')
  @UseGuards(JwtAuthGuard)
  driverActive(@Request() req: any) {
    return this.service.findDriverActive(req.user.id)
  }

  @Get('driver/history')
  @UseGuards(JwtAuthGuard)
  driverHistory(@Request() req: any, @Query('limit') limit?: string) {
    return this.service.findDriverHistory(req.user.id, limit ? Number(limit) : 50)
  }

  @Post(':id/proof')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async uploadProof(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('photo_url') photoUrl?: string,
  ) {
    // If file uploaded, construct URL; otherwise use photo_url from body
    const url = file ? `/uploads/${file.filename}` : (photoUrl || '')
    return this.service.saveProofPhoto(id, url)
  }

  // ==========================================
  // EXTERNAL PROVIDER INTEGRATION
  // ==========================================

  // External provider assigns a delivery
  // POST /delivery/provider/assign
  // Body: { order_id, provider, provider_order_id, tracking_url, courier_name, courier_phone }
  @Post('provider/assign')
  providerAssign(@Body() body: {
    order_id: string
    provider: string
    provider_order_id: string
    provider_tracking_url?: string
    provider_data?: Record<string, any>
    courier_name?: string
    courier_phone?: string
    estimated_at?: string
  }) {
    return this.service.createFromProvider(body)
  }

  // External provider updates delivery status
  // POST /delivery/provider/callback
  // Body: { provider_order_id, status, courier_name, lat, lng }
  @Post('provider/callback')
  providerCallback(@Body() body: {
    provider_order_id: string
    status: string
    courier_name?: string
    courier_phone?: string
    lat?: number
    lng?: number
    note?: string
    estimated_at?: string
  }) {
    return this.service.providerCallback(body.provider_order_id, body)
  }

  // ==========================================
  // WEBHOOK MANAGEMENT
  // ==========================================

  // List all webhooks
  @Get('webhooks/list')
  listWebhooks() {
    return this.webhookService.findAll()
  }

  // Register a webhook
  // POST /delivery/webhooks
  // Body: { name, url, secret?, events?, provider? }
  @Post('webhooks')
  registerWebhook(@Body() body: {
    name: string
    url: string
    secret?: string
    events?: string[]
    provider?: string
    config?: Record<string, any>
  }) {
    return this.webhookService.register(body)
  }

  // Update a webhook
  @Patch('webhooks/:id')
  updateWebhook(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.webhookService.update(id, body)
  }

  // Delete a webhook
  @Delete('webhooks/:id')
  deleteWebhook(@Param('id', ParseIntPipe) id: number) {
    return this.webhookService.remove(id)
  }

  // Test a webhook (sends a test event)
  @Post('webhooks/:id/test')
  async testWebhook(@Param('id', ParseIntPipe) id: number) {
    const webhooks = await this.webhookService.findAll()
    const webhook = webhooks.find(w => w.id === id)
    if (!webhook) return { error: 'Webhook not found' }

    await this.webhookService.trigger('test', {
      message: 'This is a test webhook from BizPrint',
      timestamp: new Date().toISOString(),
    })

    return { success: true, message: 'Test webhook sent' }
  }
}
