import { Test, TestingModule } from '@nestjs/testing';
import { PrintSizeController } from './print-size.controller';

describe('PrintSizeController', () => {
  let controller: PrintSizeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrintSizeController],
    }).compile();

    controller = module.get<PrintSizeController>(PrintSizeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
