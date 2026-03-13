import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProductionJob, ProductionStatus } from '../production/entities/production-job.entity'

@Injectable()
export class VendorDashboardService {

  constructor(
    @InjectRepository(ProductionJob)
    private productionRepo: Repository<ProductionJob>
  ) {}

  async getVendorJobs(vendorId: string) {

    return this.productionRepo.find({
      where: { vendor_id: vendorId }
    })

  }

  async getQueue(vendorId: string) {

    return this.productionRepo.find({
      where: {
        vendor_id: vendorId,
        status: ProductionStatus.QUEUED
      }
    })

  }

  async assignMachine(jobId: string, machineId: string) {

    await this.productionRepo.update(jobId, {
      machine_id: machineId,
      status: ProductionStatus.ASSIGNED
    })

    return this.productionRepo.findOne({
      where: { id: jobId }
    })

  }

  async startPrinting(jobId: string) {

    await this.productionRepo.update(jobId, {
      status: ProductionStatus.PRINTING,
      start_time: new Date()
    })

    return this.productionRepo.findOne({
      where: { id: jobId }
    })

  }

  async finishJob(jobId: string) {

    await this.productionRepo.update(jobId, {
      status: ProductionStatus.COMPLETED,
      end_time: new Date()
    })

    return this.productionRepo.findOne({
      where: { id: jobId }
    })

  }

}