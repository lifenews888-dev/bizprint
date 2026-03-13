import { Controller, Post, Body } from '@nestjs/common'
import { PrepressAIEngine } from './prepress-ai.engine'

@Controller('ai/prepress')
export class PrepressController {

  @Post('check')
  check(@Body() body: any) {

    const result = PrepressAIEngine.analyze({
      dpi: body.dpi,
      bleed_mm: body.bleed_mm,
      color_mode: body.color_mode,
      fonts_embedded: body.fonts_embedded,
      page_width_mm: body.page_width_mm,
      page_height_mm: body.page_height_mm
    })

    return result
  }

}