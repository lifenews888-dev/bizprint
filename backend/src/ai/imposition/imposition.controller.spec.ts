import { Test, TestingModule } from '@nestjs/testing';
import { ImpositionController } from './imposition.controller';

describe('ImpositionController', () => {
  let controller: ImpositionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImpositionController],
    }).compile();

    controller = module.get<ImpositionController>(ImpositionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
