'use client'
import { useMemo } from 'react'
import { VChart } from '@visactor/react-vchart'
import { useChartTheme } from '@/lib/use-chart-theme'
import { SERIES_COLORS, fmtCurrency, fmtCompact } from '@/lib/vchart-theme'

interface BarChartProps {
  data: { label: string; value: number }[]
  height?: number
  color?: string
  currency?: boolean
  horizontal?: boolean
  gradient?: boolean
}

export default function BarChartBlock({
  data,
  height = 200,
  color = SERIES_COLORS[0],
  currency = false,
  horizontal = false,
  gradient = true,
}: BarChartProps) {
  const { tokens, isDark } = useChartTheme()

  const spec = useMemo(() => {
    const categoryField = 'label'
    const valueField = 'value'

    return {
      type: 'bar' as const,
      data: [{ id: 'data', values: data }],
      xField: horizontal ? valueField : categoryField,
      yField: horizontal ? categoryField : valueField,
      direction: horizontal ? ('horizontal' as const) : ('vertical' as const),
      bar: {
        style: {
          cornerRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
          fill: gradient ? {
            gradient: 'linear' as const,
            x0: 0, y0: 0, x1: 0, y1: 1,
            stops: [
              { offset: 0, color },
              { offset: 1, color: color + '66' },
            ],
          } : color,
        },
      },
      axes: [
        {
          orient: (horizontal ? 'bottom' : 'left') as any,
          visible: true,
          label: {
            style: { fill: tokens.text3, fontSize: 10 },
            ...(currency ? { formatMethod: (v: any) => fmtCompact(Number(v)) } : {}),
          },
          grid: { style: { stroke: tokens.gridLine, lineDash: [3, 3] } },
          domainLine: { visible: false },
          tick: { visible: false },
        },
        {
          orient: (horizontal ? 'left' : 'bottom') as any,
          visible: true,
          label: { style: { fill: tokens.text3, fontSize: 10 } },
          domainLine: { visible: false },
          tick: { visible: false },
        },
      ],
      tooltip: {
        mark: {
          content: [
            {
              key: (datum: any) => datum?.label || '',
              value: (datum: any) => currency ? fmtCurrency(datum?.value || 0) : String(datum?.value || 0),
            },
          ],
        },
        style: {
          panel: {
            backgroundColor: tokens.surface,
            border: { color: tokens.border, width: 1 },
            shadow: { blur: 12, color: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)' },
          },
        },
      },
      background: 'transparent',
      padding: { top: 12, bottom: 4, left: 4, right: 4 },
      animationAppear: { duration: 600 },
    }
  }, [data, color, currency, horizontal, gradient, tokens, isDark])

  return (
    <VChart
      spec={spec as any}
      style={{ height, width: '100%' }}
    />
  )
}
