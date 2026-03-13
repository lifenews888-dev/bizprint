export class CreatePrintQuoteDto {

  paper_size: string

  quantity: number

  pages: number

  paper_type: string

  color_mode: 'bw' | 'color'

}