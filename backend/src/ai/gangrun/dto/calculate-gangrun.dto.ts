import { IsArray, IsNumber } from 'class-validator'

export class CalculateGangRunDto {

  @IsNumber()
  sheetCapacity: number

  @IsArray()
  orders: number[]

}