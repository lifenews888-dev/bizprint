import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Серверийн гаргасан үнийн «битүүмж» (HMAC).
 *
 * Сервер үнэ бодоод (ж: PDF-ээс AI үнэ) хариунд нь битүүмж хавсаргана.
 * Хөтөч тэр үнийг сагсанд нэмэхдээ битүүмжийг буцааж илгээнэ — сервер
 * үнэ, тоо ширхэг, эх сурвалж өөрчлөгдөөгүй, хугацаа дуусаагүйг шалгана.
 * Битүүмжгүй / буруу бол хөтчийн илгээсэн үнэд ИТГЭХГҮЙ.
 */

export type PriceSealInput = {
  scope: string // үнийн эх сурвалж, ж: 'ai-upload'
  unit_price: number
  quantity: number
}

const VERSION = 'v1'
const DEFAULT_TTL_SEC = 24 * 60 * 60 // 24 цаг — сагсанд нэмэх хангалттай хугацаа

function secret(): string {
  return process.env.PRICE_SEAL_SECRET || process.env.JWT_SECRET || ''
}

function payload(p: PriceSealInput, exp: number): string {
  return [VERSION, p.scope, Math.round(Number(p.unit_price) || 0), Math.round(Number(p.quantity) || 0), exp].join('|')
}

function mac(data: string, key: string): string {
  return createHmac('sha256', key).update(data).digest('base64url')
}

export function sealPrice(p: PriceSealInput, ttlSec = DEFAULT_TTL_SEC, now = Date.now()): string | null {
  const key = secret()
  if (!key) return null
  const exp = Math.floor(now / 1000) + ttlSec
  return `${VERSION}.${exp}.${mac(payload(p, exp), key)}`
}

export function verifyPriceSeal(seal: unknown, p: PriceSealInput, now = Date.now()): boolean {
  const key = secret()
  if (!key || typeof seal !== 'string') return false
  const parts = seal.split('.')
  if (parts.length !== 3 || parts[0] !== VERSION) return false
  const exp = Number(parts[1])
  if (!Number.isInteger(exp) || exp < Math.floor(now / 1000)) return false
  const expected = Buffer.from(mac(payload(p, exp), key))
  const given = Buffer.from(parts[2])
  return expected.length === given.length && timingSafeEqual(expected, given)
}
