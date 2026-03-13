import { Test, TestingModule } from '@nestjs/testing';
import { FullQuoteController } from './full-quote.controller';

describe('FullQuoteController', () => {
  let controller: FullQuoteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FullQuoteController],
    }).compile();

    controller = module.get<FullQuoteController>(FullQuoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
