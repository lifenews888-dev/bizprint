import { Test, TestingModule } from '@nestjs/testing';
import { QuoteEngineService } from './quote-engine.service';

describe('QuoteEngineService', () => {
  let service: QuoteEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuoteEngineService],
    }).compile();

    service = module.get<QuoteEngineService>(QuoteEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
