import { Controller, Post, UseInterceptors, UploadedFiles, UploadedFile, UseGuards } from '@nestjs/common'
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express'
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

  @Post('media')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB (видео том байж болно)
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) cb(null, true)
      else cb(new Error('Зөвхөн зураг эсвэл видео байх ёстой'), false)
    },
  }))
  async uploadMedia(@UploadedFile() file: Express.Multer.File) {
    if (!file) return { error: 'Файл олдсонгүй' }
    const isVideo = file.mimetype.startsWith('video/')
    const result = isVideo
      ? await this.cloudinary.uploadVideo(file.buffer, 'bizprint-gallery')
      : await this.cloudinary.uploadImage(file.buffer, 'bizprint-gallery')
    return { url: result.url, publicId: result.publicId, type: isVideo ? 'video' : 'image', ...result }
  }
}
