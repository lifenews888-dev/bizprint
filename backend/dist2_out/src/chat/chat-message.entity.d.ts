export declare class ChatMessage {
    id: number;
    room_id: string;
    sender_id: string;
    sender_name: string;
    sender_role: string;
    message: string;
    file_url: string;
    is_read: boolean;
    created_at: Date;
}
