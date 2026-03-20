import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/cms' })
export class CmsGateway {
  @WebSocketServer()
  server: Server

  notifySettingsUpdate(key: string, value: any) {
    this.server.emit('settings_updated', { key, value, timestamp: new Date().toISOString() })
  }

  notifyBulkSettingsUpdate(settings: Record<string, any>) {
    this.server.emit('settings_bulk_updated', { settings, timestamp: new Date().toISOString() })
  }

  notifyMenuUpdate(menu: any[]) {
    this.server.emit('menu_updated', { menu, timestamp: new Date().toISOString() })
  }
}
