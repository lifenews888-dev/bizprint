import { Test, TestingModule } from '@nestjs/testing';
import { PrintSizeService } from './print-size.service';

describe('PrintSizeService', () => {
  let service: PrintSizeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrintSizeService],
    }).compile();

    service = module.get<PrintSizeService>(PrintSizeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
