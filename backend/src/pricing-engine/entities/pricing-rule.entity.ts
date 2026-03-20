import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

export enum RuleType {
  QUANTITY_DISCOUNT = 'QUANTITY_DISCOUNT',
  RUSH_FEE = 'RUSH_FEE',
  SIZE_FACTOR = 'SIZE_FACTOR',
  MATERIAL_FACTOR = 'MATERIAL_FACTOR',
  COMPETITOR_TACTIC = 'COMPETITOR_TACTIC',
}

export enum ConditionOperator {
  GTE = 'GTE',
  LTE = 'LTE',
  EQ = 'EQ',
  BETWEEN = 'BETWEEN',
}

export enum EffectType {
  MULTIPLY = 'MULTIPLY',
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
  SET_MAX = 'SET_MAX',
  SET_MIN = 'SET_MIN',
}

@Entity('pricing_engine_rules')
export class PricingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ nullable: true })
  product_code: string

  @Column({ type: 'enum', enum: RuleType })
  rule_type: RuleType

  @Column()
  condition_field: string

  @Column({ type: 'enum', enum: ConditionOperator })
  condition_operator: ConditionOperator

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  condition_value: number

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  condition_value2: number

  @Column({ type: 'enum', enum: EffectType })
  effect_type: EffectType

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  effect_value: number

  @Column({ default: 100 })
  priority: number

  @Column({ default: true })
  is_active: boolean

  @Column({ type: 'text', nullable: true })
  description: string

  @CreateDateColumn()
  created_at: Date
}
