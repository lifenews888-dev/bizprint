import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProductionQueue } from './entities/production-queue.entity';

@Injectable()
export class ProductionQueueService {
  constructor(
    @InjectRepository(ProductionQueue)
    private queueRepository: Repository<ProductionQueue>,
  ) {}

  async addToQueue(
    factory_id: number,
    machine_id: number,
    job_id: number,
  ) {
    const last = await this.queueRepository.find({
      where: { machine_id },
      order: { queue_position: 'DESC' },
      take: 1,
    });

    const position =
      last.length > 0 ? last[0].queue_position + 1 : 1;

    const queue = this.queueRepository.create({
      factory_id,
      machine_id,
      job_id,
      queue_position: position,
      status: 'queued',
    });

    return this.queueRepository.save(queue);
  }

  async getFactoryQueue(factoryId: number) {
    return this.queueRepository.find({
      where: { factory_id: factoryId },
      order: { queue_position: 'ASC' },
    });
  }

  async getMachineQueue(machineId: number) {
    return this.queueRepository.find({
      where: { machine_id: machineId },
      order: { queue_position: 'ASC' },
    });
  }

  async startJob(queueId: number) {
    const job = await this.queueRepository.findOne({
      where: { id: queueId },
    });

    if (!job) {
      throw new Error('Queue item not found');
    }

    job.status = 'printing';

    return this.queueRepository.save(job);
  }

  async finishJob(queueId: number) {
    const job = await this.queueRepository.findOne({
      where: { id: queueId },
    });

    if (!job) {
      throw new Error('Queue item not found');
    }

    job.status = 'completed';

    await this.queueRepository.save(job);

    const remaining = await this.queueRepository.find({
      where: { machine_id: job.machine_id },
      order: { queue_position: 'ASC' },
    });

    let position = 1;

    for (const q of remaining) {
      if (q.status === 'queued') {
        q.queue_position = position;
        await this.queueRepository.save(q);
        position++;
      }
    }

    return { success: true };
  }
}