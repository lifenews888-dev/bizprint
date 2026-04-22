import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { CommissionStatus } from './commission.entity';

/**
 * SalesCommission — payout owed to a sales agent for an order they referred.
 *
 * Distinct from CommissionLog (which tracks vendor commission, calculated
 * against gross order amount). Sales commission is calculated against the
 * margin (customer_price - vendor_cost), since the agent's reward comes out
 * of platform profit, not the vendor's revenue.
 */
@Entity('sales_commissions')
export class SalesCommission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  order_id: string;

  /** user.id of the sales agent. Resolved from order.sales_agent_id at ORDER_PAID time. */
  @Column()
  sales_user_id: string;

  /** Optional snapshot of the agent's display name at the time of the order. */
  @Column({ nullable: true })
  sales_user_name: string;

  /** Order total (customer-facing price including VAT). */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  order_total: number;

  /** Calculated margin = order_total - vendor_cost. We default to using
      order.total_price * 0.4 as a reasonable margin estimate when the
      ProfitEngine has not produced an OrderProfit row yet. */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  margin_amount: number;

  /** Sales commission rate (% of margin). Resolved from referral.commission_rate or default. */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  commission_rate: number;

  /** Final payout amount = margin * rate / 100. */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  commission_amount: number;

  @Column({ type: 'enum', enum: CommissionStatus, default: CommissionStatus.PENDING })
  status: CommissionStatus;

  @Column({ nullable: true })
  paid_at: Date;

  @Column({ nullable: true })
  payout_batch_id: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
