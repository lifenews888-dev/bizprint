import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Чатаар (Яриа + n8n) орж ирсэн бүрэн автомат захиалга.
 * Orders модулийн FROZEN state machine-тэй холилдуулахгүйн тулд тусдаа хүснэгт, өөрийн төлөвтэй.
 * Migration: migrations/2026-11-23-01-flow-orders.sql
 */
export enum FlowOrderStatus {
  RENDERING = 'rendering',
  RENDER_FAILED = 'render_failed',
  AWAITING_APPROVAL = 'awaiting_approval',
  AWAITING_PAYMENT = 'awaiting_payment',
  IN_PRODUCTION = 'in_production',
  READY = 'ready',
  DELIVERY_REQUESTED = 'delivery_requested',
  DELIVERED = 'delivered',
  NEEDS_HUMAN = 'needs_human',
  CANCELLED = 'cancelled',
}

export type FlowFinish = 'none' | 'lak' | 'burelt';

@Entity('flow_orders')
export class FlowOrder {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar', length: 32, unique: true }) order_no: string;
  @Column({ type: 'varchar', length: 24, default: 'yria' }) source: string;

  @Index('idx_flow_orders_conversation')
  @Column({ type: 'varchar', length: 128 })
  conversation_id: string;
  @Column({ type: 'varchar', length: 160, nullable: true }) customer_name:
    | string
    | null;
  @Column({ type: 'varchar', length: 32 }) customer_phone: string;

  @Column({ type: 'varchar', length: 32, default: 'business_card' })
  product: string;
  @Column({ type: 'uuid', nullable: true }) bc_product_id: string | null;
  @Column({ type: 'varchar', length: 64 }) template: string;
  @Column({ type: 'int' }) quantity: number;
  @Column({ type: 'varchar', length: 16, default: 'none' }) finish: FlowFinish;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) fields: Record<
    string,
    string
  >;
  @Column({ type: 'text', nullable: true }) logo_url: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2 }) unit_price: number;
  @Column({ type: 'decimal', precision: 14, scale: 2 }) amount_ex_vat: number;
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 }) vat: number;
  @Column({ type: 'decimal', precision: 14, scale: 2 }) amount: number;

  @Index('idx_flow_orders_status')
  @Column({ type: 'varchar', length: 24, default: FlowOrderStatus.RENDERING })
  status: FlowOrderStatus;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  status_history: Array<{ from: string | null; to: string; at: string }>;
  @Column({ type: 'int', default: 0 }) edit_count: number;

  @Column({ type: 'jsonb', nullable: true }) preview_urls: string[] | null;
  @Column({ type: 'text', nullable: true }) pdf_url: string | null;
  @Column({ type: 'varchar', length: 64, nullable: true }) render_job_id:
    | string
    | null;
  @Column({ type: 'jsonb', nullable: true }) render_warnings: string[] | null;
  @Column({ type: 'text', nullable: true }) render_error: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true }) qpay_invoice_id:
    | string
    | null;
  @Column({ type: 'timestamptz', nullable: true }) approved_at: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) paid_at: Date | null;
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  paid_amount: number | null;
  @Column({ type: 'varchar', length: 64, nullable: true }) payment_id:
    | string
    | null;
  @Column({ type: 'timestamptz', nullable: true })
  sent_to_factory_at: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) ready_at: Date | null;
  @Column({ type: 'varchar', length: 16, nullable: true }) delivery_method:
    | string
    | null;
  @Column({ type: 'text', nullable: true }) delivery_address: string | null;
  @Column({ type: 'timestamptz', nullable: true }) delivered_at: Date | null;

  @Index('idx_flow_orders_created')
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updated_at: Date;
}
