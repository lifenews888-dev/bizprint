export class CreateQuoteDto {
  size: string           // A4, A5, etc.
  paperType: string      // Art, Matte, etc.
  gsm: number            // 150, 200...
  quantity: number       // хэвлэх тоо
  colors?: string        // 4/4, 4/1 гэх мэт
  finishing?: string     // laminate, uv, none
  delivery?: boolean
}