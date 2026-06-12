import { OrdersController } from './order.controller';

describe('OrdersController compatibility spec', () => {
  it('exports the canonical order controller', () => {
    expect(OrdersController).toBeDefined();
  });
});
