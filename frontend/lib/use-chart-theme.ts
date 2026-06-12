'use client'
import { useState, useEffect } from 'react'
import { buildVChartTheme, isDarkTheme, type ChartThemeTokens, getTokens } from './vchart-theme'

/**
 * useChartTheme — observes `data-theme` attribute on <html>
 * and returns a reactive VisActor theme + color tokens.
 *
 * Uses MutationObserver for real-time theme switching.
 */
export function useChartTheme() {
  const [dark, setDark] = useState(() => (typeof window === 'undefined' ? true : isDarkTheme()))

  useEffect(() => {
    // Watch for data-theme changes
    const observer = new MutationObserver(() => {
      setDark(isDarkTheme())
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  const theme = buildVChartTheme(dark)
  const tokens = getTokens(dark)

  return { isDark: dark, theme, tokens }
}
