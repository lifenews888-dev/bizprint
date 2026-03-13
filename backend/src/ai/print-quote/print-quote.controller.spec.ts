import { Test, TestingModule } from '@nestjs/testing';
import { PrintQuoteController } from './print-quote.controller';

describe('PrintQuoteController', () => {
  let controller: PrintQuoteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrintQuoteController],
    }).compile();

    controller = module.get<PrintQuoteController>(PrintQuoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
