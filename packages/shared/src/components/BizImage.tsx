import { type ComponentProps } from 'react'
import { Image } from 'expo-image'
import { colors, radius } from '../theme'

type ImageProps = ComponentProps<typeof Image>

interface BizImageProps extends Omit<ImageProps, 'placeholder' | 'transition' | 'cachePolicy'> {
  /** Blur hash or thumb URL for placeholder */
  blurhash?: string
}

/**
 * BizImage — wraps expo-image with consistent defaults:
 * - Memory + disk caching
 * - Smooth 200ms crossfade transition
 * - Dark placeholder background
 * - Content-fit: cover
 */
export function BizImage({ blurhash, style, ...props }: BizImageProps) {
  return (
    <Image
      {...props}
      style={[{ backgroundColor: colors.surface2 }, style]}
      placeholder={blurhash ? { blurhash } : undefined}
      transition={200}
      cachePolicy="memory-disk"
      contentFit={props.contentFit || 'cover'}
    />
  )
}

/**
 * Avatar — circular image with fallback bg
 */
export function BizAvatar({ size = 44, style, ...props }: BizImageProps & { size?: number }) {
  return (
    <BizImage
      {...props}
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surface3 }, style]}
      contentFit="cover"
    />
  )
}
