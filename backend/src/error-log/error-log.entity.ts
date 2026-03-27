import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum ErrorSource {
  WEB = 'web',               // Frontend web app
  USER_APP = 'user_app',     // Customer mobile app
  DRIVER_APP = 'driver_app', // Courier/driver app
  VENDOR_APP = 'vendor_app', // Vendor/factory app
  BACKEND = 'backend',       // Server-side errors
  WEBHOOK = 'webhook',       // Webhook delivery failures
  PAYMENT = 'payment',       // Payment gateway errors
  QUEUE = 'queue',           // BullMQ job failures
  INTEGRATION = 'integration', // External API errors
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  IGNORED = 'ignored',
}

@Entity('error_logs')
export class ErrorLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Error identification
  @Column({ type: 'enum', enum: ErrorSource })
  @Index()
  source: ErrorSource;

  @Column({ type: 'enum', enum: ErrorSeverity, default: ErrorSeverity.MEDIUM })
  severity: ErrorSeverity;

  @Column({ type: 'enum', enum: ErrorStatus, default: ErrorStatus.OPEN })
  @Index()
  status: ErrorStatus;

  // Error details
  @Column()
  message: string;

  @Column({ nullable: true })
  error_code: string;

  @Column({ type: 'text', nullable: true })
  stack_trace: string;

  // Context
  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })
  order_id: string;

  @Column({ nullable: true })
  endpoint: string;

  @Column({ nullable: true })
  http_method: string;

  @Column({ type: 'int', nullable: true })
  http_status: number;

  // Device/App info
  @Column({ nullable: true })
  app_version: string;

  @Column({ nullable: true })
  device_info: string;

  @Column({ nullable: true })
  os: string;

  @Column({ nullable: true })
  browser: string;

  // Resolution
  @Column({ nullable: true })
  resolved_by: string;

  @Column({ type: 'text', nullable: true })
  resolution_note: string;

  @Column({ nullable: true })
  resolved_at: Date;

  // Meta
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'int', default: 1 })
  occurrence_count: number;

  @Column({ nullable: true })
  first_seen_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
