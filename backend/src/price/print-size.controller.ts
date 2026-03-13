import { Controller, Get, Post, Body } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PrintSize } from './print-size.entity'

@Controller('print-sizes')
export class PrintSizeController {

  constructor(
    @InjectRepository(PrintSize)
    private repo: Repository<PrintSize>
  ) {}

  @Get()
  async findAll() {
    return this.repo.find()
  }

  @Post()
  async create(@Body() data: any) {
    const size = this.repo.create(data)
    return this.repo.save(size)
  }

}