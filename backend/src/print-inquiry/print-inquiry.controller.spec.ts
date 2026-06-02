import { PrintInquiryController, safeInquiryUploadExtension } from './print-inquiry.controller';
import { InquiryStatus } from './entities/print-inquiry.entity';

describe('PrintInquiryController', () => {
  function makeController() {
    const service = {
      create: jest.fn(async (dto: any) => dto),
      findAll: jest.fn(async (filters: any) => filters),
      trackByNumber: jest.fn(async (...args: any[]) => args),
      findOneForUser: jest.fn(async (...args: any[]) => args),
      getMessagesForUser: jest.fn(async (...args: any[]) => args),
      sendMessage: jest.fn(async (...args: any[]) => args),
      markReadForUser: jest.fn(async (...args: any[]) => args),
      sendQuote: jest.fn(async (...args: any[]) => args),
      updateStatus: jest.fn(async (...args: any[]) => args),
      assign: jest.fn(async (...args: any[]) => args),
      findByCustomer: jest.fn(async (...args: any[]) => args),
      getVendorPendingCount: jest.fn(async () => 7),
      findForVendor: jest.fn(async (...args: any[]) => args),
      findOne: jest.fn(async (...args: any[]) => args[0] === 'missing-inq' ? null : { id: args[0], vendor_id: 'vendor-1' }),
      checkSLATimeout: jest.fn(async (...args: any[]) => args),
      reprice: jest.fn(async (...args: any[]) => args),
      assignVendor: jest.fn(async (...args: any[]) => args),
      broadcastToVendors: jest.fn(async (...args: any[]) => args),
      vendorAccept: jest.fn(async (...args: any[]) => args),
      vendorReject: jest.fn(async (...args: any[]) => args),
    };
    return {
      controller: new PrintInquiryController(service as any),
      service,
    };
  }

  it('normalizes and validates inquiry upload extensions', () => {
    expect(safeInquiryUploadExtension('design.PDF')).toBe('.pdf');
    expect(safeInquiryUploadExtension('archive.zip')).toBe('.zip');
    expect(safeInquiryUploadExtension('design.pdf.exe')).toBeNull();
    expect(safeInquiryUploadExtension('design.pdf\n')).toBeNull();
    expect(safeInquiryUploadExtension('design\u0007.pdf')).toBeNull();
    expect(safeInquiryUploadExtension(['design.pdf'] as any)).toBeNull();
    expect(safeInquiryUploadExtension({ name: 'design.pdf' } as any)).toBeNull();
    expect(safeInquiryUploadExtension('')).toBeNull();
  });

  it('trims optional authenticated customer ids when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create({}, [], { user: { id: ' customer-1 ' } });

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      customer_id: 'customer-1',
    }));
  });

  it('normalizes non-object create bodies and non-array upload lists', async () => {
    const { controller, service } = makeController();

    await controller.create(null as any, { length: 1 } as any, {});
    await controller.create(['bad'] as any, 'bad-files' as any, {});

    expect(service.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      customer_id: null,
      product_name: null,
      files: [],
    }));
    expect(service.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      customer_id: null,
      product_name: null,
      files: [],
    }));
  });

  it('drops malformed uploaded inquiry file entries before creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create({}, [
      null,
      'bad',
      {
        originalname: 'design.pdf',
        filename: 'stored.pdf',
        size: 123,
      },
    ] as any, {});

    const payload = service.create.mock.calls[0][0];
    expect(payload.files).toHaveLength(1);
    expect(payload.files[0]).toMatchObject({
      name: 'design.pdf',
      size: 123,
      url: '/api/uploads/inquiries/stored.pdf',
    });
  });

  it('rejects unsafe optional customer ids before creating inquiries', async () => {
    const { controller, service } = makeController();

    await expect(controller.create({}, [], { user: { id: '../customer-1' } })).rejects.toThrow('customer_id');
    expect(service.create).not.toHaveBeenCalled();
  });

  it('parses comma-separated multipart finishing values when JSON quotes are stripped', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        category: 'banner',
        product_name: 'Баннер',
        quantity: '1',
        width_mm: '1000',
        height_mm: '2000',
        paper_type: 'Vinyl 440gsm',
        finishing: '[Гантиг гагнуур,Оосор нэмэх]',
        estimated_price: '1',
        has_design: 'true',
        needs_design: 'false',
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      finishing: ['Гантиг гагнуур', 'Оосор нэмэх'],
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      estimated_price: 1,
      has_design: true,
      needs_design: false,
    }));
  });

  it('parses JSON multipart finishing values', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        finishing: '["Гантиг гагнуур","Оосор нэмэх"]',
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      finishing: ['Гантиг гагнуур', 'Оосор нэмэх'],
    }));
  });

  it('deduplicates and caps finishing values when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        finishing: JSON.stringify([
          '  matte  ',
          'matte',
          'x'.repeat(150),
          ...Array.from({ length: 30 }, (_, i) => `finish-${i}`),
        ]),
      },
      [],
      {},
    );

    const payload = service.create.mock.calls[0][0];
    expect(payload.finishing).toHaveLength(20);
    expect(payload.finishing[0]).toBe('matte');
    expect(payload.finishing[1]).toBe('x'.repeat(120));
    expect(payload.finishing.filter((item: string) => item === 'matte')).toHaveLength(1);
  });

  it('strips control characters from finishing values when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        finishing: JSON.stringify([' Matte\r\n\tLaminate\0\u0007 ', '']),
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      finishing: ['Matte Laminate'],
    }));
  });

  it('drops non-scalar finishing values when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        finishing: JSON.stringify(['Matte', null, { label: 'bad' }, ['nested'], 123]),
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      finishing: ['Matte', '123'],
    }));
  });

  it('drops internal fields from public inquiry creation payloads', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        product_name: 'Banner',
        customer_name: 'Customer',
        quoted_price: '1',
        status: 'confirmed',
        vendor_id: 'vendor-1',
        vendor_accepted: 'true',
        admin_notes: 'internal',
        assigned_to: 'admin-1',
      },
      [],
      { user: { id: 'customer-1' } },
    );

    const payload = service.create.mock.calls[0][0];
    expect(payload).toMatchObject({
      customer_id: 'customer-1',
      product_name: 'Banner',
      customer_name: 'Customer',
    });
    expect(payload).not.toHaveProperty('quoted_price');
    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('vendor_id');
    expect(payload).not.toHaveProperty('vendor_accepted');
    expect(payload).not.toHaveProperty('admin_notes');
    expect(payload).not.toHaveProperty('assigned_to');
  });

  it('normalizes optional product ids when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create({ product_id: ' product-1 ' }, [], {});
    await controller.create({ product_id: '   ' }, [], {});

    expect(service.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      product_id: 'product-1',
    }));
    expect(service.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      product_id: null,
    }));
  });

  it('rejects unsafe product ids before creating inquiries', async () => {
    const { controller, service } = makeController();

    await expect(controller.create({ product_id: '../product-1' }, [], {})).rejects.toThrow('product_id');
    await expect(controller.create({ product_id: 'product\n1' }, [], {})).rejects.toThrow('product_id');
    await expect(controller.create({ product_id: { id: 'product-1' } }, [], {})).rejects.toThrow('product_id');

    expect(service.create).not.toHaveBeenCalled();
  });

  it('normalizes invalid preferred contact values when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        product_name: 'Banner',
        preferred_contact: 'sms',
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      preferred_contact: 'chat',
    }));
  });

  it('keeps valid preferred contact values when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        product_name: 'Banner',
        preferred_contact: 'viber',
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      preferred_contact: 'viber',
    }));
  });

  it('normalizes common preferred contact aliases when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create({ preferred_contact: ' Call ' }, [], {});
    await controller.create({ preferred_contact: 'e-mail' }, [], {});
    await controller.create({ preferred_contact: 'messenger' }, [], {});
    await controller.create({ preferred_contact: { method: 'phone' } }, [], {});

    expect(service.create).toHaveBeenNthCalledWith(1, expect.objectContaining({ preferred_contact: 'phone' }));
    expect(service.create).toHaveBeenNthCalledWith(2, expect.objectContaining({ preferred_contact: 'email' }));
    expect(service.create).toHaveBeenNthCalledWith(3, expect.objectContaining({ preferred_contact: 'chat' }));
    expect(service.create).toHaveBeenNthCalledWith(4, expect.objectContaining({ preferred_contact: 'chat' }));
  });

  it('normalizes invalid print side values when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        product_name: 'Banner',
        sides: 'triple',
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      sides: 'single',
    }));
  });

  it('keeps valid print side values when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        product_name: 'Banner',
        sides: 'double',
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      sides: 'double',
    }));
  });

  it('normalizes common print side aliases when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create({ sides: ' Duplex ' }, [], {});
    await controller.create({ sides: '2-sided' }, [], {});
    await controller.create({ sides: 'simplex' }, [], {});
    await controller.create({ sides: { value: 'double' } }, [], {});

    expect(service.create).toHaveBeenNthCalledWith(1, expect.objectContaining({ sides: 'double' }));
    expect(service.create).toHaveBeenNthCalledWith(2, expect.objectContaining({ sides: 'double' }));
    expect(service.create).toHaveBeenNthCalledWith(3, expect.objectContaining({ sides: 'single' }));
    expect(service.create).toHaveBeenNthCalledWith(4, expect.objectContaining({ sides: 'single' }));
  });

  it('normalizes invalid numeric values when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        product_name: 'Banner',
        quantity: '-5',
        width_mm: 'not-a-number',
        height_mm: '0',
        estimated_price: '-1000',
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 1,
      width_mm: null,
      height_mm: 1,
      estimated_price: 0,
    }));
  });

  it('caps oversized numeric values when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        product_name: 'Banner',
        quantity: '999999999',
        width_mm: '999999999',
        height_mm: '999999999',
        estimated_price: '99999999999999',
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 1000000,
      width_mm: 100000,
      height_mm: 100000,
      estimated_price: 10000000000,
    }));
  });

  it('drops non-scalar numeric values when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        quantity: [5],
        width_mm: { value: 1000 },
        height_mm: [2000],
        estimated_price: { value: 100000 },
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      quantity: null,
      width_mm: null,
      height_mm: null,
      estimated_price: null,
    }));
  });

  it('trims and caps text fields when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        customer_name: ` ${'n'.repeat(300)} `,
        customer_phone: ` ${'9'.repeat(80)} `,
        category: ` ${'c'.repeat(200)} `,
        notes: ` ${'x'.repeat(6000)} `,
        delivery_address: ` ${'a'.repeat(800)} `,
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      customer_name: 'n'.repeat(255),
      customer_phone: '9'.repeat(40),
      category: 'c'.repeat(120),
      notes: 'x'.repeat(5000),
      delivery_address: 'a'.repeat(500),
    }));
  });

  it('strips control characters from text fields when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        customer_name: ' Alice\r\n\tSmith\0\u0007 ',
        notes: 'line1\r\n\tline2\0\u0007',
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      customer_name: 'Alice Smith',
      notes: 'line1 line2',
    }));
  });

  it('normalizes email and phone fields when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        customer_email: ' Test@Example.COM ',
        customer_phone: '  +976\r\n9911-2233 ext<script>  ',
        viber_number: ' (976) 8811 2233 ',
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      customer_email: 'test@example.com',
      customer_phone: '+976 9911-2233',
      viber_number: '(976) 8811 2233',
    }));
  });

  it('drops invalid email and digitless phone fields when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        customer_email: 'bad-email\r\n@example',
        customer_phone: 'abc<script>',
        viber_number: '---',
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      customer_email: null,
      customer_phone: null,
      viber_number: null,
    }));
  });

  it('drops non-scalar email and phone fields when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        customer_email: { value: 'test@example.com' },
        customer_phone: { value: '99112233' },
        viber_number: ['99112233'],
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      customer_email: null,
      customer_phone: null,
      viber_number: null,
    }));
  });

  it('normalizes blank text fields to null when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        customer_name: '   ',
        product_name: '',
        delivery_district: ' ',
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      customer_name: null,
      product_name: null,
      delivery_district: null,
    }));
  });

  it('drops non-scalar text fields when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        customer_name: { value: 'Alice' },
        product_name: ['Banner'],
        notes: { text: 'note' },
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      customer_name: null,
      product_name: null,
      notes: null,
    }));
  });

  it('parses boolean design flags from boolean and string values', async () => {
    const { controller, service } = makeController();

    await controller.create({ has_design: true, needs_design: 'true' }, [], {});
    await controller.create({ has_design: 'yes', needs_design: 1 }, [], {});

    expect(service.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      has_design: true,
      needs_design: true,
    }));
    expect(service.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      has_design: true,
      needs_design: true,
    }));
  });

  it('sanitizes uploaded inquiry file display names', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {},
      [{
        originalname: '../bad"name\r\n.pdf',
        size: 12,
        mimetype: 'text/html',
        filename: 'stored.pdf',
      } as any],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      files: [expect.objectContaining({
        name: 'bad_name .pdf',
        size: 12,
        type: 'application/pdf',
        url: '/api/uploads/inquiries/stored.pdf',
      })],
    }));
  });

  it('strips control characters from uploaded file display names', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {},
      [{
        originalname: 'bad\0\u0007name\tfile.pdf',
        size: 12,
        mimetype: 'application/pdf',
        filename: 'stored.pdf',
      } as any],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      files: [expect.objectContaining({
        name: 'badname file.pdf',
      })],
    }));
  });

  it('falls back for non-scalar uploaded inquiry file display names', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {},
      [{
        originalname: { name: 'design.pdf' },
        size: 12,
        mimetype: 'application/pdf',
        filename: 'stored.pdf',
      } as any],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      files: [expect.objectContaining({
        name: 'file',
        url: '/api/uploads/inquiries/stored.pdf',
      })],
    }));
  });

  it('normalizes uploaded inquiry file sizes before persisting metadata', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {},
      [
        {
          originalname: 'huge.pdf',
          size: 999999999,
          mimetype: 'application/pdf',
          filename: 'huge.pdf',
        } as any,
        {
          originalname: 'bad-size.pdf',
          size: Number.NaN,
          mimetype: 'application/pdf',
          filename: 'bad-size.pdf',
        } as any,
        {
          originalname: 'array-size.pdf',
          size: ['12'],
          mimetype: 'application/pdf',
          filename: 'array-size.pdf',
        } as any,
      ],
      {},
    );

    const payload = service.create.mock.calls[0][0];
    expect(payload.files[0].size).toBe(50 * 1024 * 1024);
    expect(payload.files[1].size).toBe(0);
    expect(payload.files[2].size).toBe(0);
  });

  it('rejects inquiry creation with more than five uploaded files', async () => {
    const { controller, service } = makeController();
    const files = Array.from({ length: 6 }, (_, i) => ({
      originalname: `design-${i}.pdf`,
      size: 12,
      mimetype: 'application/pdf',
      filename: `design-${i}.pdf`,
    })) as any[];

    await expect(controller.create({}, files, {})).rejects.toThrow('Файлын тоо');

    expect(service.create).not.toHaveBeenCalled();
  });

  it('sanitizes uploaded inquiry file URLs before persisting metadata', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {},
      [{
        originalname: 'design.pdf',
        size: 12,
        mimetype: 'application/pdf',
        filename: '../unsafe folder/stored file.pdf\r\n',
      } as any],
      {},
    );

    const payload = service.create.mock.calls[0][0];
    expect(payload.files[0].url).toBe('/api/uploads/inquiries/stored%20file.pdf');
  });

  it('falls back to the original upload extension for unsafe stored filenames', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {},
      [{
        originalname: 'design.pdf',
        size: 12,
        mimetype: 'application/pdf',
        filename: 'stored.exe',
      } as any],
      {},
    );

    const payload = service.create.mock.calls[0][0];
    expect(payload.files[0].url).toBe('/api/uploads/inquiries/stored.pdf');
  });

  it('strips control characters from uploaded inquiry file URLs', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {},
      [{
        originalname: 'design.pdf',
        size: 12,
        mimetype: 'application/pdf',
        filename: 'bad\u0007name?.exe',
      } as any],
      {},
    );

    const payload = service.create.mock.calls[0][0];
    expect(payload.files[0].url).toBe('/api/uploads/inquiries/badname_.pdf');
  });

  it('falls back for non-scalar stored inquiry filenames', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {},
      [{
        originalname: 'design.pdf',
        size: 12,
        mimetype: 'text/html',
        filename: ['stored.pdf'],
      } as any],
      {},
    );

    const payload = service.create.mock.calls[0][0];
    expect(payload.files[0]).toMatchObject({
      type: 'application/pdf',
      url: '/api/uploads/inquiries/file.pdf',
    });
  });

  it('accepts object pricing snapshots when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        pricing_snapshot: JSON.stringify({ total: 120000, source: 'backend' }),
      },
      [],
      {},
    );
    await controller.create(
      {
        pricing_snapshot: { total: 130000, source: 'json-body' },
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      pricing_snapshot: { total: 120000, source: 'backend' },
    }));
    expect(service.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      pricing_snapshot: { total: 130000, source: 'json-body' },
    }));
  });

  it('normalizes object pricing snapshots through JSON before creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create(
      {
        pricing_snapshot: {
          total: 120000,
          source: 'json-body',
          calculate: () => 1,
        },
      },
      [],
      {},
    );

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
      pricing_snapshot: { total: 120000, source: 'json-body' },
    }));
    expect(service.create.mock.calls[0][0].pricing_snapshot).not.toHaveProperty('calculate');
  });

  it('drops non-object or oversized pricing snapshots when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create({ pricing_snapshot: '["not-object"]' }, [], {});
    await controller.create({ pricing_snapshot: JSON.stringify({ blob: 'x'.repeat(21000) }) }, [], {});
    await controller.create({ pricing_snapshot: { blob: 'x'.repeat(21000) } }, [], {});

    expect(service.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      pricing_snapshot: null,
    }));
    expect(service.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      pricing_snapshot: null,
    }));
    expect(service.create).toHaveBeenNthCalledWith(3, expect.objectContaining({
      pricing_snapshot: null,
    }));
  });

  it('drops pricing snapshots with unsafe prototype keys when creating inquiries', async () => {
    const { controller, service } = makeController();

    await controller.create({
      pricing_snapshot: '{"total":120000,"meta":{"__proto__":{"polluted":true}}}',
    }, [], {});
    await controller.create({
      pricing_snapshot: '{"total":120000,"constructor":{"prototype":{"polluted":true}}}',
    }, [], {});

    expect(service.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      pricing_snapshot: null,
    }));
    expect(service.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      pricing_snapshot: null,
    }));
  });

  it('passes verified pricing filter to the service', async () => {
    const { controller, service } = makeController();

    await controller.findAll(undefined, undefined, undefined, undefined, undefined, 'true');

    expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({
      pricingVerified: true,
    }));
  });

  it('normalizes common truthy list query flags before passing filters', async () => {
    const { controller, service } = makeController();

    await controller.findAll(undefined, undefined, '1', 'yes', undefined, 'on', ' TRUE ', undefined, 'yes', '1', 'on');

    expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({
      slaOverdue: true,
      pricingDelta: true,
      pricingVerified: true,
      pricingUnverified: true,
      pricingManualReview: true,
      pricingSnapshotMissing: true,
      pricingActionRequired: true,
    }));
  });

  it('ignores non-scalar list query flags instead of coercing them truthy', async () => {
    const { controller, service } = makeController();

    await controller.findAll(undefined, undefined, ['true'] as any, { value: 'yes' } as any, undefined, ['on'] as any, [' TRUE '] as any, undefined, { value: 'yes' } as any, ['true'] as any, { value: 'on' } as any);

    expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({
      slaOverdue: false,
      pricingDelta: false,
      pricingVerified: false,
      pricingUnverified: false,
      pricingManualReview: false,
      pricingSnapshotMissing: false,
      pricingActionRequired: false,
    }));
  });

  it('normalizes pricing enum list filters before passing them to the service', async () => {
    const { controller, service } = makeController();

    await controller.findAll(undefined, undefined, undefined, undefined, ' CRITICAL ', undefined, undefined, ' Missing_Material ');

    expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({
      pricingDeltaSeverity: 'critical',
      pricingUnverifiedReason: 'missing_material',
    }));
  });

  it('normalizes status list filters before passing them to the service', async () => {
    const { controller, service } = makeController();

    await controller.findAll(' REVIEWING ');

    expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({
      status: InquiryStatus.REVIEWING,
    }));
  });

  it('normalizes category list filters before passing them to the service', async () => {
    const { controller, service } = makeController();

    await controller.findAll(undefined, ' Banner\r\n\tWide\u0007 ');
    await controller.findAll(undefined, '   ');

    expect(service.findAll).toHaveBeenNthCalledWith(1, expect.objectContaining({
      category: 'Banner Wide',
    }));
    expect(service.findAll).toHaveBeenNthCalledWith(2, expect.objectContaining({
      category: undefined,
    }));
  });

  it('rejects invalid status list filters before calling the service', () => {
    const { controller, service } = makeController();

    expect(() => controller.findAll('archived')).toThrow('status');
    expect(() => controller.findAll({ status: 'reviewing' } as any)).toThrow('status');

    expect(service.findAll).not.toHaveBeenCalled();
  });

  it('rejects invalid pricing enum list filters before calling the service', () => {
    const { controller, service } = makeController();

    expect(() => controller.findAll(undefined, undefined, undefined, undefined, 'urgent')).toThrow('pricing_delta_severity');
    expect(() => controller.findAll(undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'unknown')).toThrow('pricing_unverified_reason');
    expect(() => controller.findAll(undefined, undefined, undefined, undefined, { severity: 'critical' } as any)).toThrow('pricing_delta_severity');

    expect(service.findAll).not.toHaveBeenCalled();
  });

  it('normalizes status updates before passing them to the service', async () => {
    const { controller, service } = makeController();

    await controller.updateStatus(' inq-1 ', ' REVIEWING ' as InquiryStatus, ' note\r\n\tok\u0007 ');

    expect(service.updateStatus).toHaveBeenCalledWith('inq-1', InquiryStatus.REVIEWING, 'note ok');
  });

  it('omits blank status update notes before passing them to the service', async () => {
    const { controller, service } = makeController();

    await controller.updateStatus('inq-1', 'REVIEWING' as InquiryStatus, ' \r\n\t ');

    expect(service.updateStatus).toHaveBeenCalledWith('inq-1', InquiryStatus.REVIEWING, undefined);
  });

  it('rejects invalid status updates before calling the service', () => {
    const { controller, service } = makeController();

    expect(() => controller.updateStatus('inq-1', 'archived' as InquiryStatus, 'note')).toThrow('төлөв');
    expect(() => controller.updateStatus('inq-1', { status: 'reviewing' } as any, 'note')).toThrow('төлөв');

    expect(service.updateStatus).not.toHaveBeenCalled();
  });

  it('normalizes admin assignment ids before passing them to the service', async () => {
    const { controller, service } = makeController();

    await controller.assign(' inq-1 ', ' admin-1 ');

    expect(service.assign).toHaveBeenCalledWith('inq-1', 'admin-1');
  });

  it('rejects unsafe inquiry route ids before admin actions reach the service', () => {
    const { controller, service } = makeController();

    expect(() => controller.assign('../inq-1', 'admin-1')).toThrow('id');
    expect(() => controller.updateStatus('inq\n1', 'REVIEWING' as InquiryStatus, 'note')).toThrow('id');
    expect(() => controller.sendQuote('bad/inq-1', 107982, 'auto')).toThrow('id');
    expect(() => controller.assignVendor('bad\\inq-1', 'vendor-1', 'note')).toThrow('id');
    expect(() => controller.broadcast('../inq-1', ['vendor-1'])).toThrow('id');

    expect(service.assign).not.toHaveBeenCalled();
    expect(service.updateStatus).not.toHaveBeenCalled();
    expect(service.sendQuote).not.toHaveBeenCalled();
    expect(service.assignVendor).not.toHaveBeenCalled();
    expect(service.broadcastToVendors).not.toHaveBeenCalled();
  });

  it('rejects blank admin assignment ids before calling the service', () => {
    const { controller, service } = makeController();

    expect(() => controller.assign('inq-1', '   ')).toThrow('admin_id');

    expect(service.assign).not.toHaveBeenCalled();
  });

  it('rejects unsafe admin assignment ids before calling the service', () => {
    const { controller, service } = makeController();

    expect(() => controller.assign('inq-1', '../admin-1')).toThrow('admin_id');
    expect(() => controller.assign('inq-1', 'admin\n1')).toThrow('admin_id');
    expect(() => controller.assign('inq-1', { id: 'admin-1' } as any)).toThrow('admin_id');

    expect(service.assign).not.toHaveBeenCalled();
  });

  it('passes quote source to the service', async () => {
    const { controller, service } = makeController();

    await controller.sendQuote('inq-1', 107982, ' auto\r\n\tverified\u0007 ', 'auto_verified');

    expect(service.sendQuote).toHaveBeenCalledWith('inq-1', 107982, 'auto verified', 'auto_verified');
  });

  it('normalizes string quote prices before passing them to the service', async () => {
    const { controller, service } = makeController();

    await controller.sendQuote('inq-1', '107982.4' as any, 'auto', 'manual');

    expect(service.sendQuote).toHaveBeenCalledWith('inq-1', 107982, 'auto', 'manual');
  });

  it('normalizes quote source before passing it to the service', async () => {
    const { controller, service } = makeController();

    await controller.sendQuote('inq-1', 107982, 'auto', ' AUTO_VERIFIED ' as any);
    await controller.sendQuote('inq-2', 50000, 'manual');

    expect(service.sendQuote).toHaveBeenNthCalledWith(1, 'inq-1', 107982, 'auto', 'auto_verified');
    expect(service.sendQuote).toHaveBeenNthCalledWith(2, 'inq-2', 50000, 'manual', 'manual');
  });

  it('rejects invalid quote prices before calling the service', () => {
    const { controller, service } = makeController();

    expect(() => controller.sendQuote('inq-1', 'bad' as any, 'auto')).toThrow('Үнийн санал');
    expect(() => controller.sendQuote('inq-1', 0, 'auto')).toThrow('Үнийн санал');
    expect(() => controller.sendQuote('inq-1', 10_000_000_001, 'auto')).toThrow('Үнийн санал');
    expect(() => controller.sendQuote('inq-1', [107982] as any, 'auto')).toThrow('Үнийн санал');
    expect(() => controller.sendQuote('inq-1', { value: 107982 } as any, 'auto')).toThrow('Үнийн санал');

    expect(service.sendQuote).not.toHaveBeenCalled();
  });

  it('rejects invalid quote sources before calling the service', () => {
    const { controller, service } = makeController();

    expect(() => controller.sendQuote('inq-1', 107982, 'auto', 'imported' as any)).toThrow('эх сурвалж');
    expect(() => controller.sendQuote('inq-1', 107982, 'auto', { source: 'manual' } as any)).toThrow('эх сурвалж');

    expect(service.sendQuote).not.toHaveBeenCalled();
  });

  it('normalizes manual vendor assignment ids before passing them to the service', async () => {
    const { controller, service } = makeController();

    await controller.assignVendor(' inq-1 ', ' vendor-1 ', ' note\r\n\tok\u0007 ');

    expect(service.assignVendor).toHaveBeenCalledWith('inq-1', 'vendor-1', 'note ok');
  });

  it('rejects blank manual vendor assignment ids before calling the service', () => {
    const { controller, service } = makeController();

    expect(() => controller.assignVendor('inq-1', '   ', 'note')).toThrow('vendorId');

    expect(service.assignVendor).not.toHaveBeenCalled();
  });

  it('rejects unsafe manual vendor assignment ids before calling the service', () => {
    const { controller, service } = makeController();

    expect(() => controller.assignVendor('inq-1', '../vendor-1', 'note')).toThrow('vendorId');
    expect(() => controller.assignVendor('inq-1', 'vendor\n1', 'note')).toThrow('vendorId');
    expect(() => controller.assignVendor('inq-1', { id: 'vendor-1' } as any, 'note')).toThrow('vendorId');

    expect(service.assignVendor).not.toHaveBeenCalled();
  });

  it('normalizes reprice route ids before passing them to the service', async () => {
    const { controller, service } = makeController();

    await controller.reprice(' inq-1 ');

    expect(service.reprice).toHaveBeenCalledWith('inq-1');
  });

  it('rejects unsafe reprice route ids before calling the service', () => {
    const { controller, service } = makeController();

    expect(() => controller.reprice('../inq-1')).toThrow('id');
    expect(() => controller.reprice('inq\n1')).toThrow('id');

    expect(service.reprice).not.toHaveBeenCalled();
  });

  it('forces SLA reassignment only when an inquiry has an assigned vendor', async () => {
    const { controller, service } = makeController();

    await controller.forceReassign(' inq-1 ');

    expect(service.checkSLATimeout).toHaveBeenCalledWith('inq-1', 'vendor-1');
  });

  it('rejects unsafe inquiry route ids before force reassignment reaches the service', async () => {
    const { controller, service } = makeController();

    await expect(controller.forceReassign('../inq-1')).rejects.toThrow('id');

    expect(service.findOne).not.toHaveBeenCalled();
    expect(service.checkSLATimeout).not.toHaveBeenCalled();
  });

  it('passes non-empty vendor id lists to broadcast workflow', async () => {
    const { controller, service } = makeController();

    await controller.broadcast(' inq-1 ', [' vendor-1 ', 'vendor-2 ']);

    expect(service.broadcastToVendors).toHaveBeenCalledWith('inq-1', ['vendor-1', 'vendor-2']);
  });

  it('deduplicates broadcast vendor id lists before calling the service', async () => {
    const { controller, service } = makeController();

    await controller.broadcast('inq-1', [' vendor-1 ', 'vendor-1', 'vendor-2', ' vendor-2 ']);

    expect(service.broadcastToVendors).toHaveBeenCalledWith('inq-1', ['vendor-1', 'vendor-2']);
  });

  it('rejects broadcast requests with missing or empty vendor id lists', () => {
    const { controller, service } = makeController();

    expect(() => controller.broadcast('inq-1', undefined as any)).toThrow('vendorIds');
    expect(() => controller.broadcast('inq-1', [])).toThrow('vendorIds');

    expect(service.broadcastToVendors).not.toHaveBeenCalled();
  });

  it('rejects broadcast requests with more than 50 vendor ids', () => {
    const { controller, service } = makeController();

    expect(() => controller.broadcast('inq-1', Array.from({ length: 51 }, (_, i) => `vendor-${i}`))).toThrow('50');

    expect(service.broadcastToVendors).not.toHaveBeenCalled();
  });

  it('rejects broadcast requests without any non-empty vendor id strings', () => {
    const { controller, service } = makeController();

    expect(() => controller.broadcast('inq-1', [' ', '', null as any])).toThrow('vendorIds');

    expect(service.broadcastToVendors).not.toHaveBeenCalled();
  });

  it('rejects unsafe broadcast vendor ids before calling the service', () => {
    const { controller, service } = makeController();

    expect(() => controller.broadcast('inq-1', ['vendor-1', '../vendor-2'])).toThrow('vendorIds');
    expect(() => controller.broadcast('inq-1', ['vendor-1', 'vendor\n2'])).toThrow('vendorIds');
    expect(() => controller.broadcast('inq-1', ['vendor-1', { id: 'vendor-2' } as any])).toThrow('vendorIds');

    expect(service.broadcastToVendors).not.toHaveBeenCalled();
  });

  it('does not force SLA reassignment for inquiries without an assigned vendor', async () => {
    const { controller, service } = makeController();
    service.findOne.mockResolvedValueOnce({ id: 'inq-1', vendor_id: null });

    await expect(controller.forceReassign('inq-1')).rejects.toThrow('Vendor');

    expect(service.checkSLATimeout).not.toHaveBeenCalled();
  });

  it('tracks public inquiry status through the direct tracking service', async () => {
    const { controller, service } = makeController();

    await controller.track(' inq-123 ');

    expect(service.trackByNumber).toHaveBeenCalledWith('INQ-123');
    expect(service.findAll).not.toHaveBeenCalled();
  });

  it('rejects unsafe tracking numbers before calling the service', async () => {
    const { controller, service } = makeController();

    await expect(controller.track('inq/123')).rejects.toThrow('tracking_number');
    await expect(controller.track('inq\n123')).rejects.toThrow('tracking_number');
    await expect(controller.track('x'.repeat(81))).rejects.toThrow('tracking_number');
    await expect(controller.track({ number: 'INQ-123' } as any)).rejects.toThrow('tracking_number');

    expect(service.trackByNumber).not.toHaveBeenCalled();
  });

  it('passes authenticated user ids to customer and vendor list endpoints', async () => {
    const { controller, service } = makeController();

    await controller.getMy({ user: { id: ' customer-1 ' } });
    await controller.vendorPendingCount({ user: { id: ' vendor-user-1 ' } });
    await controller.vendorInquiries({ user: { id: ' vendor-user-1 ' } });

    expect(service.findByCustomer).toHaveBeenCalledWith('customer-1');
    expect(service.getVendorPendingCount).toHaveBeenCalledWith('vendor-user-1');
    expect(service.findForVendor).toHaveBeenCalledWith('vendor-user-1');
  });

  it('rejects customer and vendor list endpoints without a request user id', async () => {
    const { controller, service } = makeController();

    expect(() => controller.getMy({})).toThrow('Нэвтэрсэн');
    await expect(controller.vendorPendingCount({ user: {} })).rejects.toThrow('Нэвтэрсэн');
    expect(() => controller.vendorInquiries({ user: {} })).toThrow('Нэвтэрсэн');

    expect(service.findByCustomer).not.toHaveBeenCalled();
    expect(service.getVendorPendingCount).not.toHaveBeenCalled();
    expect(service.findForVendor).not.toHaveBeenCalled();
  });

  it('rejects unsafe authenticated user ids for customer and vendor list endpoints', async () => {
    const { controller, service } = makeController();

    expect(() => controller.getMy({ user: { id: '../customer-1' } })).toThrow('user_id');
    await expect(controller.vendorPendingCount({ user: { id: 'vendor\r\n1' } })).rejects.toThrow('user_id');
    expect(() => controller.vendorInquiries({ user: { id: 'vendor/user-1' } })).toThrow('user_id');
    expect(() => controller.getMy({ user: { id: { value: 'customer-1' } } })).toThrow('user_id');

    expect(service.findByCustomer).not.toHaveBeenCalled();
    expect(service.getVendorPendingCount).not.toHaveBeenCalled();
    expect(service.findForVendor).not.toHaveBeenCalled();
  });

  it('passes optional user context when reading inquiry detail', async () => {
    const { controller, service } = makeController();

    await controller.findOne(' inq-1 ', { user: { id: ' customer-1 ', role: 'customer' } });

    expect(service.findOneForUser).toHaveBeenCalledWith('inq-1', { id: 'customer-1', role: 'customer' });
  });

  it('passes optional user context when reading inquiry messages', async () => {
    const { controller, service } = makeController();

    await controller.getMessages(' inq-1 ', { user: { id: ' customer-1 ', role: 'customer' } });

    expect(service.getMessagesForUser).toHaveBeenCalledWith('inq-1', { id: 'customer-1', role: 'customer' });
  });

  it('rejects unsafe inquiry route ids before reading detail or messages', async () => {
    const { controller, service } = makeController();

    expect(() => controller.findOne('../inq-1', {})).toThrow('id');
    expect(() => controller.getMessages('inq\n1', {})).toThrow('id');
    await expect(controller.sendMessage('bad/inq-1', { content: 'hello' }, [], {})).rejects.toThrow('id');

    expect(service.findOneForUser).not.toHaveBeenCalled();
    expect(service.getMessagesForUser).not.toHaveBeenCalled();
    expect(service.sendMessage).not.toHaveBeenCalled();
  });

  it('rejects unsafe optional user ids when reading inquiry detail and messages', async () => {
    const { controller, service } = makeController();

    expect(() => controller.findOne('inq-1', { user: { id: '../customer-1' } })).toThrow('user_id');
    expect(() => controller.getMessages('inq-1', { user: { id: 'customer\n1' } })).toThrow('user_id');

    expect(service.findOneForUser).not.toHaveBeenCalled();
    expect(service.getMessagesForUser).not.toHaveBeenCalled();
  });

  it('passes user context and vendor sender role when sending inquiry messages', async () => {
    const { controller, service } = makeController();

    await controller.sendMessage(
      'inq-1',
      { content: ' hello\r\n\tworld\u0007 ' },
      [],
      { user: { id: ' vendor-user-1 ', role: 'vendor', name: 'Good Print' } },
    );

    expect(service.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      inquiryId: 'inq-1',
      senderId: 'vendor-user-1',
      senderName: 'Good Print',
      senderRole: 'vendor',
      content: 'hello world',
      attachments: [],
    }), { id: 'vendor-user-1', role: 'vendor', name: 'Good Print' });
  });

  it('drops non-scalar inquiry message content before calling the service', async () => {
    const { controller, service } = makeController();

    await controller.sendMessage(
      'inq-1',
      { content: { text: 'hello' } },
      [],
      {},
    );

    expect(service.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      content: '',
      attachments: [],
    }), undefined);
  });

  it('normalizes non-object inquiry message bodies and non-array attachment lists', async () => {
    const { controller, service } = makeController();

    await controller.sendMessage('inq-1', null as any, { length: 1 } as any, {});
    await controller.sendMessage('inq-1', ['bad'] as any, 'bad-files' as any, {});

    expect(service.sendMessage).toHaveBeenNthCalledWith(1, expect.objectContaining({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Харилцагч',
      senderRole: 'customer',
      content: '',
      attachments: [],
    }), undefined);
    expect(service.sendMessage).toHaveBeenNthCalledWith(2, expect.objectContaining({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Харилцагч',
      senderRole: 'customer',
      content: '',
      attachments: [],
    }), undefined);
  });

  it('drops malformed uploaded message attachment entries before calling the service', async () => {
    const { controller, service } = makeController();

    await controller.sendMessage('inq-1', { content: '' }, [
      null,
      'bad',
      {
        originalname: 'proof.pdf',
        filename: 'stored proof.pdf',
        size: 123,
      },
    ] as any, {});

    expect(service.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [expect.objectContaining({
        name: 'proof.pdf',
        url: '/api/uploads/inquiries/stored%20proof.pdf',
      })],
    }), undefined);
  });

  it('rejects overlong inquiry message content before calling the service', async () => {
    const { controller, service } = makeController();

    await expect(controller.sendMessage(
      'inq-1',
      { content: 'x'.repeat(5001) },
      [],
      {},
    )).rejects.toThrow('Мессеж');

    expect(service.sendMessage).not.toHaveBeenCalled();
  });

  it('rejects unsafe authenticated sender ids when sending inquiry messages', async () => {
    const { controller, service } = makeController();

    await expect(controller.sendMessage(
      'inq-1',
      { content: 'hello' },
      [],
      { user: { id: '../vendor-user-1', role: 'vendor', name: 'Good Print' } },
    )).rejects.toThrow('user_id');

    expect(service.sendMessage).not.toHaveBeenCalled();
  });

  it('sanitizes uploaded inquiry message attachment display names', async () => {
    const { controller, service } = makeController();

    await controller.sendMessage(
      'inq-1',
      { content: 'hello' },
      [{
        originalname: 'folder\\bad:name.pdf',
        mimetype: 'text/html',
        filename: 'stored.pdf',
      } as any],
      {},
    );

    expect(service.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [expect.objectContaining({
        name: 'bad_name.pdf',
        type: 'application/pdf',
        url: '/api/uploads/inquiries/stored.pdf',
      })],
    }), undefined);
  });

  it('falls back for non-scalar uploaded message attachment display names', async () => {
    const { controller, service } = makeController();

    await controller.sendMessage(
      'inq-1',
      { content: 'hello' },
      [{
        originalname: ['design.pdf'],
        mimetype: 'application/pdf',
        filename: 'stored.pdf',
      } as any],
      {},
    );

    expect(service.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [expect.objectContaining({
        name: 'file',
        url: '/api/uploads/inquiries/stored.pdf',
      })],
    }), undefined);
  });

  it('sanitizes uploaded inquiry message attachment URLs before persisting metadata', async () => {
    const { controller, service } = makeController();

    await controller.sendMessage(
      'inq-1',
      { content: 'hello' },
      [{
        originalname: 'design.pdf',
        mimetype: 'application/pdf',
        filename: '../unsafe folder/stored file.pdf\r\n',
      } as any],
      {},
    );

    expect(service.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [expect.objectContaining({
        url: '/api/uploads/inquiries/stored%20file.pdf',
      })],
    }), undefined);
  });

  it('falls back to the original extension for unsafe message attachment stored filenames', async () => {
    const { controller, service } = makeController();

    await controller.sendMessage(
      'inq-1',
      { content: 'hello' },
      [{
        originalname: 'design.pdf',
        mimetype: 'application/pdf',
        filename: 'stored.exe',
      } as any],
      {},
    );

    expect(service.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [expect.objectContaining({
        url: '/api/uploads/inquiries/stored.pdf',
      })],
    }), undefined);
  });

  it('strips control characters from uploaded message attachment URLs', async () => {
    const { controller, service } = makeController();

    await controller.sendMessage(
      'inq-1',
      { content: 'hello' },
      [{
        originalname: 'design.pdf',
        mimetype: 'application/pdf',
        filename: 'bad\u0007name?.exe',
      } as any],
      {},
    );

    expect(service.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [expect.objectContaining({
        url: '/api/uploads/inquiries/badname_.pdf',
      })],
    }), undefined);
  });

  it('falls back for non-scalar stored message attachment filenames', async () => {
    const { controller, service } = makeController();

    await controller.sendMessage(
      'inq-1',
      { content: 'hello' },
      [{
        originalname: 'design.pdf',
        mimetype: 'text/html',
        filename: { stored: 'stored.pdf' },
      } as any],
      {},
    );

    expect(service.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [expect.objectContaining({
        type: 'application/pdf',
        url: '/api/uploads/inquiries/file.pdf',
      })],
    }), undefined);
  });

  it('rejects inquiry messages with more than three attachments before calling the service', async () => {
    const { controller, service } = makeController();
    const files = Array.from({ length: 4 }, (_, i) => ({
      originalname: `design-${i}.pdf`,
      mimetype: 'application/pdf',
      filename: `design-${i}.pdf`,
    })) as any[];

    await expect(controller.sendMessage('inq-1', { content: 'hello' }, files, {})).rejects.toThrow('Хавсралтын тоо');

    expect(service.sendMessage).not.toHaveBeenCalled();
  });

  it('ignores body sender name for authenticated inquiry messages', async () => {
    const { controller, service } = makeController();

    await controller.sendMessage(
      'inq-1',
      { content: 'hello', sender_name: 'Fake Admin' },
      [],
      { user: { id: 'vendor-user-1', role: 'vendor', name: 'Good Print' } },
    );

    expect(service.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      senderName: 'Good Print',
      senderRole: 'vendor',
    }), expect.any(Object));
  });

  it('sanitizes authenticated inquiry message sender names', async () => {
    const { controller, service } = makeController();

    await controller.sendMessage(
      'inq-1',
      { content: 'hello' },
      [],
      { user: { id: 'vendor-user-1', role: 'vendor', name: ' Good\r\n\tPrint\u0007/Bad ' } },
    );

    expect(service.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      senderName: 'Good Print_Bad',
      senderRole: 'vendor',
    }), expect.any(Object));
  });

  it('falls back for non-scalar authenticated inquiry message sender names', async () => {
    const { controller, service } = makeController();

    await controller.sendMessage(
      'inq-1',
      { content: 'hello' },
      [],
      { user: { id: 'vendor-user-1', role: 'vendor', name: { display: 'Good Print' } } },
    );

    expect(service.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      senderName: 'Харилцагч',
      senderRole: 'vendor',
    }), expect.any(Object));
  });

  it('sanitizes guest inquiry message sender names', async () => {
    const { controller, service } = makeController();

    await controller.sendMessage(
      'inq-1',
      { content: 'hello', sender_name: ' Guest\r\n\tName\0\u0007/Bad ' },
      [],
      {},
    );

    expect(service.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      senderId: 'guest',
      senderName: 'Guest Name_Bad',
      senderRole: 'customer',
    }), undefined);
  });

  it('falls back for non-scalar guest inquiry message sender names', async () => {
    const { controller, service } = makeController();

    await controller.sendMessage(
      'inq-1',
      { content: 'hello', sender_name: ['Guest'] },
      [],
      {},
    );

    expect(service.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      senderId: 'guest',
      senderName: 'Харилцагч',
      senderRole: 'customer',
    }), undefined);
  });

  it('limits guest sender name length for inquiry messages', async () => {
    const { controller, service } = makeController();

    await controller.sendMessage(
      'inq-1',
      { content: 'hello', sender_name: ` ${'x'.repeat(120)} ` },
      [],
      {},
    );

    expect(service.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      senderId: 'guest',
      senderName: 'x'.repeat(80),
      senderRole: 'customer',
    }), undefined);
  });

  it('passes user context when marking inquiry messages as read', async () => {
    const { controller, service } = makeController();

    await controller.markRead('inq-1', { user: { id: ' customer-1 ', role: 'customer' } });

    expect(service.markReadForUser).toHaveBeenCalledWith('inq-1', { id: 'customer-1', role: 'customer' });
  });

  it('rejects mark-read requests without a request user id', async () => {
    const { controller, service } = makeController();

    expect(() => controller.markRead('inq-1', {})).toThrow('Нэвтэрсэн');

    expect(service.markReadForUser).not.toHaveBeenCalled();
  });

  it('rejects unsafe authenticated user ids when marking messages as read', async () => {
    const { controller, service } = makeController();

    expect(() => controller.markRead('inq-1', { user: { id: '../customer-1' } })).toThrow('user_id');

    expect(service.markReadForUser).not.toHaveBeenCalled();
  });

  it('passes authenticated vendor user ids to accept and reject workflows', async () => {
    const { controller, service } = makeController();

    await controller.vendorAccept(' inq-1 ', { user: { id: ' vendor-user-1 ' } });
    await controller.vendorReject(' inq-1 ', { user: { id: ' vendor-user-1 ' } });

    expect(service.vendorAccept).toHaveBeenCalledWith('inq-1', 'vendor-user-1');
    expect(service.vendorReject).toHaveBeenCalledWith('inq-1', 'vendor-user-1');
  });

  it('rejects unsafe inquiry route ids before vendor workflows reach the service', () => {
    const { controller, service } = makeController();

    expect(() => controller.vendorAccept('../inq-1', { user: { id: 'vendor-user-1' } })).toThrow('id');
    expect(() => controller.vendorReject('inq\n1', { user: { id: 'vendor-user-1' } })).toThrow('id');

    expect(service.vendorAccept).not.toHaveBeenCalled();
    expect(service.vendorReject).not.toHaveBeenCalled();
  });

  it('rejects vendor workflow requests without a request user id', async () => {
    const { controller, service } = makeController();

    expect(() => controller.vendorAccept('inq-1', {})).toThrow('Нэвтэрсэн');
    expect(() => controller.vendorReject('inq-1', { user: {} })).toThrow('Нэвтэрсэн');

    expect(service.vendorAccept).not.toHaveBeenCalled();
    expect(service.vendorReject).not.toHaveBeenCalled();
  });

  it('rejects unsafe authenticated vendor workflow user ids', async () => {
    const { controller, service } = makeController();

    expect(() => controller.vendorAccept('inq-1', { user: { id: '../vendor-1' } })).toThrow('user_id');
    expect(() => controller.vendorReject('inq-1', { user: { id: 'vendor\n1' } })).toThrow('user_id');
    expect(() => controller.vendorAccept('inq-1', { user: { id: { value: 'vendor-1' } } })).toThrow('user_id');

    expect(service.vendorAccept).not.toHaveBeenCalled();
    expect(service.vendorReject).not.toHaveBeenCalled();
  });
});
