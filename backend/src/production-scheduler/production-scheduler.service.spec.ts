import { Test, TestingModule } from '@nestjs/testing';
import { ProductionSchedulerService } from './production-scheduler.service';

describe('ProductionSchedulerService', () => {
  let service: ProductionSchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductionSchedulerService],
    }).compile();

    service = module.get<ProductionSchedulerService>(ProductionSchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
