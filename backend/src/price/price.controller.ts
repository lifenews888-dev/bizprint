import { Controller, Post, Body } from '@nestjs/common'
import { PriceService } from './price.service'

@Controller('price')
export class PriceController {

 constructor(private priceService: PriceService){}

 @Post('print-quote')
 printQuote(@Body() data:{
  paper_id:string
  size_id:string
  machine_id:string
  quantity:number
  colors:number
  finish_ids:string[]
 }){
  return this.priceService.printQuote(data)
 }

}