import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum InkType {
  CMYK       = 'CMYK',
  PANTONE    = 'Pantone',
  UV         = 'UV',
  WATERBASED = 'water_based',
  DIGITAL    = 'digital_toner',
}

@Entity('ink_profiles')
export class InkProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // "Standard CMYK", "UV Gloss"

  @Column({ type: 'enum', enum: InkType })
  type: InkType;

  @Column('decimal', { precision: 8, scale: 4 })
  coverageRateMlPerM2: number; // мл / м²

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerLiter: number; // MNT

  @Column({ nullable: true })
  supplier: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
