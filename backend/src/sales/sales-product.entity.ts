import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  Index, Unique,
} from 'typeorm'

/**
 * SalesProduct — junction row indicating that a sales agent has "adopted"
 * a product into their personal storefront.
 *
 * One row per (agent, product). The agent's storefront at /s/{referralCode}
 * lists every product where sales_user_id matches and is_active = true.
 * When a customer follows the agent's link, the resulting order picks up
 * the agent via Order.sales_agent_id (set by referral flow).
 */
@Entity('sales_products')
@Unique(['sales_user_id', 'product_id'])
@Index(['sales_user_id', 'is_active'])
export class SalesProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  sales_user_id: string

  @Column()
  product_id: string

  /** Optional per-listing override of the agent's commission rate. Falls
      back to Referral.commission_rate / DEFAULT_SALES_RATE when null. */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  commission_rate_override: number

  /** Sort order for the agent's storefront layout (lowest first). */
  @Column({ type: 'int', default: 0 })
  sort_order: number

  /** Soft-disable a listing without losing the row (so removing-and-readding
      keeps stats. */
  @Column({ default: true })
  is_active: boolean

  @Column({ type: 'text', nullable: true })
  agent_note: string

  @CreateDateColumn()
  created_at: Date
}
