import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum InquiryStatus {
  NEW       = 'new',
  REVIEWING = 'reviewing',
  QUOTED    = 'quoted',
  CONFIRMED = 'confirmed',
  IN_WORK   = 'in_work',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ContactMethod {
  CHAT  = 'chat',
  VIBER = 'viber',
  EMAIL = 'email',
  PHONE = 'phone',
}

@Entity('print_inquiries')
export class PrintInquiry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  inquiry_number: string;

  // — Customer —
  @Column({ nullable: true }) customer_id: string;
  @Column({ nullable: true }) customer_name: string;
  @Column({ nullable: true }) customer_phone: string;
  @Column({ nullable: true }) customer_email: string;
  @Column({ nullable: true }) customer_company: string;
  @Column({ nullable: true }) viber_number: string;

  // — Product —
  @Column({ nullable: true }) product_id: string;
  @Column({ nullable: true }) product_name: string;
  @Column({ nullable: true }) category: string;

  // — Print spec —
  @Column({ nullable: true }) quantity: number;
  @Column({ nullable: true }) size_label: string;
  @Column({ nullable: true }) width_mm: number;
  @Column({ nullable: true }) height_mm: number;
  @Column({ nullable: true }) paper_type: string;
  @Column({ nullable: true }) color_mode: string;
  @Column({ nullable: true }) sides: string;
  @Column({ type: 'jsonb', nullable: true }) finishing: string[];
  @Column({ type: 'text', nullable: true }) notes: string;

  // — File —
  @Column({ type: 'jsonb', nullable: true })
  files: Array<{ url: string; name: string; size: number; type: string; uploaded_at: string }>;

  @Column({ default: false }) has_design: boolean;
  @Column({ default: false }) needs_design: boolean;

  // — Communication —
  @Column({ type: 'enum', enum: ContactMethod, default: ContactMethod.CHAT })
  preferred_contact: ContactMethod;

  @Column({ type: 'enum', enum: InquiryStatus, default: InquiryStatus.NEW })
  status: InquiryStatus;

  @Column({ nullable: true }) assigned_to: string;
  @Column({ nullable: true }) quoted_price: number;
  @Column({ type: 'text', nullable: true }) admin_notes: string;

  // — Delivery —
  @Column({ nullable: true }) delivery_address: string;
  @Column({ nullable: true }) delivery_district: string;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
