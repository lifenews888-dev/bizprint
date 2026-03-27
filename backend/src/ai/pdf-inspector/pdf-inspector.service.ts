import { Injectable } from '@nestjs/common'
import pdf from 'pdf-parse'
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFNumber } from 'pdf-lib'

export interface PreflightIssue {
  type: string
  severity: 'error' | 'warning' | 'info'
  message: string
}

export interface PreflightResult {
  pages: number
  page_width_mm: number
  page_height_mm: number
  text_length: number
  info: any
  issues: PreflightIssue[]
  score: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  summary: string
  checks: {
    resolution: { status: string; detail: string }
    color_mode: { status: string; detail: string }
    bleed: { status: string; detail: string }
    fonts: { status: string; detail: string }
    page_size: { status: string; detail: string }
    transparency: { status: string; detail: string }
    image_count: { status: string; detail: string }
    bleed_box: { status: string; detail: string }
  }
  // Production gate fields
  production_ready: boolean
  blocking_issues: string[]
  estimated_dpi: number | null
  has_bleed_box: boolean
  color_spaces: string[]
  embedded_fonts: number
  total_fonts: number
}

const PT_TO_MM = 25.4 / 72  // 1 point = 0.3528 mm

@Injectable()
export class PdfInspectorService {

  async inspect(file: Buffer): Promise<PreflightResult> {
    const data = await pdf(file)
    const issues: PreflightIssue[] = []
    let score = 100

    // --- Load pdf-lib document for deep analysis ---
    let pdfDoc: PDFDocument | null = null
    try {
      pdfDoc = await PDFDocument.load(file, { ignoreEncryption: true })
    } catch {}

    // --- PAGE DIMENSIONS + BLEED BOX ---
    let page_width_mm = 0
    let page_height_mm = 0
    let pageSizeStatus = 'info'
    let pageSizeDetail = 'PDF metadata-аас хэмжээ авах боломжгүй'
    let has_bleed_box = false
    let bleedBoxStatus = 'warning'
    let bleedBoxDetail = 'BleedBox олдсонгүй — 3мм bleed гараар шалгана уу'
    let trimWidth = 0, trimHeight = 0
    let bleedWidth = 0, bleedHeight = 0

    if (pdfDoc && pdfDoc.getPageCount() > 0) {
      const firstPage = pdfDoc.getPage(0)
      const { width, height } = firstPage.getSize()
      page_width_mm = Math.round(width * PT_TO_MM)
      page_height_mm = Math.round(height * PT_TO_MM)
      pageSizeStatus = 'pass'
      pageSizeDetail = `${page_width_mm}×${page_height_mm} мм (${width.toFixed(0)}×${height.toFixed(0)} pt)`

      // Deep analysis: TrimBox + BleedBox
      try {
        const pageDict = firstPage.node
        const trimBox = pageDict.lookup(PDFName.of('TrimBox'))
        const bleedBox = pageDict.lookup(PDFName.of('BleedBox'))

        if (trimBox instanceof PDFArray) {
          const vals = trimBox.asArray().map(v => v instanceof PDFNumber ? v.asNumber() : 0)
          trimWidth = Math.round((vals[2] - vals[0]) * PT_TO_MM)
          trimHeight = Math.round((vals[3] - vals[1]) * PT_TO_MM)
        }

        if (bleedBox instanceof PDFArray) {
          const vals = bleedBox.asArray().map(v => v instanceof PDFNumber ? v.asNumber() : 0)
          bleedWidth = Math.round((vals[2] - vals[0]) * PT_TO_MM)
          bleedHeight = Math.round((vals[3] - vals[1]) * PT_TO_MM)
          has_bleed_box = true

          // Check if bleed is ≥3mm wider than trim on each side
          if (trimWidth > 0 && bleedWidth > trimWidth) {
            const bleedDiff = (bleedWidth - trimWidth) / 2
            if (bleedDiff >= 2.5) {
              bleedBoxStatus = 'pass'
              bleedBoxDetail = `BleedBox: ${bleedWidth}×${bleedHeight}мм, TrimBox: ${trimWidth}×${trimHeight}мм (bleed: ${bleedDiff.toFixed(1)}мм)`
            } else {
              bleedBoxStatus = 'warning'
              bleedBoxDetail = `Bleed ${bleedDiff.toFixed(1)}мм — 3мм шаардлагатай`
              issues.push({ type: 'BLEED_TOO_SMALL', severity: 'warning', message: `Bleed ${bleedDiff.toFixed(1)}мм. Хэвлэлд 3мм шаардлагатай` })
              score -= 10
            }
          } else {
            bleedBoxStatus = 'pass'
            bleedBoxDetail = `BleedBox: ${bleedWidth}×${bleedHeight}мм`
          }
        } else if (trimBox) {
          // TrimBox байгаа ч BleedBox байхгүй
          bleedBoxDetail = `TrimBox: ${trimWidth}×${trimHeight}мм, BleedBox байхгүй — 3мм bleed нэмсэн эсэхийг шалгана уу`
        }
      } catch {}
    }

    // --- CHECK 1: Pages ---
    if (data.numpages === 0) {
      issues.push({ type: 'NO_PAGES', severity: 'error', message: 'PDF хуудас байхгүй байна' })
      score -= 30
    }

    // --- CHECK 2: Resolution estimation (file size + page count + dimensions) ---
    let estimated_dpi: number | null = null
    let resolutionStatus = 'pass'
    let resolutionDetail = 'Файлын хэмжээ хэвлэлд тохиромжтой'

    if (page_width_mm > 0 && page_height_mm > 0 && data.numpages > 0) {
      // Estimate: if the PDF were a single raster image, what DPI would it be?
      const pageAreaInch2 = (page_width_mm / 25.4) * (page_height_mm / 25.4)
      const avgPageBytes = file.length / data.numpages
      // Rough estimate: CMYK = 4 bytes/pixel uncompressed, typical compression ~10:1
      const estimatedPixels = (avgPageBytes * 10) / 4
      const estimatedDpi = Math.round(Math.sqrt(estimatedPixels / pageAreaInch2))
      estimated_dpi = estimatedDpi

      if (estimatedDpi < 150) {
        issues.push({ type: 'LOW_DPI', severity: 'error', message: `Тооцоолсон нягтаршил ~${estimatedDpi} DPI. Хэвлэлд 300 DPI шаардлагатай` })
        score -= 25
        resolutionStatus = 'fail'
        resolutionDetail = `~${estimatedDpi} DPI (300 DPI шаардлагатай)`
      } else if (estimatedDpi < 250) {
        issues.push({ type: 'MEDIUM_DPI', severity: 'warning', message: `Тооцоолсон нягтаршил ~${estimatedDpi} DPI. 300 DPI санал болгоно` })
        score -= 10
        resolutionStatus = 'warning'
        resolutionDetail = `~${estimatedDpi} DPI (300 DPI санал болгоно)`
      } else {
        resolutionDetail = `~${estimatedDpi} DPI — хангалттай`
      }
    } else {
      // Fallback: file size heuristic
      const avgPageSize = file.length / (data.numpages || 1)
      if (avgPageSize < 50000) {
        issues.push({ type: 'LOW_RESOLUTION', severity: 'error', message: 'Зургийн чанар хэт бага байж болно (хуудас бүр < 50KB)' })
        score -= 25
        resolutionStatus = 'fail'
        resolutionDetail = 'Хуудас бүр < 50KB'
      } else if (avgPageSize < 200000) {
        issues.push({ type: 'MEDIUM_RESOLUTION', severity: 'warning', message: 'Зургийн чанар дунд зэрэг (хуудас бүр < 200KB)' })
        score -= 10
        resolutionStatus = 'warning'
        resolutionDetail = 'Хуудас бүр < 200KB'
      }
    }

    // --- CHECK 3: Color mode (deep scan) ---
    let colorStatus = 'pass'
    let colorDetail = 'Өнгөний мэдээлэл хэвийн'
    const color_spaces: string[] = []

    // Scan raw PDF bytes for color space markers
    const rawStr = file.toString('latin1')
    if (rawStr.includes('/DeviceCMYK') || rawStr.includes('/ICCBased')) {
      color_spaces.push('CMYK')
    }
    if (rawStr.includes('/DeviceRGB')) {
      color_spaces.push('RGB')
    }
    if (rawStr.includes('/DeviceGray')) {
      color_spaces.push('Grayscale')
    }
    if (rawStr.includes('/Separation')) {
      color_spaces.push('Spot')
    }

    if (color_spaces.includes('RGB') && !color_spaces.includes('CMYK')) {
      issues.push({ type: 'RGB_ONLY', severity: 'error', message: 'Зөвхөн RGB өнгө илэрсэн. Хэвлэлд CMYK шаардлагатай' })
      score -= 20
      colorStatus = 'fail'
      colorDetail = 'Зөвхөн RGB — CMYK болгох шаардлагатай'
    } else if (color_spaces.includes('RGB') && color_spaces.includes('CMYK')) {
      issues.push({ type: 'MIXED_COLOR', severity: 'warning', message: 'RGB + CMYK холимог. Бүх зургийг CMYK болгохыг зөвлөж байна' })
      score -= 10
      colorStatus = 'warning'
      colorDetail = `Холимог: ${color_spaces.join(', ')}`
    } else if (color_spaces.includes('CMYK')) {
      colorDetail = `CMYK илэрсэн${color_spaces.includes('Spot') ? ' + Spot color' : ''}`
    } else if (color_spaces.length === 0) {
      colorStatus = 'info'
      colorDetail = 'Өнгөний горим тодорхойлох боломжгүй'
    }

    // --- CHECK 4: Font embedding (deep scan) ---
    let fontStatus = 'pass'
    let fontDetail = 'Фонт хэвийн'
    let embedded_fonts = 0
    let total_fonts = 0

    // Count font references in raw PDF
    const fontMatches = rawStr.match(/\/Type\s*\/Font/g)
    total_fonts = fontMatches?.length || 0

    const embeddedMatches = rawStr.match(/\/FontFile[23]?\s/g)
    embedded_fonts = embeddedMatches?.length || 0

    if (total_fonts > 0 && embedded_fonts < total_fonts) {
      const unembedded = total_fonts - embedded_fonts
      if (embedded_fonts === 0) {
        issues.push({ type: 'NO_FONTS_EMBEDDED', severity: 'error', message: `${total_fonts} фонтоос нэг нь ч embed хийгдээгүй` })
        score -= 20
        fontStatus = 'fail'
        fontDetail = `0/${total_fonts} фонт embed хийгдсэн`
      } else {
        issues.push({ type: 'PARTIAL_FONTS', severity: 'warning', message: `${unembedded}/${total_fonts} фонт embed хийгдээгүй байж болно` })
        score -= 10
        fontStatus = 'warning'
        fontDetail = `${embedded_fonts}/${total_fonts} фонт embed хийгдсэн`
      }
    } else if (total_fonts > 0) {
      fontDetail = `${embedded_fonts}/${total_fonts} фонт embed хийгдсэн ✓`
    }

    // Replacement char check (additional)
    if (data.text.length > 0 && data.text.includes('\ufffd')) {
      if (fontStatus === 'pass') {
        issues.push({ type: 'FONT_ISSUE', severity: 'warning', message: 'Зарим тэмдэгт зөв уншигдахгүй' })
        score -= 5
        fontStatus = 'warning'
        fontDetail += ' (зарим тэмдэгт алдаатай)'
      }
    }

    // --- CHECK 5: Transparency ---
    let transparencyStatus = 'pass'
    let transparencyDetail = 'Хэвийн'

    const pdfVersion = data.info?.PDFFormatVersion
    const hasTransparency = rawStr.includes('/Group') && rawStr.includes('/Transparency')
    if (hasTransparency) {
      transparencyStatus = 'warning'
      transparencyDetail = 'Transparency илэрсэн — flatten хийхийг зөвлөж байна'
      issues.push({ type: 'TRANSPARENCY', severity: 'warning', message: 'Transparency илэрсэн. Хэвлэхээс өмнө flatten хийнэ үү' })
      score -= 5
    } else if (pdfVersion && parseFloat(pdfVersion) >= 1.4) {
      transparencyStatus = 'info'
      transparencyDetail = `PDF ${pdfVersion} — transparency дэмжих боломжтой`
    }

    // --- CHECK 6: Bleed (metadata fallback) ---
    let bleedStatus = 'warning'
    let bleedDetail = 'Bleed (3мм) байгаа эсэхийг гараар шалгана уу'
    if (has_bleed_box) {
      bleedStatus = bleedBoxStatus
      bleedDetail = bleedBoxDetail
    } else {
      issues.push({ type: 'BLEED_UNKNOWN', severity: 'info', message: 'BleedBox олдсонгүй. 3мм bleed гараар шалгана уу' })
    }

    // --- CHECK 7: Image count ---
    let imageStatus = 'pass'
    let imageDetail = ''
    const imageMatches = rawStr.match(/\/Subtype\s*\/Image/g)
    const imageCount = imageMatches?.length || 0
    imageDetail = `${imageCount} зураг илэрсэн`
    if (imageCount === 0 && data.text.length < 50) {
      imageStatus = 'warning'
      imageDetail = 'Зураг болон текст маш бага — файл хоосон байж болно'
      issues.push({ type: 'EMPTY_CONTENT', severity: 'warning', message: 'Файлд контент маш бага' })
      score -= 5
    }

    // --- Final score ---
    score = Math.max(0, Math.min(100, score))

    let risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
    if (score < 40) risk = 'CRITICAL'
    else if (score < 60) risk = 'HIGH'
    else if (score < 80) risk = 'MEDIUM'

    const errorCount = issues.filter(i => i.severity === 'error').length
    const warningCount = issues.filter(i => i.severity === 'warning').length
    const blocking_issues = issues.filter(i => i.severity === 'error').map(i => i.message)

    let summary = ''
    if (score >= 80) {
      summary = 'Хэвлэлд бэлэн. Жижиг анхааруулга байж болно.'
    } else if (score >= 60) {
      summary = `${warningCount} анхааруулга илэрсэн. Шалгаад засахыг зөвлөж байна.`
    } else {
      summary = `${errorCount} алдаа, ${warningCount} анхааруулга. Хэвлэхэд асуудал гарах магадлалтай.`
    }

    return {
      pages: data.numpages,
      page_width_mm,
      page_height_mm,
      text_length: data.text.length,
      info: data.info,
      issues,
      score,
      risk,
      summary,
      checks: {
        resolution: { status: resolutionStatus, detail: resolutionDetail },
        color_mode: { status: colorStatus, detail: colorDetail },
        bleed: { status: bleedStatus, detail: bleedDetail },
        fonts: { status: fontStatus, detail: fontDetail },
        page_size: { status: pageSizeStatus, detail: pageSizeDetail },
        transparency: { status: transparencyStatus, detail: transparencyDetail },
        image_count: { status: imageStatus, detail: imageDetail },
        bleed_box: { status: bleedBoxStatus, detail: bleedBoxDetail },
      },
      // Production gate
      production_ready: errorCount === 0 && score >= 60,
      blocking_issues,
      estimated_dpi,
      has_bleed_box,
      color_spaces,
      embedded_fonts,
      total_fonts,
    }
  }
}
