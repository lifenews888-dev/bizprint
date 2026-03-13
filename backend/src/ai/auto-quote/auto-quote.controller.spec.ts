import { Test, TestingModule } from '@nestjs/testing';
import { AutoQuoteController } from './auto-quote.controller';

describe('AutoQuoteController', () => {
  let controller: AutoQuoteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutoQuoteController],
    }).compile();

    controller = module.get<AutoQuoteController>(AutoQuoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
