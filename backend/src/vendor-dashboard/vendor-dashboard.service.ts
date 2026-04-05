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
      where: { vendorId }
    })
  }

  async getQueue(vendorId: string) {
    return this.productionRepo.find({
      where: {
        vendorId,
        status: ProductionStatus.QUEUED
      }
    })
  }

  async assignMachine(jobId: string, machineId: string) {
    await this.productionRepo.update(jobId, {
      machineId,
      status: ProductionStatus.ASSIGNED
    })
    return this.productionRepo.findOne({ where: { id: jobId } })
  }

  async startPrinting(jobId: string) {
    await this.productionRepo.update(jobId, {
      status: ProductionStatus.PRINTING,
      startedAt: new Date()
    })
    return this.productionRepo.findOne({ where: { id: jobId } })
  }

  async finishJob(jobId: string) {
    await this.productionRepo.update(jobId, {
      status: ProductionStatus.COMPLETED,
      completedAt: new Date()
    })
    return this.productionRepo.findOne({ where: { id: jobId } })
  }
}
