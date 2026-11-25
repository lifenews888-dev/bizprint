import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FlowOrdersService, FLOW_TRANSITIONS } from './flow-orders.service';
import { FlowOrder, FlowOrderStatus as S } from './entities/flow-order.entity';

const PRODUCT_ID = '11111111-1111-4111-8111-111111111111';

function makeService(price: any = { unit_price: 380, subtotal: 38000, vat: 0, total: 38000 }) {
  const store = new Map<string, FlowOrder>();
  let seq = 0;
  const repo: any = {
    create: (o: any) => ({ ...o }),
    save: jest.fn(async (o: any) => {
      if (!o.id) o.id = `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`;
      store.set(o.id, { ...o });
      return { ...o };
    }),
    findOne: jest.fn(async ({ where: { id } }: any) => (store.has(id) ? { ...store.get(id)! } : null)),
    find: jest.fn(async () => [...store.values()]),
  };
  const bc: any = { calculateFinishPrice: jest.fn(async () => price) };
  return { svc: new FlowOrdersService(repo, bc), repo, bc, store };
}

const baseDto = () => ({
  conversationId: 'c1',
  customer: { name: 'Бат', phone: '9911-2233' },
  template: 'nh-classic-01',
  quantity: 100,
  fields: { name: 'Б. Бат', title: 'Захирал' },
});

beforeEach(() => { process.env.FLOW_BC_PRODUCT_ID = PRODUCT_ID; });

describe('FlowOrdersService.create', () => {
  it('үнийг сервер талд бодож, rendering төлөвтэй үүсгэнэ', async () => {
    const { svc, bc } = makeService();
    const o = await svc.create(baseDto() as any);
    expect(bc.calculateFinishPrice).toHaveBeenCalledWith(PRODUCT_ID, 100, 'standard');
    expect(o.amount).toBe(38000);
    expect(o.status).toBe(S.RENDERING);
    expect(o.customer.phone).toBe('99112233');
    expect(o.orderNo).toMatch(/^NH\d{6}-[0-9A-F]{6}$/);
    expect(o.statusHistory).toHaveLength(1);
  });

  it('өнгөлгөөг bc tier баганатай тааруулна', async () => {
    const { svc, bc } = makeService();
    await svc.create({ ...baseDto(), finish: 'burelt' } as any);
    await svc.create({ ...baseDto(), finish: 'lak' } as any);
    expect(bc.calculateFinishPrice).toHaveBeenNthCalledWith(1, PRODUCT_ID, 100, 'laminated');
    expect(bc.calculateFinishPrice).toHaveBeenNthCalledWith(2, PRODUCT_ID, 100, 'varnished');
  });

  it('үнэ тохируулаагүй бол татгалзана', async () => {
    const { svc } = makeService(null);
    await expect(svc.create(baseDto() as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('бүтээгдэхүүн тохируулаагүй бол татгалзана', async () => {
    delete process.env.FLOW_BC_PRODUCT_ID;
    const { svc } = makeService();
    await expect(svc.create(baseDto() as any)).rejects.toThrow('FLOW_BC_PRODUCT_ID');
  });

  it('талбарын буруу нэр, хэт урт утгыг хүлээж авахгүй', async () => {
    const { svc } = makeService();
    await expect(svc.create({ ...baseDto(), fields: { 'Bad Key': 'x' } } as any)).rejects.toThrow('Талбарын нэр');
    await expect(svc.create({ ...baseDto(), fields: { name: 'x'.repeat(301) } } as any)).rejects.toThrow('хэт урт');
    await expect(svc.create({ ...baseDto(), fields: { name: { a: 1 } } } as any)).rejects.toThrow('текст');
  });
});

describe('FlowOrdersService.update', () => {
  async function created() {
    const ctx = makeService();
    const o = await ctx.svc.create(baseDto() as any);
    return { ...ctx, id: o.id };
  }

  it('бүтэн аз жаргалтай замаар явна', async () => {
    const { svc, id } = await created();
    await svc.update(id, { status: S.AWAITING_APPROVAL, previewUrls: ['https://r/p1.png'], pdfUrl: 'https://r/print.pdf' });
    await svc.update(id, { status: S.AWAITING_PAYMENT, qpayInvoiceId: 'inv1', approvedAt: new Date().toISOString() });
    await svc.update(id, { status: S.IN_PRODUCTION, paidAmount: 38000, paymentId: 'p1' });
    await svc.update(id, { status: S.READY });
    await svc.update(id, { status: S.DELIVERY_REQUESTED, deliveryMethod: 'ubcab', deliveryAddress: 'БЗД' });
    const o = await svc.update(id, { status: S.DELIVERED });
    expect(o.status).toBe(S.DELIVERED);
    expect(o.statusHistory.map((h: any) => h.to)).toEqual([
      S.RENDERING, S.AWAITING_APPROVAL, S.AWAITING_PAYMENT, S.IN_PRODUCTION, S.READY, S.DELIVERY_REQUESTED, S.DELIVERED,
    ]);
  });

  it('төлбөр дутуу бол үйлдвэрт оруулахгүй', async () => {
    const { svc, id } = await created();
    await svc.update(id, { status: S.AWAITING_APPROVAL });
    await svc.update(id, { status: S.AWAITING_PAYMENT });
    await expect(svc.update(id, { status: S.IN_PRODUCTION, paidAmount: 1000 })).rejects.toThrow('Төлбөр дутуу');
  });

  it('зөвшөөрөгдөөгүй шилжилтийг хаана', async () => {
    const { svc, id } = await created();
    await expect(svc.update(id, { status: S.IN_PRODUCTION, paidAmount: 38000 })).rejects.toThrow('шилжих боломжгүй');
  });

  it('ижил төлөв рүү PATCH хийхийг зөвшөөрнө (давхар дуудлага)', async () => {
    const { svc, id } = await created();
    const o = await svc.update(id, { status: S.RENDERING, editCount: 1 });
    expect(o.editCount).toBe(1);
    expect(o.statusHistory).toHaveLength(1);
  });

  it('төлбөрийн шатанд загварын өгөгдлийг өөрчлөхгүй', async () => {
    const { svc, id } = await created();
    await svc.update(id, { status: S.AWAITING_APPROVAL });
    await svc.update(id, { status: S.AWAITING_PAYMENT });
    await expect(svc.update(id, { fields: { name: 'X' } })).rejects.toThrow('өөрчлөх боломжгүй');
  });

  it('эцсийн төлөвөөс гарахгүй', async () => {
    expect(FLOW_TRANSITIONS[S.DELIVERED]).toEqual([]);
    expect(FLOW_TRANSITIONS[S.CANCELLED]).toEqual([]);
  });

  it('олдохгүй захиалга 404', async () => {
    const { svc } = makeService();
    await expect(svc.findOne('00000000-0000-4000-8000-999999999999')).rejects.toBeInstanceOf(NotFoundException);
  });
});
