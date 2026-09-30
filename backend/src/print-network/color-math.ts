/**
 * Өнгөний тооцоолол — Lab (D50, ICC хэвлэлийн стандарт) ба CIEDE2000.
 *
 * Хэвлэлийн өнгийг RGB/HEX-ээр биш Lab утгаар хадгална. HEX нь зөвхөн
 * дэлгэцэнд харуулах ойролцоо утга. Жинхэнэ Lab-ийг спектрофотометрээр
 * хэвлэсэн дээжнээс хэмжинэ.
 */

export interface Lab {
  l: number
  a: number
  b: number
}

// D50 white point (ICC PCS)
const WX = 0.96422
const WY = 1.0
const WZ = 0.82521

const EPS = 216 / 24389
const KAPPA = 24389 / 27

/** CIEDE2000 өнгөний зөрүү (ΔE00). */
export function deltaE2000(x: Lab, y: Lab): number {
  const rad = Math.PI / 180
  const deg = 180 / Math.PI

  const c1 = Math.hypot(x.a, x.b)
  const c2 = Math.hypot(y.a, y.b)
  const cBar7 = Math.pow((c1 + c2) / 2, 7)
  const g = 0.5 * (1 - Math.sqrt(cBar7 / (cBar7 + Math.pow(25, 7))))

  const a1p = (1 + g) * x.a
  const a2p = (1 + g) * y.a
  const c1p = Math.hypot(a1p, x.b)
  const c2p = Math.hypot(a2p, y.b)

  const hue = (b: number, ap: number) => {
    if (b === 0 && ap === 0) return 0
    const h = Math.atan2(b, ap) * deg
    return h >= 0 ? h : h + 360
  }
  const h1p = hue(x.b, a1p)
  const h2p = hue(y.b, a2p)

  const dLp = y.l - x.l
  const dCp = c2p - c1p

  let dhp = 0
  if (c1p * c2p !== 0) {
    dhp = h2p - h1p
    if (dhp > 180) dhp -= 360
    else if (dhp < -180) dhp += 360
  }
  const dHp = 2 * Math.sqrt(c1p * c2p) * Math.sin((dhp / 2) * rad)

  const lBarP = (x.l + y.l) / 2
  const cBarP = (c1p + c2p) / 2

  let hBarP = h1p + h2p
  if (c1p * c2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) hBarP = (h1p + h2p) / 2
    else if (h1p + h2p < 360) hBarP = (h1p + h2p + 360) / 2
    else hBarP = (h1p + h2p - 360) / 2
  }

  const t =
    1 -
    0.17 * Math.cos((hBarP - 30) * rad) +
    0.24 * Math.cos(2 * hBarP * rad) +
    0.32 * Math.cos((3 * hBarP + 6) * rad) -
    0.2 * Math.cos((4 * hBarP - 63) * rad)

  const dTheta = 30 * Math.exp(-Math.pow((hBarP - 275) / 25, 2))
  const cBarP7 = Math.pow(cBarP, 7)
  const rc = 2 * Math.sqrt(cBarP7 / (cBarP7 + Math.pow(25, 7)))
  const lBarP50 = Math.pow(lBarP - 50, 2)
  const sl = 1 + (0.015 * lBarP50) / Math.sqrt(20 + lBarP50)
  const sc = 1 + 0.045 * cBarP
  const sh = 1 + 0.015 * cBarP * t
  const rt = -Math.sin(2 * dTheta * rad) * rc

  return Math.sqrt(
    Math.pow(dLp / sl, 2) +
      Math.pow(dCp / sc, 2) +
      Math.pow(dHp / sh, 2) +
      rt * (dCp / sc) * (dHp / sh),
  )
}

/** "#RRGGBB" → Lab (D50). Каталогийн анхны ойролцоо утга гаргахад л ашиглана. */
export function hexToLab(hex: string): Lab {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) throw new Error(`Invalid hex color: ${hex}`)
  const n = parseInt(m[1], 16)
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  const r = lin((n >> 16) & 255)
  const g = lin((n >> 8) & 255)
  const b = lin(n & 255)

  // sRGB → XYZ (D50, Bradford-adapted)
  const X = 0.4360747 * r + 0.3850649 * g + 0.1430804 * b
  const Y = 0.2225045 * r + 0.7168786 * g + 0.0606169 * b
  const Z = 0.0139322 * r + 0.0971045 * g + 0.7141733 * b

  const f = (t: number) => (t > EPS ? Math.cbrt(t) : (KAPPA * t + 16) / 116)
  const fx = f(X / WX)
  const fy = f(Y / WY)
  const fz = f(Z / WZ)
  return round({ l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) })
}

/** Lab (D50) → "#RRGGBB" (дэлгэцийн gamut-аас гарвал clip хийнэ). */
export function labToHex(lab: Lab): string {
  const fy = (lab.l + 16) / 116
  const fx = fy + lab.a / 500
  const fz = fy - lab.b / 200
  const inv = (t: number) => (t * t * t > EPS ? t * t * t : (116 * t - 16) / KAPPA)
  const X = inv(fx) * WX
  const Y = (lab.l > KAPPA * EPS ? Math.pow(fy, 3) : lab.l / KAPPA) * WY
  const Z = inv(fz) * WZ

  const r = 3.1338561 * X - 1.6168667 * Y - 0.4906146 * Z
  const g = -0.9787684 * X + 1.9161415 * Y + 0.033454 * Z
  const b = 0.0719453 * X - 0.2289914 * Y + 1.4052427 * Z

  const enc = (c: number) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
    return Math.round(Math.min(1, Math.max(0, v)) * 255)
  }
  return '#' + [r, g, b].map((c) => enc(c).toString(16).padStart(2, '0')).join('').toUpperCase()
}

function round(lab: Lab): Lab {
  const r = (v: number) => Math.round(v * 100) / 100
  return { l: r(lab.l), a: r(lab.a), b: r(lab.b) }
}
