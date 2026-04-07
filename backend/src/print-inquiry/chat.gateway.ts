import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: 'inquiry-chat', cors: { origin: '*' } })
export class InquiryChatGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    const id = client.handshake.query.inquiry_id as string;
    if (id) client.join(`inq:${id}`);
  }

  @SubscribeMessage('join')
  join(@ConnectedSocket() c: Socket, @MessageBody() d: { inquiry_id: string }) {
    c.join(`inq:${d.inquiry_id}`);
    return { ok: true };
  }

  @SubscribeMessage('admin_join')
  adminJoin(@ConnectedSocket() c: Socket) {
    c.join('admins');
    return { ok: true };
  }

  @SubscribeMessage('typing')
  typing(@ConnectedSocket() c: Socket, @MessageBody() d: { inquiry_id: string; name: string }) {
    c.to(`inq:${d.inquiry_id}`).emit('typing', { name: d.name });
  }

  broadcastMsg(inquiryId: string, msg: any) {
    this.server.to(`inq:${inquiryId}`).emit('message', msg);
  }

  notifyAdmin(event: string, data: any) {
    this.server.to('admins').emit(event, data);
  }
}
