import { Test, TestingModule } from '@nestjs/testing';
import { MachineSelectorService } from './machine-selector.service';

describe('MachineSelectorService', () => {
  let service: MachineSelectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MachineSelectorService],
    }).compile();

    service = module.get<MachineSelectorService>(MachineSelectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
