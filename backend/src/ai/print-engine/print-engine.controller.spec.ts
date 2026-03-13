import { Test, TestingModule } from '@nestjs/testing';
import { PrintEngineController } from './print-engine.controller';

describe('PrintEngineController', () => {
  let controller: PrintEngineController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrintEngineController],
    }).compile();

    controller = module.get<PrintEngineController>(PrintEngineController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
