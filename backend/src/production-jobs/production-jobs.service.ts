import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProductionJob } from './production-job.entity'

@Injectable()
export class ProductionJobsService {

  constructor(
    @InjectRepository(ProductionJob)
    private readonly productionJobRepo: Repository<ProductionJob>,
  ) {}

  // CREATE JOB
  async createJob(order_id: number, factory_id: number, machine_id?: number) {

    const queueCount = await this.productionJobRepo.count({
      where: { factory_id, status: 'queued' }
    })

    const job = this.productionJobRepo.create({
      order_id,
      factory_id,
      machine_id,
      status: 'queued',
      queue_position: queueCount + 1
    })

    return this.productionJobRepo.save(job)
  }

  // FACTORY QUEUE
  async getFactoryQueue(factory_id: number) {

    return this.productionJobRepo.find({
      where: { factory_id },
      order: { queue_position: 'ASC' }
    })

  }

  // START JOB
  async startJob(jobId: string) {

    const job = await this.productionJobRepo.findOne({
      where: { id: jobId }
    })

    if (!job) {
      throw new NotFoundException('Production job not found')
    }

    if (job.status !== 'queued') {
      throw new BadRequestException('Job is not in queue')
    }

    // MACHINE LOCK
    if (job.machine_id) {

      const active = await this.productionJobRepo.findOne({
        where: {
          machine_id: job.machine_id,
          status: 'printing'
        }
      })

      if (active) {
        throw new BadRequestException('Machine already printing another job')
      }

    }

    job.status = 'printing'
    job.started_at = new Date()

    return this.productionJobRepo.save(job)

  }

  // COMPLETE JOB
  async completeJob(jobId: string) {

    const job = await this.productionJobRepo.findOne({
      where: { id: jobId }
    })

    if (!job) {
      throw new NotFoundException('Production job not found')
    }

    if (job.status !== 'printing') {
      throw new BadRequestException('Job is not printing')
    }

    job.status = 'completed'
    job.completed_at = new Date()

    await this.productionJobRepo.save(job)

    // REORDER QUEUE
    await this.reorderQueue(job.factory_id)

    return job
  }

  // QUEUE REORDER
  async reorderQueue(factory_id: number) {

    const queue = await this.productionJobRepo.find({
      where: { factory_id, status: 'queued' },
      order: { queue_position: 'ASC' }
    })

    for (let i = 0; i < queue.length; i++) {
      queue[i].queue_position = i + 1
    }

    await this.productionJobRepo.save(queue)

  }

}