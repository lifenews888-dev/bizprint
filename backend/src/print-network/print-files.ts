import * as fs from 'fs'
import * as path from 'path'
import { randomBytes } from 'crypto'
import { BadRequestException, Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import { diskStorage } from 'multer'

/**
 * Хэвлэлийн эх файл (PDF/TIFF/PNG/JPG) — ердийн /upload/file 10MB-аар
 * хязгаарлагддаг тул тусдаа, 500MB хүртэл, дискэнд шууд бичнэ.
 * Railway дээр `uploads/` хавтсыг volume болгож холбох ёстой, эс бөгөөс
 * redeploy хийхэд файлууд устна.
 */
export const PRINT_FILES_DIR = path.join(process.cwd(), 'uploads', 'print-files')
export const PRINT_FILE_MAX_BYTES = 500 * 1024 * 1024

const MAGIC: Record<string, number[][]> = {
  '.pdf': [[0x25, 0x50, 0x44, 0x46]],
  '.png': [[0x89, 0x50, 0x4e, 0x47]],
  '.jpg': [[0xff, 0xd8, 0xff]],
  '.jpeg': [[0xff, 0xd8, 0xff]],
  '.tif': [[0x49, 0x49, 0x2a, 0x00], [0x4d, 0x4d, 0x00, 0x2a]],
  '.tiff': [[0x49, 0x49, 0x2a, 0x00], [0x4d, 0x4d, 0x00, 0x2a]],
}

export const printFileStorage = diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(PRINT_FILES_DIR, { recursive: true })
    cb(null, PRINT_FILES_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(path.basename(file.originalname || '')).toLowerCase()
    cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`)
  },
})

export function printFileFilter(_req: any, file: Express.Multer.File, cb: (e: Error | null, ok: boolean) => void) {
  const ext = path.extname(file.originalname || '').toLowerCase()
  if (!MAGIC[ext]) return cb(new BadRequestException('Зөвхөн PDF, TIFF, PNG, JPG файл'), false)
  cb(null, true)
}

/** Дискэнд бичигдсэний дараа эхний байтуудаар төрлийг баталгаажуулна; таарахгүй бол устгана */
export function verifyPrintFile(file: Express.Multer.File | undefined) {
  if (!file) throw new BadRequestException('Файл байхгүй байна')
  const ext = path.extname(file.filename).toLowerCase()
  const head = Buffer.alloc(8)
  const fd = fs.openSync(file.path, 'r')
  try { fs.readSync(fd, head, 0, 8, 0) } finally { fs.closeSync(fd) }
  const ok = (MAGIC[ext] ?? []).some((sig) => sig.every((b, i) => head[i] === b))
  if (!ok) {
    fs.rmSync(file.path, { force: true })
    throw new BadRequestException('Файлын агуулга төрөлдөө таарахгүй байна')
  }
  return {
    file_url: `/uploads/print-files/${file.filename}`,
    original_name: path.basename(file.originalname),
    size_bytes: file.size,
  }
}

/** Хэрэглэгч тус бүрээр тоолох throttler (proxy-ийн ард IP найдваргүй). JwtAuthGuard-ийн ДАРАА ажиллана. */
@Injectable()
export class PerUserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.id ? `user:${req.user.id}` : req.ip
  }
}
