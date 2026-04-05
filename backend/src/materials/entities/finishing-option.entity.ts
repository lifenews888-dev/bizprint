import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum FinishingType {
  FOLD       = 'fold',
  CUT        = 'cut',
  BIND       = 'bind',
  LAMINATE   = 'laminate',
  UV_COAT    = 'uv_coat',
  EMBOSS     = 'emboss',
  FOIL       = 'foil',
  PERFORATE  = 'perforate',
  CREASE     = 'crease',
  STAPLE     = 'staple',
}

@Entity('finishing_options')
export class FinishingOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // "Матт ламинат", "УВ лак", "Нугалах"

  @Column({ type: 'enum', enum: FinishingType })
  type: FinishingType;

  @Column('decimal', { precision: 10, scale: 2 })
  setupCost: number; // MNT — нэг удаагийн тохиргооны зардал

  @Column('decimal', { precision: 10, scale: 4 })
  unitPrice: number; // MNT — нэгж бүрийн үнэ

  @Column('decimal', { precision: 8, scale: 2 })
  timePerUnitMinutes: number; // минут / ширхэг

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
