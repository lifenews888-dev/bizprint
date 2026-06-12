import { OrdersService } from './order.service';

describe('OrdersService compatibility spec', () => {
  it('exports the canonical order service', () => {
    expect(OrdersService).toBeDefined();
  });
});
