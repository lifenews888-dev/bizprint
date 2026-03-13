import { Controller, Get, Post, Body } from '@nestjs/common'
import { VariantsService } from './variants.service'

@Controller('variants')
export class VariantsController {

constructor(private readonly variantsService: VariantsService) {}

@Post()
create(@Body() body: any) {
return this.variantsService.create(body)
}

@Get()
findAll() {
return this.variantsService.findAll()
}

}
