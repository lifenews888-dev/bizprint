import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Role } from '../auth/entities/role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column()
  full_name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  company_name: string;

  @Column({ nullable: true })
  register_number: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ default: 'mn' })
  preferred_lang: string;

  @Column({ default: 'customer' })
  role: string;

  /** Creator (UGC) role — customer can upgrade */
  @Column({ default: false })
  is_creator: boolean;

  /** Creator application status: null | pending | approved | rejected */
  @Column({ nullable: true })
  creator_status: string;

  @Column({ nullable: true })
  creator_approved_at: Date;

  /** Creator portfolio / bio */
  @Column({ nullable: true })
  creator_bio: string;

  @Column('simple-array', { nullable: true })
  creator_skills: string[];

  @Column({ nullable: true })
  portfolio_url: string;

  /** Creator capabilities: ugc, live, design */
  @Column('simple-array', { nullable: true })
  creator_capabilities: string[];

  @Column({ nullable: true })
  role_id: string;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role_entity: Role;

  @Column({ default: false })
  totp_enabled: boolean;

  @Column({ nullable: true })
  totp_secret: string;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  last_login_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  bank_name: string;

  @Column({ nullable: true })
  bank_account: string;

  @Column({ nullable: true })
  bank_account_name: string;

  /** Гэрээний файл (signed contract PDF) */
  @Column({ nullable: true })
  contract_url: string;

  /** Гэрээний хавсралт (нэмэлт баримт бичиг) */
  @Column({ nullable: true })
  contract_attachment_url: string;

  /** Гэрээ баталсан огноо */
  @Column({ nullable: true })
  contract_signed_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}