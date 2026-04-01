'use client'
import { useMemo } from 'react'
import { VChart } from '@visactor/react-vchart'
import { useChartTheme } from '@/lib/use-chart-theme'
import { SERIES_COLORS, fmtCurrency, fmtCompact } from '@/lib/vchart-theme'

interface MultiBarChartProps {
  data: Record<string, any>[]
  xField: string
  yFields: { field: string; name: string; color?: string }[]
  height?: number
  currency?: boolean
  stacked?: boolean
}

export default function MultiBarChart({
  data,
  xField,
  yFields,
  height = 240,
  currency = false,
  stacked = false,
}: MultiBarChartProps) {
  const { tokens } = useChartTheme()

  const spec = useMemo(() => {
    const flatData: any[] = []
    for (const row of data) {
      for (const yf of yFields) {
        flatData.push({
          [xField]: row[xField],
          value: row[yf.field] || 0,
          series: yf.name,
        })
      }
    }

    return {
      type: 'bar' as const,
      data: [{ id: 'data', values: flatData }],
      xField,
      yField: 'value',
      seriesField: 'series',
      stack: stacked,
      bar: {
        style: { cornerRadius: [3, 3, 0, 0] },
      },
      color: yFields.map((yf, i) => yf.color || SERIES_COLORS[i % SERIES_COLORS.length]),
      axes: [
        {
          orient: 'left' as any,
          label: {
            style: { fill: tokens.text3, fontSize: 10 },
            ...(currency ? { formatMethod: (v: any) => fmtCompact(Number(v)) } : {}),
          },
          grid: { style: { stroke: tokens.gridLine, lineDash: [3, 3] } },
          domainLine: { visible: false },
          tick: { visible: false },
        },
        {
          orient: 'bottom' as any,
          label: { style: { fill: tokens.text3, fontSize: 10 } },
          domainLine: { visible: false },
          tick: { visible: false },
        },
      ],
      legends: {
        visible: true,
        orient: 'top' as any,
        position: 'start' as any,
      },
      tooltip: {
        mark: {
          content: [
            {
              key: (datum: any) => datum?.series || '',
              value: (datum: any) => currency ? fmtCurrency(datum?.value || 0) : String(datum?.value || 0),
            },
          ],
        },
      },
      background: 'transparent',
      padding: { top: 8, bottom: 4, left: 4, right: 4 },
      animationAppear: { duration: 600 },
    }
  }, [data, xField, yFields, currency, stacked, tokens])

  return (
    <VChart
      spec={spec as any}
      style={{ height, width: '100%' }}
    />
  )
}
