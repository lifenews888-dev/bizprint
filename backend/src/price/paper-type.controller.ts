import { Controller, Post, Body, Get } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PaperType } from '../paper-types/paper-type.entity'

@Controller('paper-types')
export class PaperTypeController {

constructor(
@InjectRepository(PaperType)
private repo: Repository<PaperType>,
) {}

@Post()
async create(@Body() data: any) {


const paper = this.repo.create(data)

return await this.repo.save(paper)


}

@Get()
async findAll() {


return await this.repo.find()


}

}
