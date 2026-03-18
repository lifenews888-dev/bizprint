import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true })
  user_id: string;
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  balance: number;
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  total_earned: number;
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  total_withdrawn: number;
  @CreateDateColumn()
  created_at: Date;
}

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  wallet_id: string;
  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;
  @Column({ type: 'varchar' })
  type: string;
  @Column({ type: 'varchar' })
  source: string;
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: number;
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  balance_after: number;
  @Column({ nullable: true })
  reference_id: string;
  @Column({ nullable: true })
  note: string;
  @Column({ type: 'varchar', default: 'approved' })
  status: string;
  @Column({ nullable: true })
  bank_name: string;

  @Column({ nullable: true })
  bank_account: string;

  @Column({ nullable: true })
  bank_account_name: string;

  @Column({ nullable: true })
  reject_reason: string;
  @CreateDateColumn()
  created_at: Date;
}