import { Test, TestingModule } from '@nestjs/testing';
import { ProductionJobsService } from './production-jobs.service';

describe('ProductionJobsService', () => {
  let service: ProductionJobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductionJobsService],
    }).compile();

    service = module.get<ProductionJobsService>(ProductionJobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
