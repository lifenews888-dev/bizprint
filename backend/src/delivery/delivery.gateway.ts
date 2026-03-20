import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Inject, forwardRef } from '@nestjs/common'
import { DeliveryService } from './delivery.service'

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/delivery' })
export class DeliveryGateway {
  @WebSocketServer()
  server: Server

  constructor(
    @Inject(forwardRef(() => DeliveryService))
    private deliveryService: DeliveryService,
  ) {}

  @SubscribeMessage('watch_delivery')
  handleWatch(@ConnectedSocket() client: Socket, @MessageBody() deliveryId: string) {
    client.join(`tracking:${deliveryId}`)
  }

  @SubscribeMessage('driver_location')
  async handleDriverLocation(@ConnectedSocket() _client: Socket, @MessageBody() data: { deliveryId: number; lat: number; lng: number; accuracy?: number }) {
    // Save to DB
    try {
      await this.deliveryService.updateLocation(data.deliveryId, data.lat, data.lng, data.accuracy)
    } catch {}
    // Broadcast to watchers
    this.server.to(`tracking:${data.deliveryId}`).emit('location_updated', {
      deliveryId: data.deliveryId,
      lat: data.lat,
      lng: data.lng,
      accuracy: data.accuracy,
      timestamp: new Date().toISOString(),
    })
  }

  notifyStatusChange(deliveryId: number, status: string, data?: any) {
    this.server.to(`tracking:${deliveryId}`).emit('delivery_status_changed', { deliveryId, status, ...data })
  }
}
