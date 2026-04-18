import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm';

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

  @Column({ nullable: true })
  role_request: string;

  @UpdateDateColumn()
  updated_at: Date;
}