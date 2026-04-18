import { Injectable, Logger } from '@nestjs/common'
import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name)

  async uploadImage(buffer: Buffer, folder = 'bizprint'): Promise<{ url: string; publicId: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image', transformation: [{ width: 800, height: 600, crop: 'limit' }, { quality: 'auto', fetch_format: 'auto' }] },
        (error, result) => {
          if (error) { this.logger.error('Upload failed: ' + error.message); reject(error) }
          else resolve({ url: result!.secure_url, publicId: result!.public_id, width: result!.width, height: result!.height })
        },
      )
      Readable.from(buffer).pipe(stream)
    })
  }

  async uploadVideo(buffer: Buffer, folder = 'bizprint'): Promise<{ url: string; publicId: string; width: number; height: number; duration?: number }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'video', transformation: [{ width: 1920, height: 1080, crop: 'limit' }, { quality: 'auto', fetch_format: 'mp4' }] },
        (error, result) => {
          if (error) { this.logger.error('Video upload failed: ' + error.message); reject(error) }
          else resolve({ url: result!.secure_url, publicId: result!.public_id, width: result!.width, height: result!.height, duration: result!.duration })
        },
      )
      Readable.from(buffer).pipe(stream)
    })
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId)
  }

  async uploadMultiple(buffers: Buffer[], folder = 'bizprint'): Promise<string[]> {
    const results = await Promise.all(buffers.map(b => this.uploadImage(b, folder)))
    return results.map(r => r.url)
  }
}
