import { Test, TestingModule } from '@nestjs/testing';
import { GangrunController } from './gangrun.controller';

describe('GangrunController', () => {
  let controller: GangrunController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GangrunController],
    }).compile();

    controller = module.get<GangrunController>(GangrunController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
