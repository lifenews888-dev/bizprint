import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { FlowOrdersController } from './flow-orders.controller';
import { FlowOrdersService } from './flow-orders.service';

const TOKEN = 'test-flow-token-1234567890';
const ID = '00000000-0000-4000-8000-000000000001';

describe('FlowOrdersController (HTTP)', () => {
  let app: INestApplication;
  const service = {
    create: jest.fn(async (dto) => ({ id: ID, ...dto })),
    list: jest.fn(async () => []),
    findOne: jest.fn(async (id) => ({ id })),
    update: jest.fn(async (id, dto) => ({ id, ...dto })),
  };

  beforeAll(async () => {
    process.env.FLOW_API_TOKEN = TOKEN;
    const mod = await Test.createTestingModule({
      controllers: [FlowOrdersController],
      providers: [{ provide: FlowOrdersService, useValue: service }],
    }).compile();
    app = mod.createNestApplication();
    // main.ts-тэй ижил тохиргоо
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });
  afterAll(() => app.close());

  const auth = { Authorization: `Bearer ${TOKEN}` };
  const n8nCreateBody = {
    conversationId: 'c1',
    customer: { name: 'Бат', phone: '99112233' },
    product: 'business_card',
    template: 'nh-classic-01',
    quantity: 100,
    finish: 'none',
    fields: { name: 'Б. Бат' },
    source: 'yria',
  };

  it('token-гүй бол 401', async () => {
    await request(app.getHttpServer()).post('/api/flow/orders').send(n8nCreateBody).expect(401);
  });

  it('n8n-ийн илгээх body-г хүлээж авна', async () => {
    await request(app.getHttpServer()).post('/api/flow/orders').set(auth).send(n8nCreateBody).expect(201);
    expect(service.create).toHaveBeenCalled();
  });

  it('туг (catalog) захиалгын body-г хүлээж авна', async () => {
    await request(app.getHttpServer()).post('/api/flow/orders').set(auth).send({
      conversationId: 'c1', customer: { phone: '99112233' }, product: 'catalog',
      productSlug: 'flagoutdoor', variantCode: 'BP-041', widthM: 1.2, heightM: 2.4, sides: 2,
      quantity: 1, fields: {}, logoUrl: 'https://cdn.x.mn/logo.png',
      extras: [{ variantCode: 'BP-047', quantity: 1 }],
      design: { background: '#0B3D2E', headline: 'Компани', layout: 'center' },
      source: 'yria',
    }).expect(201);
  });

  it('үнийг (amount) клиентээс хүлээж авахгүй', async () => {
    await request(app.getHttpServer()).post('/api/flow/orders').set(auth)
      .send({ ...n8nCreateBody, amount: 1 }).expect(400);
  });

  it('n8n-ийн PATCH body-уудыг хүлээж авна', async () => {
    const bodies = [
      { status: 'awaiting_approval', previewUrls: ['https://render.bizprint.mn/files/a/preview-1.png?exp=1&sig=x'], pdfUrl: 'https://render.bizprint.mn/files/a/print.pdf?exp=1&sig=x', renderJobId: 'j1', renderWarnings: [] },
      { status: 'render_failed', renderError: 'x' },
      { status: 'awaiting_payment', approvedAt: new Date().toISOString(), qpayInvoiceId: 'inv' },
      { status: 'rendering', fields: { name: 'X' }, editCount: 1, logoUrl: 'https://x.mn/logo.png' },
      { status: 'rendering', design: { background: '#FF0000', headline: 'Шинэ' }, editCount: 2 },
      { status: 'needs_human', editCount: 4 },
      { status: 'in_production', paidAt: new Date().toISOString(), paidAmount: 38000, paymentId: 'p', sentToFactoryAt: new Date().toISOString() },
      { status: 'ready', readyAt: new Date().toISOString() },
      { status: 'delivery_requested', deliveryMethod: 'ubcab', deliveryAddress: 'БЗД' },
    ];
    for (const b of bodies) {
      const r = await request(app.getHttpServer()).patch(`/api/flow/orders/${ID}`).set(auth).send(b);
      if (r.status !== 200) throw new Error(JSON.stringify(b) + ' → ' + r.status + ' ' + JSON.stringify(r.body));
    }
  });

  it('буруу id 400', async () => {
    await request(app.getHttpServer()).get('/api/flow/orders/abc').set(auth).expect(400);
  });
});
