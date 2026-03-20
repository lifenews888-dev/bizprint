import { Repository } from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { ChatRoom } from './chat-room.entity';
export declare class ChatService {
    private msgRepo;
    private roomRepo;
    constructor(msgRepo: Repository<ChatMessage>, roomRepo: Repository<ChatRoom>);
    getOrCreateRoom(params: {
        type: string;
        participants: string[];
        participantNames: string[];
        orderId?: string;
    }): Promise<ChatRoom>;
    getRoomsForUser(userId: string): Promise<ChatRoom[]>;
    getAllRooms(): Promise<ChatRoom[]>;
    getMessages(room_id: string, limit?: number): Promise<ChatMessage[]>;
    saveMessage(data: {
        room_id: string;
        sender_id: string;
        sender_name: string;
        sender_role: string;
        message: string;
        file_url?: string;
    }): Promise<ChatMessage>;
    markRead(room_id: string, user_id: string): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
    fixParticipantNames(): Promise<any>;
}
