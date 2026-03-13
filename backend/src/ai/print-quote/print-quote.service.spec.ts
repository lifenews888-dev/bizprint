import { Test, TestingModule } from '@nestjs/testing';
import { PrintQuoteService } from './print-quote.service';

describe('PrintQuoteService', () => {
  let service: PrintQuoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrintQuoteService],
    }).compile();

    service = module.get<PrintQuoteService>(PrintQuoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
