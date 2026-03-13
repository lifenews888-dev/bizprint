import { Test, TestingModule } from '@nestjs/testing';
import { AutoQuoteService } from './auto-quote.service';

describe('AutoQuoteService', () => {
  let service: AutoQuoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AutoQuoteService],
    }).compile();

    service = module.get<AutoQuoteService>(AutoQuoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
