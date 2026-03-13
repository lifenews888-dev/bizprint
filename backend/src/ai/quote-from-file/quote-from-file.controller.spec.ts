import { Test, TestingModule } from '@nestjs/testing';
import { QuoteFromFileController } from './quote-from-file.controller';

describe('QuoteFromFileController', () => {
  let controller: QuoteFromFileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuoteFromFileController],
    }).compile();

    controller = module.get<QuoteFromFileController>(QuoteFromFileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
