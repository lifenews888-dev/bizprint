import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common'
import { ProductionService } from './production.service'

@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post()
  create(@Body() body: any) {
    return this.productionService.createJob(body.order_id)
  }

  @Get()
  getAll() {
    return this.productionService.getAllJobs()
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.productionService.getJob(id)
  }

  @Get('order/:orderId')
  getByOrder(@Param('orderId') orderId: string) {
    return this.productionService.getJobsByOrder(orderId)
  }

  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body() body: { machine_id: string; vendor_id: string }) {
    return this.productionService.assignMachine(id, body.machine_id, body.vendor_id)
  }

  @Patch(':id/start')
  start(@Param('id') id: string) {
    return this.productionService.startJob(id)
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string) {
    return this.productionService.completeJob(id)
  }
}