import { Test, TestingModule } from '@nestjs/testing';
import { QuoteFromFileService } from './quote-from-file.service';

describe('QuoteFromFileService', () => {
  let service: QuoteFromFileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuoteFromFileService],
    }).compile();

    service = module.get<QuoteFromFileService>(QuoteFromFileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
