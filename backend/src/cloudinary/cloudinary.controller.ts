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
    const results = await Promise.all(
      files.map(f => this.cloudinary.uploadImage(f.buffer, 'bizprint-gallery')),
    )
    // Backward compat: urls=[string] for existing callers, images=[{url, publicId, width, height}]
    return {
      urls: results.map(r => r.url),
      images: results,
      count: results.length,
    }
  }
}
