import { Test, TestingModule } from '@nestjs/testing';
import { QuoteEngineController } from './quote-engine.controller';

describe('QuoteEngineController', () => {
  let controller: QuoteEngineController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuoteEngineController],
    }).compile();

    controller = module.get<QuoteEngineController>(QuoteEngineController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
