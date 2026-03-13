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
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.ai', '.eps'];

    if (!allowed.includes(ext)) {
      return { error: 'Зөвшөөрөгдөөгүй файлын төрөл' };
    }

    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${file.originalname}`;
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