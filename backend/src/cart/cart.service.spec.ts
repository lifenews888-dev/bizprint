import { CartService } from './cart.service';
import { CartStatus } from './cart.entity';

function makeRepo(overrides: Record<string, any> = {}) {
  return {
    findOne: jest.fn(),
    save: jest.fn(async (value) => value),
    create: jest.fn((value) => value),
    delete: jest.fn(),
    update: jest.fn(),
    ...overrides,
  };
}

function makeService(overrides: Record<string, any> = {}) {
  const cartRepo = makeRepo();
  const itemRepo = makeRepo();
  const quotationRepo = makeRepo();
  const quotationItemRepo = makeRepo();
  const orderRepo = makeRepo();
  const orderItemRepo = makeRepo();
  const vendorGroupRepo = makeRepo();
  const productRepo = makeRepo();
  const userRepo = makeRepo();
  const pricingService = { calculateFullPrice: jest.fn() };
  const quoteService = { generateNumber: jest.fn(async () => 'Q-TEST') };
  const eventsLog = { log: jest.fn(async () => undefined) };

  const deps = {
    cartRepo,
    itemRepo,
    quotationRepo,
    quotationItemRepo,
    orderRepo,
    orderItemRepo,
    vendorGroupRepo,
    productRepo,
    userRepo,
    pricingService,
    quoteService,
    eventsLog,
    ...overrides,
  };

  const service = new CartService(
    deps.cartRepo as any,
    deps.itemRepo as any,
    deps.quotationRepo as any,
    deps.quotationItemRepo as any,
    deps.orderRepo as any,
    deps.orderItemRepo as any,
    deps.vendorGroupRepo as any,
    deps.productRepo as any,
    deps.userRepo as any,
    deps.pricingService as any,
    deps.quoteService as any,
    deps.eventsLog as any,
  );

  return { service, deps };
}

describe('CartService pricing', () => {
  it('stores submitted customer unit price and pricing specs when adding an item', async () => {
    const { service, deps } = makeService();
    deps.productRepo.findOne.mockResolvedValue({
      id: 'product-1',
      is_active: true,
      is_out_of_stock: false,
      stock_quantity: 10,
      base_price: 100000,
    });
    deps.cartRepo.findOne.mockResolvedValue({ id: 'cart-1', status: CartStatus.ACTIVE, items: [] });

    await service.addItem('user-1', {
      product_id: 'product-1',
      quantity: 2,
      unit_price: 561000,
      specs: {
        pricing: { vat: 51000, vat_included: true, source: 'pricing-catalog' },
        pricing_snapshot: { source: 'pricing-catalog', pricingContractVersion: 'pricing-golden-v1', total: 1122000 },
      },
    });

    expect(deps.itemRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      cart_id: 'cart-1',
      product_id: 'product-1',
      quantity: 2,
      unit_price: 561000,
      specs: expect.objectContaining({
        pricing: expect.objectContaining({
          unit_price: 561000,
          total_price: 1122000,
          quantity: 2,
          vat_included: true,
          source: 'pricing-catalog',
          pricing_validation: expect.objectContaining({
            status: 'accepted',
            submitted_unit_price: 561000,
            accepted_unit_price: 561000,
          }),
        }),
        pricing_snapshot: expect.objectContaining({
          source: 'pricing-catalog',
          pricingContractVersion: 'pricing-golden-v1',
          total: 1122000,
        }),
      }),
    }));
  });

  it('uses cart item customer price directly when generating a quote', async () => {
    const { service, deps } = makeService();
    const item = {
      id: 'item-1',
      product_id: 'product-1',
      quantity: 2,
      unit_price: 561000,
      specs: {
        pricing: { unit_price: 561000, vat_included: true, source: 'pricing-catalog' },
        pricing_snapshot: { source: 'pricing-catalog', pricingContractVersion: 'pricing-golden-v1', total: 1122000 },
      },
    };
    deps.cartRepo.findOne.mockResolvedValue({ id: 'cart-1', status: CartStatus.ACTIVE, items: [item] });
    deps.quotationRepo.save.mockImplementation(async (value) => ({ ...value, id: 'quote-1' }));
    deps.quotationRepo.findOne.mockResolvedValue({ id: 'quote-1', items: [] });

    await service.generateQuote('user-1');

    expect(deps.pricingService.calculateFullPrice).not.toHaveBeenCalled();
    expect(deps.quotationRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 2,
      unit_price: 561000,
      total_price: 1122000,
    }));
    expect(deps.quotationItemRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 2,
      customer_price: 561000,
      margin_rate: 0,
      specs: expect.objectContaining({
        pricing_snapshot: expect.objectContaining({
          source: 'pricing-catalog',
          pricingContractVersion: 'pricing-golden-v1',
          total: 1122000,
        }),
      }),
    }));
  });

  it('normalizes fixed catalog items to the authoritative catalog price', async () => {
    const { service, deps } = makeService();
    deps.productRepo.findOne.mockResolvedValue({
      id: 'product-1',
      is_active: true,
      is_out_of_stock: false,
      stock_quantity: 10,
      base_price: 100000,
      sale_price: 90000,
      pricing_mode: 'fixed',
    });
    deps.cartRepo.findOne.mockResolvedValue({ id: 'cart-1', status: CartStatus.ACTIVE, items: [] });

    await service.addItem('user-1', {
      product_id: 'product-1',
      quantity: 2,
      unit_price: 1,
      specs: {
        pricing: { source: 'catalog', unit_price: 1 },
        pricing_snapshot: { source: 'catalog', pricingContractVersion: 'pricing-golden-v1', total: 2 },
      },
    });

    expect(deps.itemRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      unit_price: 90000,
      specs: expect.objectContaining({
        pricing: expect.objectContaining({
          unit_price: 90000,
          total_price: 180000,
          pricing_validation: expect.objectContaining({
            status: 'adjusted',
            source: 'catalog',
            submitted_unit_price: 1,
            catalog_unit_price: 90000,
            accepted_unit_price: 90000,
            delta: -89999,
          }),
        }),
      }),
    }));
  });

  it('uses quotation item totals as authoritative when confirming a quote', async () => {
    const { service, deps } = makeService();
    const quotation = {
      id: 'quote-1',
      user_id: 'user-1',
      quote_number: 'Q-TEST',
      status: 'draft',
      quantity: 99,
      unit_price: 1,
      total_price: 1,
      items: [{
        id: 'qi-1',
        product_id: 'product-1',
        quantity: 2,
        customer_price: 90000,
        specs: {
          pricing: {
            pricing_validation: { status: 'adjusted' },
          },
          pricing_snapshot: { source: 'catalog', pricingContractVersion: 'pricing-golden-v1' },
        },
      }],
    };
    deps.quotationRepo.findOne.mockResolvedValueOnce(quotation);
    deps.userRepo.findOne.mockResolvedValue({ id: 'user-1' });
    deps.orderRepo.save.mockImplementation(async (value) => ({ ...value, id: 'order-1' }));
    deps.cartRepo.findOne.mockResolvedValueOnce({ id: 'cart-1', status: CartStatus.ACTIVE });
    deps.orderRepo.findOne.mockResolvedValue({ id: 'order-1', items: [], vendor_groups: [] });

    await service.confirmQuote('user-1', 'quote-1', 'pending');

    expect(deps.orderRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 2,
      unit_price: 90000,
      total_price: 180000,
      options: expect.objectContaining({
        quote_pricing_validation: expect.objectContaining({
          status: 'adjusted',
          header_total_price: 1,
          item_total_price: 180000,
          accepted_total_price: 180000,
          delta: -179999,
        }),
      }),
    }));
    expect(deps.orderItemRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 2,
      unit_price: 90000,
      total_price: 180000,
      specs: expect.objectContaining({
        pricing_snapshot: expect.objectContaining({
          pricingContractVersion: 'pricing-golden-v1',
        }),
      }),
    }));
    expect(deps.eventsLog.log).toHaveBeenCalledWith(expect.objectContaining({
      entity_type: 'order',
      action: 'created_from_quote',
      new_value: expect.objectContaining({
        total_price: 180000,
        pricing_validation: expect.objectContaining({
          status: 'adjusted',
        }),
      }),
    }));
  });

  it('does not confirm another customer quote', async () => {
    const { service, deps } = makeService();
    deps.quotationRepo.findOne.mockResolvedValue({
      id: 'quote-1',
      user_id: 'other-user',
      quote_number: 'Q-OTHER',
      status: 'draft',
      quantity: 1,
      unit_price: 1000,
      total_price: 1000,
      items: [],
    });

    await expect(service.confirmQuote('user-1', 'quote-1', 'pending')).rejects.toThrow('Үнийн санал олдсонгүй');
    expect(deps.orderRepo.create).not.toHaveBeenCalled();
    expect(deps.orderRepo.save).not.toHaveBeenCalled();
  });

  it('returns normalized cart items with product metadata and included VAT split', async () => {
    const { service, deps } = makeService();
    deps.cartRepo.findOne.mockResolvedValue({
      id: 'cart-1',
      customer_id: 'user-1',
      status: CartStatus.ACTIVE,
      items: [{
        id: 'item-1',
        product_id: 'product-1',
        quantity: 2,
        unit_price: '561000',
        specs: { options: { sides: '2' }, pricing: { vat_included: true } },
        product: {
          name_mn: 'Реклам зар',
          name: 'Flyer',
          thumbnail_url: 'https://img.example/product.jpg',
          base_price: 100000,
        },
      }],
    });

    const cart = await service.getCart('user-1');

    expect(deps.cartRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { customer_id: 'user-1', status: CartStatus.ACTIVE },
      relations: ['items', 'items.product'],
    }));
    expect(cart).toEqual(expect.objectContaining({
      id: 'cart-1',
      total: 1122000,
      total_price: 1122000,
      subtotal_excl_vat: 1020000,
      vat: 102000,
      vat_rate: 0.1,
      vat_included: true,
      pricing_audit: expect.objectContaining({
        total_items: 1,
        accepted_count: 0,
        adjusted_count: 0,
        missing_count: 1,
        all_priced: false,
      }),
    }));
    expect(cart.items[0]).toEqual(expect.objectContaining({
      id: 'item-1',
      productId: 'product-1',
      product_id: 'product-1',
      name: 'Реклам зар',
      price: 561000,
      qty: 2,
      quantity: 2,
      unit_price: 561000,
      total_price: 1122000,
      image: 'https://img.example/product.jpg',
      options: { sides: '2' },
    }));
  });

  it('returns cart pricing audit summary for accepted and adjusted items', async () => {
    const { service, deps } = makeService();
    deps.cartRepo.findOne.mockResolvedValue({
      id: 'cart-1',
      customer_id: 'user-1',
      status: CartStatus.ACTIVE,
      items: [
        {
          id: 'item-1',
          product_id: 'product-1',
          quantity: 1,
          unit_price: 90000,
          specs: {
            pricing: {
              source: 'catalog',
              pricing_validation: { status: 'adjusted', source: 'catalog' },
            },
          },
          product: { name_mn: 'Catalog', base_price: 90000 },
        },
        {
          id: 'item-2',
          product_id: 'product-2',
          quantity: 1,
          unit_price: 120000,
          specs: {
            pricing: {
              source: 'pricing-catalog',
              pricing_validation: { status: 'accepted', source: 'pricing-catalog' },
            },
          },
          product: { name_mn: 'Dynamic', base_price: 120000 },
        },
      ],
    });

    const cart = await service.getCart('user-1');

    expect(cart.pricing_audit).toEqual(expect.objectContaining({
      total_items: 2,
      accepted_count: 1,
      adjusted_count: 1,
      missing_count: 0,
      dynamic_count: 1,
      catalog_count: 1,
      has_adjustments: true,
      all_priced: true,
    }));
  });

  it('removes only items that belong to the customer active cart', async () => {
    const { service, deps } = makeService();
    deps.itemRepo.findOne.mockResolvedValue({
      id: 'item-1',
      cart_id: 'cart-1',
      product_id: 'product-1',
      quantity: 2,
      cart: { id: 'cart-1', customer_id: 'user-1', status: CartStatus.ACTIVE },
    });

    await service.removeItem('user-1', 'item-1');

    expect(deps.itemRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      relations: ['cart'],
    });
    expect(deps.itemRepo.delete).toHaveBeenCalledWith('item-1');
    expect(deps.eventsLog.log).toHaveBeenCalledWith(expect.objectContaining({
      entity_type: 'cart',
      entity_id: 'cart-1',
      action: 'item_removed',
      actor_id: 'user-1',
    }));
  });

  it('does not remove another customer cart item', async () => {
    const { service, deps } = makeService();
    deps.itemRepo.findOne.mockResolvedValue({
      id: 'item-1',
      cart_id: 'cart-2',
      cart: { id: 'cart-2', customer_id: 'other-user', status: CartStatus.ACTIVE },
    });

    await expect(service.removeItem('user-1', 'item-1')).rejects.toThrow('Сагсны бараа олдсонгүй');
    expect(deps.itemRepo.delete).not.toHaveBeenCalled();
  });
});
