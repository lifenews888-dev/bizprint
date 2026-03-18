import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProductionJob, ProductionStatus } from './entities/production-job.entity'

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(ProductionJob)
    private productionRepo: Repository<ProductionJob>
  ) {}

  async createJob(orderId: string) {
    const job = this.productionRepo.create({
      order_id: orderId,
      status: ProductionStatus.QUEUED,
    })
    return this.productionRepo.save(job)
  }

  async getAllJobs() {
    return this.productionRepo.find()
  }

  async getJob(id: string) {
    return this.productionRepo.findOne({ where: { id } })
  }

  async assignMachine(jobId: string, machineId: string, vendorId: string) {
    await this.productionRepo.update(jobId, {
      machine_id: machineId,
      vendor_id: vendorId,
      status: ProductionStatus.ASSIGNED,
    })
    return this.productionRepo.findOne({ where: { id: jobId } })
  }

  async startJob(jobId: string) {
    await this.productionRepo.update(jobId, {
      status: ProductionStatus.PRINTING,
      start_time: new Date(),
    })
    return this.productionRepo.findOne({ where: { id: jobId } })
  }

  async completeJob(jobId: string) {
    await this.productionRepo.update(jobId, {
      status: ProductionStatus.COMPLETED,
      end_time: new Date(),
    })
    return this.productionRepo.findOne({ where: { id: jobId } })
  }

  async getJobsByOrder(orderId: string) {
    return this.productionRepo.find({ where: { order_id: orderId } })
  }
}