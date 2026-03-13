import { Controller, Get, Param, Patch, Body } from '@nestjs/common'
import { VendorDashboardService } from './vendor-dashboard.service'

@Controller('vendor-dashboard')
export class VendorDashboardController {

  constructor(private readonly service: VendorDashboardService) {}

  @Get(':vendorId/jobs')
  getVendorJobs(@Param('vendorId') vendorId: string) {

    return this.service.getVendorJobs(vendorId)

  }

  @Get(':vendorId/queue')
  getQueue(@Param('vendorId') vendorId: string) {

    return this.service.getQueue(vendorId)

  }

  @Patch(':jobId/assign-machine')
  assignMachine(
    @Param('jobId') jobId: string,
    @Body('machine_id') machineId: string
  ) {

    return this.service.assignMachine(jobId, machineId)

  }

  @Patch(':jobId/start')
  startPrinting(@Param('jobId') jobId: string) {

    return this.service.startPrinting(jobId)

  }

  @Patch(':jobId/finish')
  finish(@Param('jobId') jobId: string) {

    return this.service.finishJob(jobId)

  }

}