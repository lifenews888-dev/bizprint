import { Controller, Post, Body, Get } from '@nestjs/common'
import { ProductVariantsService } from './product-variants.service'

@Controller('product-variants')
export class ProductVariantsController {

constructor(private readonly service: ProductVariantsService) {}

@Post()
create(@Body() body: any) {
return this.service.create(body)
}

@Get()
findAll() {
return this.service.findAll()
}

}
