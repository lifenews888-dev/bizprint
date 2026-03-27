import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { DesignRequest } from '../design-request.entity';

@Entity('design_zoom_sessions')
export class DesignZoomSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  design_request_id: string;

  @ManyToOne(() => DesignRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'design_request_id' })
  designRequest: DesignRequest;

  /** Zoom meeting ID (from Zoom API) or null if using personal link */
  @Column({ nullable: true })
  zoom_meeting_id: string;

  /** Join URL for customer */
  @Column({ nullable: true })
  join_url: string;

  /** Start URL for designer (host) */
  @Column({ nullable: true })
  start_url: string;

  /** Meeting password */
  @Column({ nullable: true })
  password: string;

  /** Who requested the session: 'customer' | 'designer' */
  @Column({ nullable: true })
  requested_by: string;

  /** Scheduled start time */
  @Column({ nullable: true })
  scheduled_at: Date;

  /** Meeting notes */
  @Column({ type: 'text', nullable: true })
  notes: string;

  /** 'scheduled' | 'active' | 'completed' | 'cancelled' */
  @Column({ default: 'scheduled' })
  status: string;

  /** Google Calendar event ID (for sync) */
  @Column({ nullable: true })
  google_event_id: string;

  /** Google Calendar event link */
  @Column({ nullable: true })
  google_calendar_link: string;

  /** Meeting ended at */
  @Column({ nullable: true })
  ended_at: Date;

  /** Duration in minutes (calculated after meeting ends) */
  @Column({ type: 'int', nullable: true })
  duration_minutes: number;

  @CreateDateColumn()
  created_at: Date;
}
