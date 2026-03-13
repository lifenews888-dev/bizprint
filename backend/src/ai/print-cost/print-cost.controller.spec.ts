import { Test, TestingModule } from '@nestjs/testing';
import { PrintCostController } from './print-cost.controller';

describe('PrintCostController', () => {
  let controller: PrintCostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrintCostController],
    }).compile();

    controller = module.get<PrintCostController>(PrintCostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
