'use client'
import { useMemo } from 'react'
import { VChart } from '@visactor/react-vchart'
import type { ISpec } from '@visactor/vchart'
import { useChartTheme } from '@/lib/use-chart-theme'
import { SERIES_COLORS, fmtCurrency } from '@/lib/vchart-theme'
import { datumNumber, datumString } from './chart-utils'

interface DonutChartProps {
  data: { label: string; value: number; color?: string }[]
  height?: number
  currency?: boolean
  innerRadius?: number
  centerText?: string
  centerLabel?: string
}

export default function DonutChart({
  data,
  height = 200,
  currency = false,
  innerRadius = 0.65,
  centerText,
  centerLabel,
}: DonutChartProps) {
  const { tokens } = useChartTheme()

  const spec = useMemo<ISpec>(() => {
    const colors = data.map((d, i) => d.color || SERIES_COLORS[i % SERIES_COLORS.length])

    return {
      type: 'pie',
      data: [{ id: 'data', values: data }],
      valueField: 'value',
      categoryField: 'label',
      innerRadius,
      outerRadius: 0.9,
      pie: {
        style: {
          cornerRadius: 3,
          stroke: tokens.bg,
          lineWidth: 2,
        },
      },
      color: colors,
      legends: {
        visible: true,
        orient: 'right',
      },
      tooltip: {
        mark: {
          content: [
            {
              key: (datum: unknown) => datumString(datum, 'label'),
              value: (datum: unknown) => {
                const value = datumNumber(datum, 'value')
                return currency ? fmtCurrency(value) : String(value)
              },
            },
          ],
        },
      },
      background: 'transparent',
      padding: 0,
      animationAppear: { duration: 600 },
      ...(centerText ? {
        indicator: {
          visible: true,
          trigger: 'none',
          title: {
            style: { text: centerText, fontSize: 22, fontWeight: 800, fill: tokens.text },
          },
          ...(centerLabel ? {
            content: {
              style: { text: centerLabel, fontSize: 11, fill: tokens.text3 },
            },
          } : {}),
        },
      } : {}),
    }
  }, [data, currency, innerRadius, centerText, centerLabel, tokens])

  return (
    <VChart
      spec={spec}
      style={{ height, width: '100%' }}
    />
  )
}
