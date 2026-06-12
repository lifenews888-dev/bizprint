'use client'
import { useMemo } from 'react'
import { VChart } from '@visactor/react-vchart'
import type { ISpec } from '@visactor/vchart'
import { useChartTheme } from '@/lib/use-chart-theme'
import { BRAND } from '@/lib/vchart-theme'

interface GaugeChartProps {
  value: number       // 0-100
  height?: number
  label?: string
  color?: string
  thresholds?: boolean
}

export default function GaugeChart({
  value,
  height = 160,
  label,
  color,
  thresholds = false,
}: GaugeChartProps) {
  const { tokens } = useChartTheme()

  const fillColor = thresholds
    ? value > 80 ? BRAND.danger : value > 60 ? BRAND.warning : BRAND.success
    : color || BRAND.primary

  const spec = useMemo<ISpec>(() => ({
    type: 'gauge',
    data: [{ id: 'data', values: [{ value }] }],
    valueField: 'value',
    startAngle: -225,
    endAngle: 45,
    outerRadius: 0.85,
    innerRadius: 0.7,
    gauge: {
      type: 'circularProgress',
      progress: {
        style: { fill: fillColor, cornerRadius: 10 },
      },
      track: {
        style: { fill: tokens.surface2, cornerRadius: 10 },
      },
    },
    pointer: { visible: false },
    indicator: {
      visible: true,
      trigger: 'none',
      title: {
        style: { text: `${Math.round(value)}%`, fontSize: 20, fontWeight: 800, fill: tokens.text },
      },
      ...(label ? {
        content: {
          style: { text: label, fontSize: 10, fill: tokens.text3 },
        },
      } : {}),
    },
    background: 'transparent',
    padding: 0,
    animationAppear: { duration: 600 },
  }), [value, fillColor, label, tokens])

  return (
    <VChart
      spec={spec}
      style={{ height, width: '100%' }}
    />
  )
}
