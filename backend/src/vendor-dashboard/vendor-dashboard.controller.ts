import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common'
import { VendorDashboardService } from './vendor-dashboard.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('vendor-dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('vendor', 'factory', 'admin', 'superadmin')
export class VendorDashboardController {
  constructor(private readonly service: VendorDashboardService) {}

  private assertOwner(req: any, vendorId: string) {
    const { role, id } = req.user
    if (role !== 'admin' && role !== 'superadmin' && id !== vendorId) {
      throw new ForbiddenException('Өөрийн өгөгдөлд л хандах боломжтой')
    }
  }

  @Get(':vendorId/jobs')
  getVendorJobs(@Param('vendorId') vendorId: string, @Req() req: any) {
    this.assertOwner(req, vendorId)
    return this.service.getVendorJobs(vendorId)
  }

  @Get(':vendorId/queue')
  getQueue(@Param('vendorId') vendorId: string, @Req() req: any) {
    this.assertOwner(req, vendorId)
    return this.service.getQueue(vendorId)
  }

  @Patch(':jobId/assign-machine')
  assignMachine(
    @Param('jobId') jobId: string,
    @Body('machine_id') machineId: string,
    @Req() req: any,
  ) {
    return this.service.assignMachine(jobId, machineId)
  }

  @Patch(':jobId/start')
  startPrinting(@Param('jobId') jobId: string, @Req() req: any) {
    return this.service.startPrinting(jobId)
  }

  @Patch(':jobId/finish')
  finish(@Param('jobId') jobId: string, @Req() req: any) {
    return this.service.finishJob(jobId)
  }
}
