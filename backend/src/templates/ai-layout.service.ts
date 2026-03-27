import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Template } from './template.entity'

/* ═══════════════════════════════════════
 *  AI Layout Engine
 *  Input: logo URL + text fields + product category
 *  Output: design JSON (Fabric.js compatible)
 *
 *  1. Pick best template for category
 *  2. Place user content into template zones
 *  3. Auto-resize text to fit zones
 *  4. Return canvas JSON ready for Fabric.js
 * ═══════════════════════════════════════ */

export interface LayoutInput {
  category: string        // business_card, flyer, poster, etc.
  logo_url?: string
  title?: string
  subtitle?: string
  phone?: string
  email?: string
  address?: string
  website?: string
  cta?: string
  brand_color?: string
  template_id?: string    // optional: force specific template
}

export interface LayoutResult {
  template_id: string
  template_title: string
  canvas_width: number
  canvas_height: number
  objects: FabricObject[]
  warnings: string[]
}

interface FabricObject {
  type: string
  left: number
  top: number
  width?: number
  height?: number
  text?: string
  src?: string
  fill?: string
  fontSize?: number
  fontWeight?: string
  fontFamily?: string
  textAlign?: string
  scaleX?: number
  scaleY?: number
  selectable?: boolean
  [key: string]: any
}

// Default zone definitions when template has no zones
const DEFAULT_ZONES: Record<string, Template['zones']> = {
  business_card: [
    { key: 'logo', type: 'image', x: 40, y: 30, w: 120, h: 120 },
    { key: 'title', type: 'text', x: 200, y: 40, w: 380, h: 50, fontSize: 28, fontWeight: 'bold', fill: '#111' },
    { key: 'subtitle', type: 'text', x: 200, y: 95, w: 380, h: 30, fontSize: 14, fill: '#666' },
    { key: 'phone', type: 'text', x: 200, y: 145, w: 380, h: 25, fontSize: 13, fill: '#444' },
    { key: 'email', type: 'text', x: 200, y: 175, w: 380, h: 25, fontSize: 13, fill: '#444' },
    { key: 'address', type: 'text', x: 200, y: 205, w: 380, h: 25, fontSize: 11, fill: '#888' },
  ],
  flyer: [
    { key: 'title', type: 'text', x: 60, y: 80, w: 670, h: 80, fontSize: 42, fontWeight: 'bold', fill: '#111', align: 'center' },
    { key: 'subtitle', type: 'text', x: 60, y: 180, w: 670, h: 40, fontSize: 18, fill: '#555', align: 'center' },
    { key: 'logo', type: 'image', x: 300, y: 300, w: 200, h: 200 },
    { key: 'cta', type: 'text', x: 180, y: 560, w: 430, h: 50, fontSize: 24, fontWeight: 'bold', fill: '#FF6B00', align: 'center' },
    { key: 'phone', type: 'text', x: 200, y: 640, w: 390, h: 30, fontSize: 16, fill: '#333', align: 'center' },
  ],
  poster: [
    { key: 'title', type: 'text', x: 80, y: 120, w: 960, h: 100, fontSize: 56, fontWeight: 'bold', fill: '#111', align: 'center' },
    { key: 'subtitle', type: 'text', x: 80, y: 250, w: 960, h: 50, fontSize: 22, fill: '#555', align: 'center' },
    { key: 'logo', type: 'image', x: 420, y: 400, w: 280, h: 280 },
    { key: 'cta', type: 'text', x: 200, y: 750, w: 720, h: 60, fontSize: 28, fontWeight: 'bold', fill: '#FF6B00', align: 'center' },
    { key: 'phone', type: 'text', x: 300, y: 850, w: 520, h: 40, fontSize: 18, fill: '#333', align: 'center' },
  ],
}

const CANVAS_SIZES: Record<string, { w: number; h: number }> = {
  business_card: { w: 640, h: 360 },
  flyer: { w: 794, h: 1123 },
  poster: { w: 1123, h: 1587 },
  banner: { w: 1200, h: 628 },
  sticker: { w: 500, h: 500 },
  brochure: { w: 794, h: 1123 },
  menu: { w: 794, h: 1123 },
  invitation: { w: 500, h: 700 },
}

@Injectable()
export class AiLayoutService {
  private readonly logger = new Logger(AiLayoutService.name)

  constructor(
    @InjectRepository(Template) private templateRepo: Repository<Template>,
  ) {}

  /* ═══════════════════════════════════════
   *  GENERATE LAYOUT
   * ═══════════════════════════════════════ */

  async generate(input: LayoutInput): Promise<LayoutResult> {
    const warnings: string[] = []

    // 1. Pick template
    let template: Template | null = null
    if (input.template_id) {
      template = await this.templateRepo.findOneBy({ id: input.template_id })
    }
    if (!template) {
      template = await this.templateRepo.findOne({
        where: { category: input.category, status: 'approved', is_active: true },
        order: { use_count: 'DESC' },
      })
    }

    // 2. Get zones (template zones > default zones)
    const zones = template?.zones?.length
      ? template.zones
      : DEFAULT_ZONES[input.category] || DEFAULT_ZONES.business_card

    const size = CANVAS_SIZES[input.category] || { w: 800, h: 600 }
    const canvasW = template?.width_mm ? Math.round(template.width_mm * 3.78) : size.w
    const canvasH = template?.height_mm ? Math.round(template.height_mm * 3.78) : size.h

    // 3. Build Fabric.js objects
    const objects: FabricObject[] = []
    const brandColor = input.brand_color || '#FF6B00'

    // Background (if template has one)
    if (template?.background_url) {
      objects.push({
        type: 'image',
        src: template.background_url,
        left: 0, top: 0,
        width: canvasW, height: canvasH,
        scaleX: 1, scaleY: 1,
        selectable: false,
      })
    } else {
      // Default white background with brand accent
      objects.push({
        type: 'rect',
        left: 0, top: 0, width: canvasW, height: canvasH,
        fill: '#FFFFFF', selectable: false,
      })
      // Accent bar
      objects.push({
        type: 'rect',
        left: 0, top: 0, width: canvasW, height: 8,
        fill: brandColor, selectable: false,
      })
    }

    // 4. Place user content into zones
    const userContent: Record<string, string | undefined> = {
      logo: input.logo_url,
      title: input.title,
      subtitle: input.subtitle,
      phone: input.phone ? `📞 ${input.phone}` : undefined,
      email: input.email ? `✉ ${input.email}` : undefined,
      address: input.address ? `📍 ${input.address}` : undefined,
      website: input.website,
      cta: input.cta || 'Одоо захиалаарай!',
    }

    for (const zone of zones) {
      const content = userContent[zone.key]
      if (!content) continue

      if (zone.type === 'image' && content) {
        // Logo placement
        objects.push({
          type: 'image',
          src: content,
          left: zone.x,
          top: zone.y,
          // Scale to fit zone while maintaining aspect ratio
          scaleX: 1,
          scaleY: 1,
          // Fabric.js will auto-size from src, we set origin constraints
          originX: 'left',
          originY: 'top',
          // Custom data for frontend to constrain
          customData: { zoneW: zone.w, zoneH: zone.h, zoneKey: zone.key },
        })
      } else if (zone.type === 'text') {
        // Auto-fit text
        let finalFontSize = zone.fontSize || 16
        const textLen = content.length

        // Simple auto-sizing: reduce font if text is long for zone width
        if (textLen > 0) {
          const charsPerLine = Math.floor(zone.w / (finalFontSize * 0.6))
          if (textLen > charsPerLine * 2) {
            finalFontSize = Math.max(10, Math.round(finalFontSize * 0.75))
          }
        }

        objects.push({
          type: 'i-text',
          text: content,
          left: zone.x,
          top: zone.y,
          width: zone.w,
          fontSize: finalFontSize,
          fontWeight: zone.fontWeight || 'normal',
          fontFamily: 'Helvetica',
          fill: zone.key === 'cta' ? brandColor : (zone.fill || '#333333'),
          textAlign: zone.align || 'left',
          selectable: true,
        })
      }
    }

    // 5. Validation warnings
    if (!input.logo_url) warnings.push('Лого оруулаагүй — загварт лого нэмэхийг зөвлөж байна')
    if (!input.title) warnings.push('Гарчиг оруулаагүй')
    if (input.title && input.title.length > 50) warnings.push('Гарчиг хэт урт — хэвлэхэд бүрэн харагдахгүй байж болно')

    // Increment use count
    if (template) {
      await this.templateRepo.increment({ id: template.id }, 'use_count', 1)
    }

    this.logger.log(`AI Layout: ${input.category} → ${objects.length} objects, ${warnings.length} warnings`)

    return {
      template_id: template?.id || 'default',
      template_title: template?.title || `${input.category} загвар`,
      canvas_width: canvasW,
      canvas_height: canvasH,
      objects,
      warnings,
    }
  }
}
