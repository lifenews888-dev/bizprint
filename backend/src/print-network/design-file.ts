import * as fs from 'fs'
import * as path from 'path'
import { randomBytes } from 'crypto'
import { Readable, Transform } from 'stream'
import { pipeline } from 'stream/promises'
import { PRINT_FILES_DIR, PRINT_FILE_MAX_BYTES } from './print-files'
import { safeUploadedFileUrl } from './print-network.service'

const EXTS = ['pdf', 'png', 'jpg', 'jpeg', 'tif', 'tiff']
const MAGIC: Record<string, number[][]> = {
  pdf: [[0x25, 0x50, 0x44, 0x46]],
  png: [[0x89, 0x50, 0x4e, 0x47]],
  jpg: [[0xff, 0xd8, 0xff]],
  jpeg: [[0xff, 0xd8, 0xff]],
  tif: [[0x49, 0x49, 0x2a, 0x00], [0x4d, 0x4d, 0x00, 0x2a]],
  tiff: [[0x49, 0x49, 0x2a, 0x00], [0x4d, 0x4d, 0x00, 0x2a]],
}

/** Зөвхөн манай Cloudinary бүртгэлийн файлыг зөвшөөрнө (дизайнерын upload-ууд тэнд байдаг) */
export function isOwnCloudinaryUrl(raw: string, cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
  if (!cloudName) return false
  try {
    const u = new URL(raw)
    return u.protocol === 'https:' && u.hostname === 'res.cloudinary.com' && u.pathname.split('/')[1] === cloudName
  } catch {
    return false
  }
}

/**
 * Дизайнерын батлагдсан файлыг цехийн агент татаж чадах газарт (/uploads/print-files) аваачна.
 * - Манай /uploads дахь файл бол тэр чигээр нь буцаана.
 * - Манай Cloudinary-ийн файл бол серверт татаж хадгална.
 * - Бусад бүх URL → null (цех рүү гадны URL дамжуулахгүй).
 */
export async function importDesignFile(raw: string, dir = PRINT_FILES_DIR): Promise<string | null> {
  const local = safeUploadedFileUrl(raw)
  if (local) return local
  if (!isOwnCloudinaryUrl(raw)) return null

  const ext = (new URL(raw).pathname.split('.').pop() || '').toLowerCase()
  if (!EXTS.includes(ext)) return null

  const res = await fetch(raw, { redirect: 'error', signal: AbortSignal.timeout(10 * 60_000) })
  if (!res.ok || !res.body) return null
  if (Number(res.headers.get('content-length') || 0) > PRINT_FILE_MAX_BYTES) return null

  fs.mkdirSync(dir, { recursive: true })
  const name = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`
  const dest = path.join(dir, name)
  let bytes = 0
  try {
    await pipeline(
      Readable.fromWeb(res.body as any),
      new Transform({
        transform(chunk, _e, cb) {
          bytes += chunk.length
          cb(bytes > PRINT_FILE_MAX_BYTES ? new Error('too large') : null, chunk)
        },
      }),
      fs.createWriteStream(dest),
    )
    const head = Buffer.alloc(8)
    const fd = fs.openSync(dest, 'r')
    try { fs.readSync(fd, head, 0, 8, 0) } finally { fs.closeSync(fd) }
    if (!MAGIC[ext].some((sig) => sig.every((b, i) => head[i] === b))) throw new Error('content type mismatch')
  } catch {
    fs.rmSync(dest, { force: true })
    return null
  }
  return `/uploads/print-files/${name}`
}
