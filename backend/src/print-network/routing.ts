/**
 * Захиалгын мөрийг аль принтер рүү илгээхийг шийднэ. DB-гүй цэвэр логик.
 *
 * Шүүлт (бүгд биелэх ёстой):
 *   1. Принтер идэвхтэй (active)
 *   2. Бүтээгдэхүүний төрлийг дэмждэг
 *   3. Материалыг дэмждэг (принтерийн media жагсаалт хоосон бол ямар ч)
 *   4. Өргөн багтана (богино тал нь max_width_mm-ээс хэтрэхгүй — эргүүлж болно)
 *   5. Захиалсан өнгө бүр калибровк хийгдсэн, ΔE00 ≤ tolerance
 *
 * Эрэмбэ: ачаалал (queue) бага → онлайн → өнгөний нарийвчлал өндөр.
 */

export interface RouteRequest {
  productType: string
  colorCodes: string[]
  widthMm?: number | null
  heightMm?: number | null
  media?: string | null
}

export interface ProfilePoint {
  media: string // '' = бүх материал
  deltaE: number
}

export interface DeviceState {
  id: string
  name: string
  technology: string
  status: string
  productTypes: string[]
  media: string[]
  maxWidthMm: number | null
  deltaETolerance: number
  online: boolean
  queueLength: number
  /** өнгөний код → хэмжилтүүд */
  profiles: Map<string, ProfilePoint[]>
}

export interface ColorFit {
  code: string
  deltaE: number
}

export interface RouteCandidate {
  deviceId: string
  name: string
  technology: string
  online: boolean
  queueLength: number
  maxDeltaE: number
  colors: ColorFit[]
  score: number
}

export interface RouteRejection {
  deviceId: string
  name: string
  reasons: string[]
}

export interface RouteResult {
  chosen: RouteCandidate | null
  candidates: RouteCandidate[]
  rejected: RouteRejection[]
}

/** Материалд тохирох хэмжилтийг олно: яг таарсан media > ерөнхий ('') */
export function profileFor(points: ProfilePoint[] | undefined, media?: string | null): ProfilePoint | null {
  if (!points?.length) return null
  if (media) {
    const exact = points.find((p) => p.media === media)
    if (exact) return exact
  }
  return points.find((p) => p.media === '') ?? null
}

export function evaluateDevice(d: DeviceState, req: RouteRequest): RouteCandidate | RouteRejection {
  const reasons: string[] = []

  if (d.status !== 'active') reasons.push(`Принтер ${d.status} төлөвт байна`)
  if (!d.productTypes.includes(req.productType)) reasons.push(`"${req.productType}" бүтээгдэхүүн хэвлэдэггүй`)
  if (req.media && d.media.length && !d.media.includes(req.media)) reasons.push(`"${req.media}" материал дэмжихгүй`)

  if (d.maxWidthMm && (req.widthMm || req.heightMm)) {
    const sides = [req.widthMm, req.heightMm].filter((v): v is number => !!v && v > 0)
    const shortSide = Math.min(...sides)
    if (shortSide > d.maxWidthMm) reasons.push(`Хэмжээ ${shortSide}мм > хэвлэх өргөн ${d.maxWidthMm}мм`)
  }

  const colors: ColorFit[] = []
  for (const code of req.colorCodes) {
    const p = profileFor(d.profiles.get(code), req.media)
    if (!p) {
      reasons.push(`${code}: калибровк хийгдээгүй`)
    } else if (p.deltaE > d.deltaETolerance) {
      reasons.push(`${code}: ΔE ${p.deltaE.toFixed(1)} > ${d.deltaETolerance}`)
    } else {
      colors.push({ code, deltaE: p.deltaE })
    }
  }

  if (reasons.length) return { deviceId: d.id, name: d.name, reasons }

  const maxDeltaE = colors.reduce((m, c) => Math.max(m, c.deltaE), 0)
  return {
    deviceId: d.id,
    name: d.name,
    technology: d.technology,
    online: d.online,
    queueLength: d.queueLength,
    maxDeltaE,
    colors,
    score: d.queueLength * 10 + (d.online ? 0 : 1000) + maxDeltaE,
  }
}

export function routeJob(devices: DeviceState[], req: RouteRequest): RouteResult {
  const candidates: RouteCandidate[] = []
  const rejected: RouteRejection[] = []
  for (const d of devices) {
    const r = evaluateDevice(d, req)
    if ('reasons' in r) rejected.push(r)
    else candidates.push(r)
  }
  candidates.sort((a, b) => a.score - b.score)
  return { chosen: candidates[0] ?? null, candidates, rejected }
}
