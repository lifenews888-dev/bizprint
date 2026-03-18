import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Machine, MachineStatus } from './machine.entity'

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(Machine)
    private machineRepo: Repository<Machine>
  ) {}

  async createMachine(data: any) {
    const machine = this.machineRepo.create(data)
    return this.machineRepo.save(machine)
  }

  async getAllMachines() {
    return this.machineRepo.find()
  }

  async getMachine(id: number) {
    return this.machineRepo.findOne({ where: { id } })
  }

  async updateStatus(id: number, status: MachineStatus) {
    await this.machineRepo.update(id, { status })
    return this.machineRepo.findOne({ where: { id } })
  }

  async deleteMachine(id: number) {
    await this.machineRepo.delete(id)
    return { message: 'Машин устгагдлаа' }
  }
}