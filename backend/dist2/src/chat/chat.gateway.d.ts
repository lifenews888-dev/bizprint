import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private chatService;
    server: Server;
    private connectedUsers;
    constructor(chatService: ChatService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoin(client: Socket, data: {
        userId: string;
        userName: string;
        role: string;
    }): Promise<void>;
    handleJoinRoom(client: Socket, data: {
        room_id: string;
    }): Promise<void>;
    handleMessage(client: Socket, data: {
        room_id: string;
        sender_id: string;
        sender_name: string;
        sender_role: string;
        message: string;
        file_url?: string;
    }): Promise<void>;
    handleCreateRoom(client: Socket, data: {
        type: string;
        participants: string[];
        participantNames: string[];
        orderId?: string;
    }): Promise<import("./chat-room.entity").ChatRoom>;
    handleMarkRead(client: Socket, data: {
        room_id: string;
        user_id: string;
    }): Promise<void>;
}
