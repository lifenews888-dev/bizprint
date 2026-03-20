import { ChatService } from './chat.service';
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatService);
    getAllRooms(): Promise<import("./chat-room.entity").ChatRoom[]>;
    getUserRooms(userId: string): Promise<import("./chat-room.entity").ChatRoom[]>;
    getMessages(roomId: string): Promise<import("./chat-message.entity").ChatMessage[]>;
    getUnread(userId: string): Promise<number>;
    fixNames(): Promise<any>;
}
