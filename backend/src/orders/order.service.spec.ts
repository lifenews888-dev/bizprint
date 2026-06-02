import { OrdersService } from './order.service';
import { OrderStatus } from './entities/order.entity';

function makeRepo(overrides: Record<string, any> = {}) {
  return {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ ...value, id: 'order-1' })),
    update: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    manager: {
      connection: {
        getRepository: jest.fn(),
      },
    },
    ...overrides,
  };
}

function makeService() {
  const quoteRepo = makeRepo();
  const ordersRepo = makeRepo();
  ordersRepo.manager.connection.getRepository.mockReturnValue(quoteRepo);

  const service = new OrdersService(
    ordersRepo as any,
    makeRepo() as any,
    makeRepo() as any,
    makeRepo() as any,
    { sendOrderConfirmation: jest.fn(async () => undefined) } as any,
    { notifyStatusChange: jest.fn() } as any,
    { create: jest.fn(async () => undefined) } as any,
    { emit: jest.fn() } as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  return { service, ordersRepo, quoteRepo };
}

describe('OrdersService createFromQuote', () => {
  it('creates an order only from the customer draft quote', async () => {
    const { service, ordersRepo, quoteRepo } = makeService();
    quoteRepo.findOne.mockResolvedValue({
      id: 'quote-1',
      user_id: 'user-1',
      quote_number: 'Q-TEST',
      status: 'draft',
      customer_name: 'Test User',
      quantity: 2,
      unit_price: 90000,
      total_price: 180000,
    });

    await service.createFromQuote('quote-1', 'user-1', 'bank');

    expect(ordersRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      customer_id: 'user-1',
      quote_id: 'quote-1',
      quantity: 2,
      unit_price: 90000,
      total_price: 180000,
      payment_method: 'bank',
      status: OrderStatus.DRAFT,
    }));
    expect(quoteRepo.update).toHaveBeenCalledWith('quote-1', { status: 'ordered' });
  });

  it('does not create an order from another customer quote', async () => {
    const { service, ordersRepo, quoteRepo } = makeService();
    quoteRepo.findOne.mockResolvedValue({
      id: 'quote-1',
      user_id: 'other-user',
      status: 'draft',
    });

    await expect(service.createFromQuote('quote-1', 'user-1', 'bank')).rejects.toThrow('Үнийн санал олдсонгүй');
    expect(ordersRepo.create).not.toHaveBeenCalled();
    expect(ordersRepo.save).not.toHaveBeenCalled();
  });

  it('does not create an order from a non-draft quote', async () => {
    const { service, ordersRepo, quoteRepo } = makeService();
    quoteRepo.findOne.mockResolvedValue({
      id: 'quote-1',
      user_id: 'user-1',
      status: 'ordered',
    });

    await expect(service.createFromQuote('quote-1', 'user-1', 'bank')).rejects.toThrow('зөвхөн "draft" батлах боломжтой');
    expect(ordersRepo.create).not.toHaveBeenCalled();
    expect(ordersRepo.save).not.toHaveBeenCalled();
  });
});
