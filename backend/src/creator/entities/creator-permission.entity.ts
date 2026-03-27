import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('creator_permissions')
export class CreatorPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  creator_id: string;

  @Column({ default: true })
  can_receive_orders: boolean;

  @Column({ default: true })
  can_show_profile: boolean;

  @Column({ default: true })
  can_withdraw: boolean;

  @Column({ default: true })
  can_create_packages: boolean;

  @Column({ default: true })
  can_access_marketplace: boolean;

  @Column({ default: true })
  can_go_live: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
