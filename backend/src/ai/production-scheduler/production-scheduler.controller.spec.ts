import { Test, TestingModule } from '@nestjs/testing';
import { ProductionSchedulerController } from './production-scheduler.controller';

describe('ProductionSchedulerController', () => {
  let controller: ProductionSchedulerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductionSchedulerController],
    }).compile();

    controller = module.get<ProductionSchedulerController>(ProductionSchedulerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
