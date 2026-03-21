import { Injectable } from '@nestjs/common'
import pdf from 'pdf-parse'
import { PDFDocument } from 'pdf-lib'

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
  }
}

const PT_TO_MM = 25.4 / 72  // 1 point = 0.3528 mm

@Injectable()
export class PdfInspectorService {

  async inspect(file: Buffer): Promise<PreflightResult> {
    const data = await pdf(file)
    const issues: PreflightIssue[] = []
    let score = 100

    // --- PAGE DIMENSIONS via pdf-lib ---
    let page_width_mm = 0
    let page_height_mm = 0
    let pageSizeStatus = 'info'
    let pageSizeDetail = 'PDF metadata-аас хэмжээ авах боломжгүй'

    try {
      const pdfDoc = await PDFDocument.load(file, { ignoreEncryption: true })
      if (pdfDoc.getPageCount() > 0) {
        const firstPage = pdfDoc.getPage(0)
        const { width, height } = firstPage.getSize()
        page_width_mm = Math.round(width * PT_TO_MM)
        page_height_mm = Math.round(height * PT_TO_MM)
        pageSizeStatus = 'pass'
        pageSizeDetail = `${page_width_mm}×${page_height_mm} мм (${width.toFixed(0)}×${height.toFixed(0)} pt)`
      }
    } catch {
      pageSizeDetail = 'Хуудасны хэмжээ уншиж чадсангүй'
    }

    // --- CHECK 1: Pages ---
    if (data.numpages === 0) {
      issues.push({ type: 'NO_PAGES', severity: 'error', message: 'PDF хуудас байхгүй байна' })
      score -= 30
    }

    // --- CHECK 2: File size (proxy for resolution) ---
    const avgPageSize = file.length / (data.numpages || 1)
    let resolutionStatus = 'pass'
    let resolutionDetail = 'Файлын хэмжээ хэвлэлд тохиромжтой'

    if (avgPageSize < 50000) {
      issues.push({
        type: 'LOW_RESOLUTION',
        severity: 'error',
        message: 'Зургийн чанар хэт бага байж болно (хуудас бүр < 50KB)'
      })
      score -= 25
      resolutionStatus = 'fail'
      resolutionDetail = 'Хуудас бүр < 50KB — зургийн чанар бага байж болно'
    } else if (avgPageSize < 200000) {
      issues.push({
        type: 'MEDIUM_RESOLUTION',
        severity: 'warning',
        message: 'Зургийн чанар дунд зэрэг (хуудас бүр < 200KB). 300 DPI шалгана уу'
      })
      score -= 10
      resolutionStatus = 'warning'
      resolutionDetail = 'Хуудас бүр < 200KB — 300 DPI шалгахыг зөвлөж байна'
    }

    // --- CHECK 3: Color mode ---
    let colorStatus = 'pass'
    let colorDetail = 'Өнгөний мэдээлэл хэвийн'
    const pdfText = JSON.stringify(data.info || {}).toLowerCase()

    if (pdfText.includes('rgb') && !pdfText.includes('cmyk')) {
      issues.push({
        type: 'RGB_COLOR',
        severity: 'warning',
        message: 'RGB өнгөний горим илэрсэн. Хэвлэлд CMYK шаардлагатай'
      })
      score -= 15
      colorStatus = 'warning'
      colorDetail = 'RGB илэрсэн — CMYK болгох шаардлагатай байж болно'
    }

    // --- CHECK 4: Font embedding ---
    let fontStatus = 'pass'
    let fontDetail = 'Фонт хэвийн'

    if (data.text.length > 0 && data.text.includes('\ufffd')) {
      issues.push({
        type: 'FONT_ISSUE',
        severity: 'warning',
        message: 'Зарим фонт embed хийгдээгүй байж болно'
      })
      score -= 10
      fontStatus = 'warning'
      fontDetail = 'Зарим тэмдэгт зөв уншигдахгүй — фонт embed шалгана уу'
    }

    // --- CHECK 5: Transparency ---
    let transparencyStatus = 'pass'
    let transparencyDetail = 'Хэвийн'

    const pdfVersion = data.info?.PDFFormatVersion
    if (pdfVersion && parseFloat(pdfVersion) >= 1.4) {
      transparencyStatus = 'info'
      transparencyDetail = `PDF ${pdfVersion} — transparency дэмжих боломжтой. Flatten хийсэн эсэхийг шалгана уу`
    }

    // --- CHECK 6: Bleed ---
    let bleedStatus = 'warning'
    let bleedDetail = 'Bleed байгаа эсэхийг PDF metadata-аас тодорхойлох боломжгүй. 3mm bleed нэмсэн эсэхийг шалгана уу'
    issues.push({
      type: 'BLEED_UNKNOWN',
      severity: 'info',
      message: 'Bleed (3мм) байгаа эсэхийг гараар шалгана уу'
    })

    // --- Final score ---
    score = Math.max(0, Math.min(100, score))

    let risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
    if (score < 40) risk = 'CRITICAL'
    else if (score < 60) risk = 'HIGH'
    else if (score < 80) risk = 'MEDIUM'

    const errorCount = issues.filter(i => i.severity === 'error').length
    const warningCount = issues.filter(i => i.severity === 'warning').length

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
      },
    }
  }
}
