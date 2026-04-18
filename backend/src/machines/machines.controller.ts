import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common'
import { MachinesService } from './machines.service'
import { MachineStatus } from './machine.entity'

@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

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

  @Patch(':id')
  updateMachine(@Param('id') id: string, @Body() body: any) {
    return this.machinesService.updateMachine(Number(id), body)
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: MachineStatus }) {
    return this.machinesService.updateStatus(Number(id), body.status)
  }

  @Delete(':id')
  deleteMachine(@Param('id') id: string) {
    return this.machinesService.deleteMachine(Number(id))
  }
}