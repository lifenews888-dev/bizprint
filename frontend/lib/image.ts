/**
 * Image URL helpers — append Cloudinary transformations on the fly so
 * thumbnail-sized cards download a 400px-wide image instead of a 4MB
 * original. Falls through unchanged for non-Cloudinary URLs.
 *
 * Usage:
 *   <img src={optimizeImage(url, { w: 400, h: 400 })} ... />
 *
 * Cloudinary transformation reference:
 *   w_400,h_400,c_fill,g_auto — crop to 400×400 keeping subject centred
 *   q_auto,f_auto             — auto quality + best modern format (webp/avif)
 *   dpr_auto                  — match the device pixel ratio (retina/2x)
 */

const CLOUDINARY_HOST = 'res.cloudinary.com'

interface ImageOpts {
  w?: number              // target width in CSS pixels (Cloudinary handles dpr)
  h?: number              // target height; omit to preserve aspect
  fit?: 'fill' | 'pad' | 'limit' | 'crop' | 'thumb' | 'scale'
  quality?: number | 'auto'
}

export function optimizeImage(url: string | null | undefined, opts: ImageOpts = {}): string {
  if (!url) return ''
  // Pass through full data URLs / blob URLs untouched.
  if (url.startsWith('data:') || url.startsWith('blob:')) return url

  // Only Cloudinary URLs accept the transformation segment we add below.
  // For everything else (local /uploads, ngrok, raw S3) return as-is so we
  // don't accidentally break the URL shape.
  let host = ''
  try { host = new URL(url, 'https://bizprint.mn').hostname } catch { return url }
  if (host !== CLOUDINARY_HOST) return url

  const { w, h, fit = 'fill', quality = 'auto' } = opts
  const segments: string[] = []
  if (w) segments.push(`w_${w}`)
  if (h) segments.push(`h_${h}`)
  if (w || h) segments.push(`c_${fit}`, 'g_auto')
  segments.push(`q_${quality}`, 'f_auto', 'dpr_auto')

  // Inject the transform after /upload/ if not already present. Cloudinary
  // ignores duplicate transform blocks but we keep a clean URL.
  const marker = '/upload/'
  const idx = url.indexOf(marker)
  if (idx === -1) return url
  const before = url.slice(0, idx + marker.length)
  const after = url.slice(idx + marker.length)
  // Skip if a transform block is already present (starts with a known param).
  if (/^([a-z]_[^/]+,?)+\//.test(after)) return url
  return `${before}${segments.join(',')}/${after}`
}

/** Shorthand for grid thumbnails (mobile + desktop card sizes). */
export function thumbnail(url: string | null | undefined, size = 400): string {
  return optimizeImage(url, { w: size, h: size, fit: 'fill' })
}
