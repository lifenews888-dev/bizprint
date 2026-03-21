import { Controller, Post, Body } from '@nestjs/common'
import { SheetOptimizerService } from './sheet-optimizer.service'

@Controller('ai/sheet')
export class SheetOptimizerController {

  constructor(private readonly service: SheetOptimizerService) {}

  /** POST /ai/sheet/optimize — best layout for given item */
  @Post('optimize')
  optimize(@Body() body: any) {
    return this.service.optimize(body)
  }

  /** POST /ai/sheet/rank — all candidate layouts ranked by utilization */
  @Post('rank')
  rank(@Body() body: any) {
    return this.service.rankLayouts({
      width_mm:        body.width_mm  ?? body.item_width_mm  ?? 90,
      height_mm:       body.height_mm ?? body.item_height_mm ?? 55,
      quantity:        body.quantity  ?? 100,
      bleed_mm:        body.bleed_mm,
      gutter_mm:       body.gutter_mm ?? body.gap_mm,
      is_double_sided: body.is_double_sided ?? false,
    })
  }

}