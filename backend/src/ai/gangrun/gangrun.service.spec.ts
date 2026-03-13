import { Test, TestingModule } from '@nestjs/testing';
import { GangrunService } from './gangrun.service';

describe('GangrunService', () => {
  let service: GangrunService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GangrunService],
    }).compile();

    service = module.get<GangrunService>(GangrunService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
