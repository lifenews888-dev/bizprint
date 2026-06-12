export type ChartDatum = Record<string, unknown>
export type ChartFieldValue = string | number

export const asChartDatum = (value: unknown): ChartDatum =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as ChartDatum : {}

export const stringValue = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

export const numberValue = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

export const datumString = (datum: unknown, key: string, fallback = ''): string =>
  stringValue(asChartDatum(datum)[key], fallback)

export const datumNumber = (datum: unknown, key: string, fallback = 0): number =>
  numberValue(asChartDatum(datum)[key], fallback)

export const chartFieldValue = (value: unknown): ChartFieldValue => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') return value
  return ''
}
