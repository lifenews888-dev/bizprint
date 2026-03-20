import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { File, FileStatus, FileType } from './file.entity'

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly repo: Repository<File>,
  ) {}

  // Get all files for an order
  async findByOrder(orderId: string): Promise<File[]> {
    return this.repo.find({
      where: { order_id: orderId },
      order: { version: 'DESC', created_at: 'DESC' },
    })
  }

  // Get final file for an order
  async findFinal(orderId: string): Promise<File | null> {
    return this.repo.findOne({
      where: { order_id: orderId, is_final: true },
    })
  }

  // Get latest version number
  async getNextVersion(orderId: string): Promise<number> {
    const latest = await this.repo.findOne({
      where: { order_id: orderId },
      order: { version: 'DESC' },
    })
    return latest ? latest.version + 1 : 1
  }

  // Upload / create file record
  async create(data: {
    order_id: string
    filename: string
    path: string
    size: number
    mime_type?: string
    file_type?: FileType
    uploaded_by?: string
    uploaded_by_role?: string
  }): Promise<File> {
    const version = await this.getNextVersion(data.order_id)
    const file = this.repo.create({
      ...data,
      version,
      file_type: data.file_type || FileType.ORIGINAL,
      status: FileStatus.UPLOADED,
    })
    return this.repo.save(file)
  }

  // Update analysis results
  async updateAnalysis(id: string, analysis: any): Promise<File> {
    const file = await this.repo.findOne({ where: { id } })
    if (!file) throw new NotFoundException('File not found')
    file.analysis = analysis
    file.status = FileStatus.CHECKING
    return this.repo.save(file)
  }

  // Approve a file
  async approve(id: string): Promise<File> {
    const file = await this.repo.findOne({ where: { id } })
    if (!file) throw new NotFoundException('File not found')
    file.status = FileStatus.APPROVED
    return this.repo.save(file)
  }

  // Reject a file
  async reject(id: string, notes?: string): Promise<File> {
    const file = await this.repo.findOne({ where: { id } })
    if (!file) throw new NotFoundException('File not found')
    file.status = FileStatus.REJECTED
    if (notes) file.notes = notes
    return this.repo.save(file)
  }

  // Set as final (single source of truth)
  async setFinal(id: string): Promise<File> {
    const file = await this.repo.findOne({ where: { id } })
    if (!file) throw new NotFoundException('File not found')

    // Remove final from all other files of this order
    await this.repo.update(
      { order_id: file.order_id },
      { is_final: false },
    )

    // Set this one as final
    file.is_final = true
    file.status = FileStatus.APPROVED
    return this.repo.save(file)
  }

  // Get file by id
  async findOne(id: string): Promise<File> {
    const file = await this.repo.findOne({ where: { id } })
    if (!file) throw new NotFoundException('File not found')
    return file
  }

  // Delete file
  async remove(id: string): Promise<void> {
    await this.repo.delete(id)
  }
}
