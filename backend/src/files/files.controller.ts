import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common'
import { FilesService } from './files.service'
import { ProductionGateService } from './production-gate.service'
import { FileType } from './file.entity'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('order-files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly gate: ProductionGateService,
  ) {}

  // GET /order-files?order_id=xxx
  @Get()
  async findAll(@Query('order_id') orderId: string) {
    if (!orderId) return []
    return this.filesService.findByOrder(orderId)
  }

  // GET /order-files/final/:orderId
  @Get('final/:orderId')
  async findFinal(@Param('orderId') orderId: string) {
    return this.filesService.findFinal(orderId)
  }

  // GET /order-files/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.filesService.findOne(id)
  }

  // POST /order-files
  @Post()
  async create(@Body() body: {
    order_id: string
    filename: string
    path: string
    size: number
    mime_type?: string
    file_type?: FileType
    uploaded_by?: string
    uploaded_by_role?: string
  }) {
    return this.filesService.create(body)
  }

  // PATCH /order-files/:id/analysis
  @Patch(':id/analysis')
  async updateAnalysis(
    @Param('id') id: string,
    @Body() body: { analysis: any },
  ) {
    return this.filesService.updateAnalysis(id, body.analysis)
  }

  // PATCH /order-files/:id/approve
  @Patch(':id/approve')
  async approve(@Param('id') id: string) {
    return this.filesService.approve(id)
  }

  // PATCH /order-files/:id/reject
  @Patch(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ) {
    return this.filesService.reject(id, body.notes)
  }

  // PATCH /order-files/:id/set-final
  @Patch(':id/set-final')
  async setFinal(@Param('id') id: string) {
    return this.filesService.setFinal(id)
  }

  // DELETE /order-files/:id
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.filesService.remove(id)
    return { deleted: true }
  }

  /* ═══════════════════════════════════════
   *  PRODUCTION GATE — file validation
   * ═══════════════════════════════════════ */

  // POST /order-files/:id/gate-check — validate single file
  @Post(':id/gate-check')
  @UseGuards(JwtAuthGuard)
  async gateCheck(@Param('id') id: string) {
    return this.gate.checkFile(id)
  }

  // POST /order-files/:id/recheck — force re-analysis
  @Post(':id/recheck')
  @UseGuards(JwtAuthGuard)
  async recheck(@Param('id') id: string) {
    return this.gate.recheck(id)
  }

  // POST /order-files/:id/set-final-validate — mark final + validate
  @Post(':id/set-final-validate')
  @UseGuards(JwtAuthGuard)
  async setFinalAndValidate(@Param('id') id: string) {
    return this.gate.setFinalAndValidate(id)
  }

  // GET /order-files/gate/order/:orderId — check all files for order
  @Get('gate/order/:orderId')
  @UseGuards(JwtAuthGuard)
  async gateCheckOrder(@Param('orderId') orderId: string) {
    return this.gate.checkOrder(orderId)
  }

  // GET /order-files/gate/ready/:orderId — is order production-ready?
  @Get('gate/ready/:orderId')
  @UseGuards(JwtAuthGuard)
  async isProductionReady(@Param('orderId') orderId: string) {
    return this.gate.isProductionReady(orderId)
  }
}
