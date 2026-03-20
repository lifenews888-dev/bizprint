import { Injectable } from '@nestjs/common';

@Injectable()
export class ParserService {
  async parse(fileUrl: string) {
    return {
      pages: 120,
      size: 'A5',
      color: 'BW',
    };
  }
}
