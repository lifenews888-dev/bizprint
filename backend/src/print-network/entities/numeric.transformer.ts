import { ValueTransformer } from 'typeorm'

/** Postgres NUMERIC нь string буцаадаг — number болгоно. */
export const numeric: ValueTransformer = {
  to: (v?: number | null) => v,
  from: (v?: string | null) => (v === null || v === undefined ? null : Number(v)),
}
