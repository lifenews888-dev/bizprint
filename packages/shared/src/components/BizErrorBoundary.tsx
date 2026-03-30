import { Component, type ReactNode } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, radius, spacing, fontSize, fontWeight, componentSize } from '../theme'

interface Props {
  children: ReactNode
  /** Custom fallback renderer */
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  error: Error | null
}

export class BizErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset)
      }

      return (
        <View style={s.container}>
          <View style={s.iconBox}>
            <Text style={s.icon}>⚠️</Text>
          </View>
          <Text style={s.title}>Алдаа гарлаа</Text>
          <Text style={s.message}>{this.state.error.message || 'Ямар нэгэн зүйл буруу боллоо'}</Text>
          <TouchableOpacity style={s.button} onPress={this.reset} activeOpacity={0.8}>
            <Text style={s.buttonText}>Дахин оролдох</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return this.props.children
  }
}

// ─── Inline Error Card (for non-boundary use) ──────

export function ErrorCard({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={s.errorCard}>
      <Text style={s.errorEmoji}>😔</Text>
      <Text style={s.errorText}>{message || 'Мэдээлэл ачааллахад алдаа гарлаа'}</Text>
      {onRetry && (
        <TouchableOpacity style={s.retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <Text style={s.retryText}>↻ Дахин оролдох</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ─── Empty State ────────────────────────────────────

export function EmptyState({ icon = '📭', title, description }: { icon?: string; title: string; description?: string }) {
  return (
    <View style={s.emptyContainer}>
      <Text style={s.emptyIcon}>{icon}</Text>
      <Text style={s.emptyTitle}>{title}</Text>
      {description && <Text style={s.emptyDesc}>{description}</Text>}
    </View>
  )
}

const s = StyleSheet.create({
  // Error boundary full-screen
  container: {
    flex: 1,
    backgroundColor: colors.bg2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  icon: { fontSize: 36 },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.text3,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    minHeight: componentSize.buttonMinHeight,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },

  // Error card (inline)
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    margin: spacing.md,
  },
  errorEmoji: { fontSize: 36, marginBottom: spacing.sm },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.text2,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.accentBg,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
  },
  retryText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    fontSize: fontSize.sm,
    color: colors.text2,
    textAlign: 'center',
  },
})
