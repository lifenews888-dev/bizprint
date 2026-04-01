'use client'
import { useMemo } from 'react'
import { VChart } from '@visactor/react-vchart'
import { useChartTheme } from '@/lib/use-chart-theme'
import { SERIES_COLORS, fmtCompact } from '@/lib/vchart-theme'

interface FunnelChartProps {
  data: { label: string; value: number; color?: string }[]
  height?: number
}

export default function FunnelChart({ data, height = 260 }: FunnelChartProps) {
  const { tokens } = useChartTheme()

  const spec = useMemo((): any => {
    const colors = data.map((d, i) => d.color || SERIES_COLORS[i % SERIES_COLORS.length])

    return {
      type: 'funnel',
      data: [{ id: 'data', values: data }],
      categoryField: 'label',
      valueField: 'value',
      shape: 'rect',
      funnel: {
        style: {
          cornerRadius: 4,
          stroke: tokens.surface,
          lineWidth: 2,
        },
      },
      color: colors,
      label: {
        visible: true,
        style: { fill: '#fff', fontSize: 11, fontWeight: 600 },
      },
      outerLabel: {
        visible: true,
        position: 'right',
        style: { fill: tokens.text2, fontSize: 11 },
        line: { style: { stroke: tokens.border } },
      },
      transform: {
        visible: true,
        style: { fill: tokens.surface2 },
        label: {
          visible: true,
          style: { fill: tokens.text3, fontSize: 9 },
          formatMethod: (v: any) => v != null ? `${Math.round(Number(v) * 100)}%` : '',
        },
      },
      legends: { visible: false },
      tooltip: {
        mark: {
          content: [
            {
              key: (datum: any) => datum?.label || '',
              value: (datum: any) => fmtCompact(datum?.value || 0),
            },
          ],
        },
      },
      background: 'transparent',
      padding: { left: 12, right: 80, top: 4, bottom: 4 },
      animationAppear: { duration: 800 },
    }
  }, [data, tokens])

  return (
    <VChart
      spec={spec}
      style={{ height, width: '100%' }}
    />
  )
}
