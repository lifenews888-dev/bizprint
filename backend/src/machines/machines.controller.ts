import { Controller, Post, Body, Get, Param } from '@nestjs/common'
import { MachinesService } from './machines.service'

@Controller('machines')
export class MachinesController {

  constructor(
    private readonly machinesService: MachinesService
  ) {}

  @Post()
  createMachine(@Body() body: any) {

    return this.machinesService.createMachine(body)

  }

  @Get()
  getMachines() {

    return this.machinesService.getAllMachines()

  }

  @Get(':id')
  getMachine(@Param('id') id: string) {

    return this.machinesService.getMachine(Number(id))

  }

}