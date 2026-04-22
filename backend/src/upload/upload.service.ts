import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

/**
 * File signature ("magic number") table for the formats we accept.
 * Each entry is one or more byte sequences that the file MUST start with
 * (allowing for short prefix offset for formats like MP4 / WebM that
 * embed the type marker after a length-prefix box).
 *
 * Why we check magic bytes instead of trusting MIME type / extension:
 *   - MIME and extension are both client-controlled
 *   - An attacker can rename evil.exe to evil.pdf and set
 *     Content-Type: application/pdf — the server-side magic check is
 *     the only thing that would catch it
 */
const MAGIC: Record<string, Array<{ offset: number; bytes: number[] }>> = {
  '.pdf':  [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }],                  // %PDF
  '.png':  [{ offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
  '.jpg':  [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],
  '.jpeg': [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],
  '.gif':  [
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] },                // GIF87a
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] },                // GIF89a
  ],
  '.webp': [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }],                   // RIFF (then WEBP at offset 8 — checked below)
  '.mp4':  [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }],                   // ftyp box
  '.mov':  [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }],                   // ftyp box
  '.webm': [{ offset: 0, bytes: [0x1A, 0x45, 0xDF, 0xA3] }],                   // EBML
};

const MIME_MAP: Record<string, string[]> = {
  '.pdf':  ['application/pdf'],
  '.png':  ['image/png'],
  '.jpg':  ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.webp': ['image/webp'],
  '.gif':  ['image/gif'],
  '.mp4':  ['video/mp4'],
  '.webm': ['video/webm'],
  '.mov':  ['video/quicktime'],
};

const ALLOWED_EXTS = Object.keys(MAGIC);

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  processFile(file: Express.Multer.File) {
    if (!file) {
      return { error: 'Файл байхгүй байна' };
    }

    // Path traversal hardening — strip any directory components from the
    // client-supplied name before we touch the filesystem.
    const baseName = path.basename(file.originalname || 'upload');
    const ext = path.extname(baseName).toLowerCase();

    if (!ALLOWED_EXTS.includes(ext)) {
      return { error: 'Зөвшөөрөгдөөгүй файлын төрөл' };
    }

    if (MIME_MAP[ext] && !MIME_MAP[ext].includes(file.mimetype)) {
      this.logger.warn(`Upload rejected: ext=${ext} mime=${file.mimetype} (mismatch)`);
      return { error: 'Файлын төрөл зөрүүтэй байна' };
    }

    if (!this.matchesMagic(file.buffer, ext)) {
      this.logger.warn(`Upload rejected: ext=${ext} magic-mismatch — possible spoofed file`);
      return { error: 'Файлын агуулга төрөлдөө таарахгүй байна' };
    }

    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}-${safeName}`;
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, file.buffer);

    return {
      success: true,
      original_name: baseName,
      saved_as: filename,
      size_mb: sizeMB,
      mimetype: file.mimetype,
      file_url: `/uploads/${filename}`,
      message: 'Файл амжилттай хадгалагдлаа',
    };
  }

  private matchesMagic(buf: Buffer | undefined, ext: string): boolean {
    if (!buf || buf.length < 12) return false;
    const variants = MAGIC[ext];
    if (!variants) return false;
    const matched = variants.some(v => {
      if (buf.length < v.offset + v.bytes.length) return false;
      for (let i = 0; i < v.bytes.length; i++) {
        if (buf[v.offset + i] !== v.bytes[i]) return false;
      }
      return true;
    });
    if (!matched) return false;

    // WebP needs a second check — RIFF...WEBP container
    if (ext === '.webp') {
      if (buf.length < 12) return false;
      return buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
    }
    return true;
  }
}
