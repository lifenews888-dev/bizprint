'use client'
import { useMemo } from 'react'
import { VChart } from '@visactor/react-vchart'
import { useChartTheme } from '@/lib/use-chart-theme'
import { SERIES_COLORS, fmtCurrency } from '@/lib/vchart-theme'

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

  const spec = useMemo(() => {
    const colors = data.map((d, i) => d.color || SERIES_COLORS[i % SERIES_COLORS.length])

    const result: any = {
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
              key: (datum: any) => datum?.label || '',
              value: (datum: any) => currency ? fmtCurrency(datum?.value || 0) : String(datum?.value || 0),
            },
          ],
        },
      },
      background: 'transparent',
      padding: 0,
      animationAppear: { duration: 600 },
    }

    if (centerText) {
      result.indicator = {
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
      }
    }

    return result
  }, [data, currency, innerRadius, centerText, centerLabel, tokens])

  return (
    <VChart
      spec={spec}
      style={{ height, width: '100%' }}
    />
  )
}
