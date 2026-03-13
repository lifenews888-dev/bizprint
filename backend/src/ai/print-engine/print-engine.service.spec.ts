import { Test, TestingModule } from '@nestjs/testing';
import { PrintEngineService } from './print-engine.service';

describe('PrintEngineService', () => {
  let service: PrintEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrintEngineService],
    }).compile();

    service = module.get<PrintEngineService>(PrintEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
