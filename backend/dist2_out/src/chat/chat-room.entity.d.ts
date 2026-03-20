export declare class ChatRoom {
    id: number;
    room_id: string;
    type: string;
    order_id: string;
    participants: string[];
    participant_names: string[];
    last_message: string;
    last_message_at: Date;
    unread_count: number;
    created_at: Date;
    updated_at: Date;
}
