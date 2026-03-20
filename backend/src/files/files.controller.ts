import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query,
} from '@nestjs/common'
import { FilesService } from './files.service'
import { FileType } from './file.entity'

@Controller('order-files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

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
}
