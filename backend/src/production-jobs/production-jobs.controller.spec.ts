import { Test, TestingModule } from '@nestjs/testing';
import { ProductionJobsController } from './production-jobs.controller';

describe('ProductionJobsController', () => {
  let controller: ProductionJobsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductionJobsController],
    }).compile();

    controller = module.get<ProductionJobsController>(ProductionJobsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
