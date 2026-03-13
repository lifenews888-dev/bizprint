import { Test, TestingModule } from '@nestjs/testing';
import { CustomerDashboardController } from './customer-dashboard.controller';

describe('CustomerDashboardController', () => {
  let controller: CustomerDashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerDashboardController],
    }).compile();

    controller = module.get<CustomerDashboardController>(CustomerDashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
