import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Invitation } from './invitation.entity';

export type RsvpStatus = 'pending' | 'attending' | 'declined' | 'maybe';

@Entity('invitation_guests')
export class InvitationGuest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  invitation_id: string;

  @ManyToOne(() => Invitation)
  @JoinColumn({ name: 'invitation_id' })
  invitation: Invitation;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: 'pending' })
  rsvp_status: RsvpStatus;

  @Column({ default: 1 })
  guest_count: number;

  /** Plus one name */
  @Column({ nullable: true })
  plus_one_name: string;

  /** Dietary / special needs */
  @Column({ nullable: true })
  dietary_notes: string;

  /** Personal message from guest */
  @Column({ type: 'text', nullable: true })
  message: string;

  /** Decline reason / хүндэтгэх шалтгаан */
  @Column({ type: 'text', nullable: true })
  decline_reason: string;

  /** Unique invite link token */
  @Column({ unique: true })
  invite_token: string;

  /** Has the guest viewed the invitation? */
  @Column({ default: false })
  has_viewed: boolean;

  @Column({ nullable: true })
  viewed_at: Date;

  @Column({ nullable: true })
  responded_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
