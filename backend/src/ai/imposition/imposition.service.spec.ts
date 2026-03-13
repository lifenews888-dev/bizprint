import { Test, TestingModule } from '@nestjs/testing';
import { ImpositionService } from './imposition.service';

describe('ImpositionService', () => {
  let service: ImpositionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImpositionService],
    }).compile();

    service = module.get<ImpositionService>(ImpositionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
