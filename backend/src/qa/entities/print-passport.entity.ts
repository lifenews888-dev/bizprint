import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, JoinColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('print_passports')
export class PrintPassport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'jsonb', nullable: true })
  paperSpec: {
    paperStockId: string;
    name: string;
    size: string;
    weightGsm: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  inkSpec: {
    inkProfileId: string;
    type: string;
    colorMode: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  machineSpec: {
    machineId: string;
    machineName: string;
    assignedAt: Date;
  };

  @Column({ type: 'jsonb', default: [] })
  finishingSpecs: Array<{
    finishingOptionId: string;
    name: string;
    type: string;
  }>;

  @Column({ type: 'jsonb', default: [] })
  qaCheckpointIds: string[];

  @Column({ default: false })
  finalApproval: boolean;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  approvedById: string;

  @CreateDateColumn()
  createdAt: Date;
}
