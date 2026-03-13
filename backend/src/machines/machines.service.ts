import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Machine } from './machine.entity'

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
    return this.machineRepo.findOne({
      where: { id }
    })
  }

}