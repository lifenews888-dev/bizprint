import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class PaperType {

@PrimaryGeneratedColumn('uuid')
id: string

@Column()
name: string

@Column()
price_per_sheet: number

}
