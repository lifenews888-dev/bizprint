import { Injectable } from '@nestjs/common'
import pdf from 'pdf-parse'

@Injectable()
export class PdfInspectorService {

  async inspect(file: Buffer) {

    const data = await pdf(file)

    return {
      pages: data.numpages,
      text_length: data.text.length,
      info: data.info
    }

  }

}