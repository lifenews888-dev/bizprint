import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany
} from 'typeorm';

@Entity('paper_stocks')
export class PaperStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // "Glossy 130gsm", "Matte 170gsm"

  @Column()
  size: string; // "A4", "A3", "SRA3", "A2", "custom"

  @Column({ nullable: true })
  widthMm: number;

  @Column({ nullable: true })
  heightMm: number;

  @Column()
  weightGsm: number; // 80, 100, 130, 150, 170, 200, 250, 300, 350

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerSheet: number; // MNT

  @Column({ nullable: true })
  supplier: string;

  @Column({ default: 0 })
  stockQty: number;

  @Column({ default: 100 })
  reorderLevel: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
