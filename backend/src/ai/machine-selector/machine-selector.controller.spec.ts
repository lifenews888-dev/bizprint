import { Test, TestingModule } from '@nestjs/testing';
import { MachineSelectorController } from './machine-selector.controller';

describe('MachineSelectorController', () => {
  let controller: MachineSelectorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MachineSelectorController],
    }).compile();

    controller = module.get<MachineSelectorController>(MachineSelectorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
