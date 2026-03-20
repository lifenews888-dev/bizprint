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
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const chat_service_1 = require("./chat.service");
let ChatGateway = class ChatGateway {
    constructor(chatService) {
        this.chatService = chatService;
        this.connectedUsers = new Map();
    }
    handleConnection(client) {
        console.log('Chat client connected:', client.id);
    }
    handleDisconnect(client) {
        this.connectedUsers.delete(client.id);
        console.log('Chat client disconnected:', client.id);
    }
    async handleJoin(client, data) {
        this.connectedUsers.set(client.id, data.userId);
        client.join('user-' + data.userId);
        const rooms = await this.chatService.getRoomsForUser(data.userId);
        for (const room of rooms) {
            client.join(room.room_id);
        }
        client.emit('joined', { rooms });
    }
    async handleJoinRoom(client, data) {
        client.join(data.room_id);
        const messages = await this.chatService.getMessages(data.room_id);
        client.emit('room_messages', { room_id: data.room_id, messages });
    }
    async handleMessage(client, data) {
        const saved = await this.chatService.saveMessage(data);
        this.server.to(data.room_id).emit('new_message', saved);
    }
    async handleCreateRoom(client, data) {
        const room = await this.chatService.getOrCreateRoom(data);
        client.join(room.room_id);
        this.server.to(room.room_id).emit('room_created', room);
        return room;
    }
    async handleMarkRead(client, data) {
        await this.chatService.markRead(data.room_id, data.user_id);
        this.server.to(data.room_id).emit('messages_read', data);
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('create_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleCreateRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('mark_read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkRead", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' }, namespace: '/chat' }),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map