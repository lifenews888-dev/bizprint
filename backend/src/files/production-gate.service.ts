import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { File, FileStatus, FileType } from './file.entity'
import { FilesService } from './files.service'
import { PdfInspectorService, PreflightResult, PreflightIssue } from '../ai/pdf-inspector/pdf-inspector.service'
import * as fs from 'fs'
import * as path from 'path'

/* ═══════════════════════════════════════
 *  Production Gate Service
 *  Validates ANY file before it goes to production.
 *  Called from: order upload, design approval, set-final,
 *  manual re-check, status→in_production trigger.
 * ═══════════════════════════════════════ */

export interface GateResult {
  file_id: string
  filename: string
  passed: boolean
  score: number
  risk: string
  production_ready: boolean
  blocking_issues: string[]
  warnings: string[]
  checks: Record<string, { status: string; detail: string }>
  analysis: PreflightResult | null
  checked_at: string
}

@Injectable()
export class ProductionGateService {
  private readonly logger = new Logger(ProductionGateService.name)

  constructor(
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
    private readonly filesService: FilesService,
    private readonly pdfInspector: PdfInspectorService,
  ) {}

  /* ═══════════════════════════════════════
   *  GATE CHECK — single file
   *  Reads file from disk, runs full preflight
   * ═══════════════════════════════════════ */

  async checkFile(fileId: string): Promise<GateResult> {
    const file = await this.filesService.findOne(fileId)
    const isPdf = file.mime_type === 'application/pdf' ||
      file.filename.toLowerCase().endsWith('.pdf')

    let analysis: PreflightResult | null = null

    if (isPdf) {
      // Read file buffer from disk
      const filePath = path.resolve(process.cwd(), file.path)
      if (!fs.existsSync(filePath)) {
        return this.buildResult(file, null, false, ['Файл олдсонгүй: ' + file.path])
      }

      const buffer = fs.readFileSync(filePath)
      analysis = await this.pdfInspector.inspect(buffer)

      // Save analysis to DB
      await this.filesService.updateAnalysis(fileId, analysis)
    } else {
      // Non-PDF: basic checks
      analysis = this.checkNonPdf(file)
    }

    const blocking = analysis?.blocking_issues || []
    const warnings = analysis?.issues
      ?.filter(i => i.severity === 'warning')
      .map(i => i.message) || []

    const passed = blocking.length === 0 && (analysis?.score ?? 0) >= 60
    const ready = analysis?.production_ready ?? passed

    // Update file status based on gate result
    if (passed) {
      if (file.status !== FileStatus.APPROVED) {
        file.status = FileStatus.CHECKING
        await this.fileRepo.save(file)
      }
    } else if (blocking.length > 0) {
      file.status = FileStatus.NEEDS_FIX
      await this.fileRepo.save(file)
    }

    this.logger.log(`Gate check: ${file.filename} → ${passed ? 'PASSED' : 'FAILED'} (score: ${analysis?.score ?? 'N/A'})`)

    return this.buildResult(file, analysis, ready, blocking, warnings)
  }

  /* ═══════════════════════════════════════
   *  GATE CHECK — order (check ALL files)
   * ═══════════════════════════════════════ */

  async checkOrder(orderId: string): Promise<{
    order_id: string
    total_files: number
    checked: number
    all_passed: boolean
    production_ready: boolean
    results: GateResult[]
    summary: string
  }> {
    const files = await this.filesService.findByOrder(orderId)
    if (files.length === 0) {
      return {
        order_id: orderId,
        total_files: 0,
        checked: 0,
        all_passed: false,
        production_ready: false,
        results: [],
        summary: 'Файл байхгүй — үйлдвэрт илгээх боломжгүй',
      }
    }

    // Check final file first, fallback to latest
    const finalFile = files.find(f => f.is_final) || files[0]
    const results: GateResult[] = []

    // Check the production file
    const result = await this.checkFile(finalFile.id)
    results.push(result)

    // If there are other unchecked files, check them too
    for (const f of files) {
      if (f.id !== finalFile.id && !f.analysis) {
        try {
          const r = await this.checkFile(f.id)
          results.push(r)
        } catch {}
      }
    }

    const mainResult = results[0]
    const allPassed = results.every(r => r.passed)
    const productionReady = mainResult.production_ready

    let summary = ''
    if (productionReady) {
      summary = `Үйлдвэрт бэлэн (${mainResult.filename}, оноо: ${mainResult.score})`
    } else if (mainResult.blocking_issues.length > 0) {
      summary = `${mainResult.blocking_issues.length} алдаа засах шаардлагатай: ${mainResult.blocking_issues[0]}`
    } else {
      summary = `Файл шалгалт дутуу (оноо: ${mainResult.score})`
    }

    return {
      order_id: orderId,
      total_files: files.length,
      checked: results.length,
      all_passed: allPassed,
      production_ready: productionReady,
      results,
      summary,
    }
  }

  /* ═══════════════════════════════════════
   *  RE-CHECK — force re-analysis of a file
   * ═══════════════════════════════════════ */

  async recheck(fileId: string): Promise<GateResult> {
    // Clear existing analysis, re-run
    const file = await this.filesService.findOne(fileId)
    file.analysis = null as any
    file.status = FileStatus.CHECKING
    await this.fileRepo.save(file)
    return this.checkFile(fileId)
  }

  /* ═══════════════════════════════════════
   *  SET FINAL + VALIDATE
   *  When a file is marked final, run gate check
   * ═══════════════════════════════════════ */

  async setFinalAndValidate(fileId: string): Promise<{
    file: File
    gate: GateResult
  }> {
    const file = await this.filesService.setFinal(fileId)
    const gate = await this.checkFile(fileId)
    return { file, gate }
  }

  /* ═══════════════════════════════════════
   *  PRODUCTION READINESS (before status→in_production)
   * ═══════════════════════════════════════ */

  async isProductionReady(orderId: string): Promise<{
    ready: boolean
    reason: string
    gate?: GateResult
  }> {
    const files = await this.filesService.findByOrder(orderId)
    if (files.length === 0) {
      return { ready: false, reason: 'Файл байхгүй' }
    }

    const finalFile = files.find(f => f.is_final)
    if (!finalFile) {
      return { ready: false, reason: 'Final файл тэмдэглэгдээгүй' }
    }

    const gate = await this.checkFile(finalFile.id)
    if (!gate.production_ready) {
      return {
        ready: false,
        reason: gate.blocking_issues.length > 0
          ? `Алдаа: ${gate.blocking_issues[0]}`
          : `Оноо хангалтгүй: ${gate.score}/100`,
        gate,
      }
    }

    return { ready: true, reason: 'Бүх шалгалт давсан', gate }
  }

  /* ═══════════════════════════════════════
   *  HELPERS
   * ═══════════════════════════════════════ */

  private checkNonPdf(file: File): PreflightResult {
    const issues: PreflightIssue[] = []
    let score = 80

    // Image files
    const ext = file.filename.toLowerCase().split('.').pop() || ''
    const imageExts = ['jpg', 'jpeg', 'png', 'tiff', 'tif']
    const vectorExts = ['ai', 'eps', 'svg']

    if (imageExts.includes(ext)) {
      // Check file size for quality estimation
      if (file.size < 100000) {
        issues.push({ type: 'LOW_QUALITY_IMAGE', severity: 'warning', message: 'Зургийн хэмжээ бага (<100KB). Чанарыг шалгана уу' })
        score -= 15
      }
      if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
        issues.push({ type: 'RASTER_FORMAT', severity: 'info', message: `${ext.toUpperCase()} формат. Хэвлэлд 300 DPI, CMYK шаардлагатай` })
      }
    } else if (vectorExts.includes(ext)) {
      // Vector files are generally good
      score = 90
      issues.push({ type: 'VECTOR_FORMAT', severity: 'info', message: `${ext.toUpperCase()} вектор файл. Фонт outline болгосон эсэхийг шалгана уу` })
    } else {
      issues.push({ type: 'UNKNOWN_FORMAT', severity: 'warning', message: `${ext} формат. PDF хөрвүүлэхийг зөвлөж байна` })
      score -= 10
    }

    const blocking = issues.filter(i => i.severity === 'error').map(i => i.message)

    return {
      pages: 1,
      page_width_mm: 0,
      page_height_mm: 0,
      text_length: 0,
      info: { format: ext },
      issues,
      score,
      risk: score >= 80 ? 'LOW' : score >= 60 ? 'MEDIUM' : 'HIGH',
      summary: score >= 80 ? 'Файл хэвийн' : 'Зарим шалгалт дутуу',
      checks: {
        resolution: { status: file.size > 500000 ? 'pass' : 'warning', detail: `${(file.size / 1024).toFixed(0)}KB` },
        color_mode: { status: 'info', detail: 'PDF биш — шалгах боломжгүй' },
        bleed: { status: 'info', detail: 'PDF биш — шалгах боломжгүй' },
        fonts: { status: 'info', detail: 'PDF биш — шалгах боломжгүй' },
        page_size: { status: 'info', detail: 'PDF биш' },
        transparency: { status: 'pass', detail: 'OK' },
        image_count: { status: 'pass', detail: '—' },
        bleed_box: { status: 'info', detail: 'PDF биш' },
      },
      production_ready: blocking.length === 0 && score >= 60,
      blocking_issues: blocking,
      estimated_dpi: null,
      has_bleed_box: false,
      color_spaces: [],
      embedded_fonts: 0,
      total_fonts: 0,
    }
  }

  private buildResult(
    file: File,
    analysis: PreflightResult | null,
    ready: boolean,
    blocking: string[],
    warnings: string[] = [],
  ): GateResult {
    return {
      file_id: file.id,
      filename: file.filename,
      passed: blocking.length === 0 && (analysis?.score ?? 0) >= 60,
      score: analysis?.score ?? 0,
      risk: analysis?.risk ?? 'HIGH',
      production_ready: ready,
      blocking_issues: blocking,
      warnings,
      checks: analysis?.checks ?? {} as any,
      analysis,
      checked_at: new Date().toISOString(),
    }
  }
}
