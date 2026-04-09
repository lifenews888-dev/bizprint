import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  processFile(file: Express.Multer.File) {
    if (!file) {
      return { error: 'Файл байхгүй байна' };
    }

    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ai', '.eps', '.mp4', '.webm', '.mov'];

    if (!allowed.includes(ext)) {
      return { error: 'Зөвшөөрөгдөөгүй файлын төрөл' };
    }

    // MIME type validation
    const mimeMap: Record<string, string[]> = {
      '.pdf': ['application/pdf'],
      '.png': ['image/png'],
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.webp': ['image/webp'],
      '.gif': ['image/gif'],
      '.mp4': ['video/mp4'],
      '.webm': ['video/webm'],
      '.mov': ['video/quicktime'],
    };
    if (mimeMap[ext] && !mimeMap[ext].includes(file.mimetype)) {
      return { error: 'Файлын төрөл зөрүүтэй байна' };
    }

    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}-${safeName}`;
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, file.buffer);

    return {
      success: true,
      original_name: file.originalname,
      saved_as: filename,
      size_mb: sizeMB,
      mimetype: file.mimetype,
      file_url: `/uploads/${filename}`,
      message: 'Файл амжилттай хадгалагдлаа',
    };
  }
}