'use client'
import { useMemo } from 'react'
import { VChart } from '@visactor/react-vchart'
import type { IOrientType, ISpec } from '@visactor/vchart'
import { useChartTheme } from '@/lib/use-chart-theme'
import { SERIES_COLORS, fmtCurrency, fmtCompact } from '@/lib/vchart-theme'
import { chartFieldValue, datumNumber, datumString, numberValue, type ChartFieldValue } from './chart-utils'

interface MultiBarChartProps {
  data: Record<string, unknown>[]
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

  const spec = useMemo<ISpec>(() => {
    const flatData: Record<string, ChartFieldValue>[] = []
    const valueAxisOrient: IOrientType = 'left'
    const categoryAxisOrient: IOrientType = 'bottom'
    for (const row of data) {
      for (const yf of yFields) {
        flatData.push({
          [xField]: chartFieldValue(row[xField]),
          value: numberValue(row[yf.field]),
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
          orient: valueAxisOrient,
          label: {
            style: { fill: tokens.text3, fontSize: 10 },
            ...(currency ? { formatMethod: (value: unknown) => fmtCompact(Number(value)) } : {}),
          },
          grid: { style: { stroke: tokens.gridLine, lineDash: [3, 3] } },
          domainLine: { visible: false },
          tick: { visible: false },
        },
        {
          orient: categoryAxisOrient,
          label: { style: { fill: tokens.text3, fontSize: 10 } },
          domainLine: { visible: false },
          tick: { visible: false },
        },
      ],
      legends: {
        visible: true,
        orient: 'top',
        position: 'start',
      },
      tooltip: {
        mark: {
          content: [
            {
              key: (datum: unknown) => datumString(datum, 'series'),
              value: (datum: unknown) => {
                const value = datumNumber(datum, 'value')
                return currency ? fmtCurrency(value) : String(value)
              },
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
      spec={spec}
      style={{ height, width: '100%' }}
    />
  )
}
