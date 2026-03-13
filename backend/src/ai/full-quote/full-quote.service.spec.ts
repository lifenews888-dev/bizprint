import { Test, TestingModule } from '@nestjs/testing';
import { FullQuoteService } from './full-quote.service';

describe('FullQuoteService', () => {
  let service: FullQuoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FullQuoteService],
    }).compile();

    service = module.get<FullQuoteService>(FullQuoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
