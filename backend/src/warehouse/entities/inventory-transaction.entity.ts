import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, JoinColumn,
} from 'typeorm';
import { PaperStock } from '../../materials/entities/paper-stock.entity';
import { User } from '../../users/user.entity';

export enum TransactionType {
  IN          = 'in',         // Нийлүүлэгчээс ирсэн
  OUT         = 'out',        // Үйлдвэрлэлд зарцуулсан
  ADJUSTMENT  = 'adjustment', // Тооллогоор засвар
  DAMAGED     = 'damaged',    // Гэмтэл/шарагдал
  RETURN      = 'return',     // Буцаагдсан
}

@Entity('inventory_transactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  materialId: string;

  @ManyToOne(() => PaperStock)
  @JoinColumn({ name: 'materialId' })
  material: PaperStock;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column('decimal', { precision: 10, scale: 2 })
  qty: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitCost: number; // Нэгжийн зардал (IN үед)

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true })
  orderId: string; // OUT үед холбогдох захиалга

  @Column({ nullable: true })
  supplier: string;

  @Column({ nullable: true })
  invoiceNo: string;

  @Column()
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  balanceAfter: number; // Гүйлгээний дараах үлдэгдэл

  @CreateDateColumn()
  createdAt: Date;
}
