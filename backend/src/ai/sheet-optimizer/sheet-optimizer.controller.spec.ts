import { Test, TestingModule } from '@nestjs/testing';
import { SheetOptimizerController } from './sheet-optimizer.controller';

describe('SheetOptimizerController', () => {
  let controller: SheetOptimizerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SheetOptimizerController],
    }).compile();

    controller = module.get<SheetOptimizerController>(SheetOptimizerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
