import { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet, type ViewStyle } from 'react-native'
import { colors, radius, spacing } from '../theme'

// ─── Skeleton Primitives ────────────────────────────

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export function Skeleton({ width = '100%', height = 16, borderRadius = radius.md, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [])

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: colors.surface2, opacity },
        style,
      ]}
    />
  )
}

// ─── Preset Skeletons ───────────────────────────────

/** Card skeleton — matches the 24px radius cards used across all apps */
export function CardSkeleton({ lines = 3, style }: { lines?: number; style?: ViewStyle }) {
  return (
    <View style={[s.card, style]}>
      {/* Header row */}
      <View style={s.row}>
        <Skeleton width={120} height={14} />
        <Skeleton width={80} height={24} borderRadius={radius.full} />
      </View>
      {/* Body lines */}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={12}
          style={{ marginTop: i === 0 ? 14 : 8 }}
        />
      ))}
    </View>
  )
}

/** Product grid skeleton — 2-column product cards */
export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={s.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={s.productCard}>
          <Skeleton height={140} borderRadius={radius.lg} />
          <Skeleton width="70%" height={13} style={{ marginTop: 10 }} />
          <Skeleton width="40%" height={15} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  )
}

/** Order list skeleton — vertical stack of order cards */
export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: spacing.md, padding: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  )
}

/** Dashboard stats skeleton — 2x2 stat grid */
export function StatsSkeleton() {
  return (
    <View style={s.statsGrid}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={s.statCard}>
          <Skeleton width={32} height={32} borderRadius={radius.sm} />
          <Skeleton width={60} height={20} style={{ marginTop: 10 }} />
          <Skeleton width={40} height={10} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  )
}

/** Full screen loading — centered spinner with skeleton cards */
export function ScreenSkeleton() {
  return (
    <View style={s.screen}>
      <Skeleton width="50%" height={20} style={{ marginBottom: spacing.lg }} />
      <StatsSkeleton />
      <View style={{ height: spacing.lg }} />
      <OrderListSkeleton count={2} />
    </View>
  )
}

// ─── Styles ─────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.md,
  },
  productCard: {
    width: '48%' as any,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statCard: {
    width: '47%' as any,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.bg2,
    paddingTop: spacing.lg,
  },
})
