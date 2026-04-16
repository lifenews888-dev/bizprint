import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('gallery_images')
export class GalleryImage {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  public_id: string  // Cloudinary public_id

  @Column()
  url: string  // Cloudinary secure_url

  @Column({ nullable: true })
  caption: string

  @Column({ nullable: true })
  alt: string

  @Column({ type: 'int', default: 0 })
  width: number

  @Column({ type: 'int', default: 0 })
  height: number

  @Column({ nullable: true })
  format: string  // jpg, png, webp

  @Column({ nullable: true })
  category: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ default: false })
  is_featured: boolean

  @Column({ type: 'int', default: 0 })
  sort_order: number

  @Column({ default: true })
  is_active: boolean

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
