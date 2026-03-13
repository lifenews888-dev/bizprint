import { IsUUID, IsInt, IsString, Min } from "class-validator"

export class CreateQuoteDto {

  @IsUUID()
  product_id: string

  @IsUUID()
  size_id: string

  @IsUUID()
  paper_type_id: string

  @IsUUID()
  finish_id: string

  @IsUUID()
  side_id: string

  @IsInt()
  @Min(1)
  quantity: number

}