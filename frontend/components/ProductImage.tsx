'use client'
import { useState } from 'react'
import { optimizeImage } from '@/lib/image'

interface ProductImageProps {
  src?: string | null
  alt: string
  category?: string
  className?: string
  /** Target render width in CSS pixels (used for Cloudinary downscale). */
  size?: number
}

const CATEGORY_STYLES: Record<string, { bg: string; emoji: string }> = {
  'business-card': { bg: 'from-blue-400 to-blue-600', emoji: '💳' },
  'flyer':         { bg: 'from-purple-400 to-purple-600', emoji: '📄' },
  'banner':        { bg: 'from-orange-400 to-orange-600', emoji: '🏗️' },
  'sticker':       { bg: 'from-green-400 to-green-600', emoji: '📎' },
  'book':          { bg: 'from-amber-400 to-amber-600', emoji: '📕' },
  'packaging':     { bg: 'from-pink-400 to-pink-600', emoji: '📦' },
  'signage':       { bg: 'from-teal-400 to-teal-600', emoji: '🪧' },
  'merchandise':   { bg: 'from-red-400 to-red-600', emoji: '🎁' },
  'poster':        { bg: 'from-indigo-400 to-indigo-600', emoji: '🖼️' },
  'brochure':      { bg: 'from-cyan-400 to-cyan-600', emoji: '📋' },
  'default':       { bg: 'from-gray-400 to-gray-600', emoji: '🖨️' },
}

export default function ProductImage({ src, alt, category, className = '', size = 400 }: ProductImageProps) {
  const [error, setError] = useState(false)
  const catKey = category?.toLowerCase().replace(/\s+/g, '-') || 'default'
  const style = CATEGORY_STYLES[catKey] || CATEGORY_STYLES.default

  const isPlaceholder = !src || src === '' || error

  if (isPlaceholder) {
    return (
      <div className={`bg-gradient-to-br ${style.bg} flex items-center justify-center ${className}`}>
        <div className="text-center text-white">
          <div className="text-4xl mb-1.5">{style.emoji}</div>
          <p className="text-[10px] opacity-75 font-medium px-2 truncate max-w-[120px]">{alt?.slice(0, 20)}</p>
        </div>
      </div>
    )
  }

  const optimized = optimizeImage(src, { w: size, h: size })
  return (
    <img
      src={optimized}
      srcSet={`${optimizeImage(src, { w: Math.round(size * 0.6), h: Math.round(size * 0.6) })} ${Math.round(size * 0.6)}w, ${optimized} ${size}w, ${optimizeImage(src, { w: size * 2, h: size * 2 })} ${size * 2}w`}
      sizes={`${size}px`}
      alt={alt}
      width={size} height={size}
      className={`object-cover ${className}`}
      onError={() => setError(true)}
      loading="lazy"
      decoding="async"
    />
  )
}
