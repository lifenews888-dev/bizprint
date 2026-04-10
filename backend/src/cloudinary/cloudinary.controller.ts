import { Controller, Post, UseInterceptors, UploadedFiles, UseGuards } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CloudinaryService } from './cloudinary.service'

@Controller('upload')
export class CloudinaryController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  @Post('images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true)
      else cb(new Error('Зөвхөн зураг байх ёстой'), false)
    },
  }))
  async upload(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) return { error: 'Файл олдсонгүй' }
    const urls = await this.cloudinary.uploadMultiple(files.map(f => f.buffer), 'bizprint-products')
    return { urls, count: urls.length }
  }
}
