/* Нэрийн хуудасны бэлэн загварууд: BP-NC-001 … BP-NC-389.
   Зураг: public/bizcard/<код>.webp (мокап), <код>-f.webp (нүүр), <код>-b.webp (ар). */
export const BIZCARD_COUNT = 389

export const bizcardCodes: string[] = Array.from({ length: BIZCARD_COUNT }, (_, i) => `BP-NC-${String(i + 1).padStart(3, '0')}`)

export const isBizcardCode = (code: string) => /^BP-NC-\d{3}$/.test(code) && bizcardCodes.includes(code)

export const bizcardImg = (code: string, side: 'mock' | 'f' | 'b' = 'mock') =>
  side === 'mock' ? `/bizcard/${code}.webp` : `/bizcard/${code}-${side}.webp`
