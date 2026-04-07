import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true }) inquiry_id: string;
  @Column({ nullable: true }) order_id: string;
  @Column() sender_id: string;
  @Column() sender_name: string;
  @Column({ default: 'customer' }) sender_role: string; // customer | admin | system

  @Column({ type: 'text' }) content: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments: Array<{ url: string; name: string; type: string }>;

  @Column({ default: false }) is_read: boolean;
  @Column({ default: false }) is_system: boolean;

  @CreateDateColumn() created_at: Date;
}
