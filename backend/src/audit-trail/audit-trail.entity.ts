import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn
} from 'typeorm';

@Entity('audit_trails')
export class AuditTrail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  order_id: string;

  @Column()
  user: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  file: string;

  @CreateDateColumn()
  created_at: Date;
}
