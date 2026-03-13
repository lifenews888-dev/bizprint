import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

export enum FileStatus {
  UPLOADED = 'uploaded',
  CHECKING = 'checking',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

@Entity('files')
export class File {

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  order_id: string

  @Column()
  filename: string

  @Column()
  path: string

  @Column()
  size: number

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.UPLOADED
  })
  status: FileStatus

}