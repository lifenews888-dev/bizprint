import { Test, TestingModule } from '@nestjs/testing';
import { CustomerDashboardService } from './customer-dashboard.service';

describe('CustomerDashboardService', () => {
  let service: CustomerDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomerDashboardService],
    }).compile();

    service = module.get<CustomerDashboardService>(CustomerDashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
