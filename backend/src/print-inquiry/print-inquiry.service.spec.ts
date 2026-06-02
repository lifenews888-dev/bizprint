import { PrintInquiryService } from './print-inquiry.service';
import { InquiryStatus } from './entities/print-inquiry.entity';

describe('PrintInquiryService pricing verification', () => {
  function makeService(options: { vendors?: any[] } = {}) {
    const savedItems: any[] = [];
    const qbs: any[] = [];
    let inquiryToFind: any = null;
    const makeQb = () => {
      const count = qbs.length + 1;
      const next = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn(async () => []),
        getCount: jest.fn(async () => count),
        getOne: jest.fn(async () => null),
      };
      qbs.push(next);
      return next;
    };
    const repo = {
      create: jest.fn((dto: any) => dto),
      save: jest.fn(async (dto: any) => {
        savedItems.push(dto);
        return { ...dto, id: 'inq-1' };
      }),
      createQueryBuilder: jest.fn(() => makeQb()),
      count: jest.fn(async () => 0),
      find: jest.fn(async () => []),
      findOne: jest.fn(async () => inquiryToFind),
      update: jest.fn(async () => ({ affected: 1 })),
    };
    const chatRepo = {
      create: jest.fn((dto: any) => dto),
      save: jest.fn(async (dto: any) => dto),
      find: jest.fn(async () => []),
      update: jest.fn(async () => ({ affected: 1 })),
      createQueryBuilder: jest.fn(() => makeQb()),
      count: jest.fn(async () => 0),
    };
    const vendorRepo = {
      createQueryBuilder: jest.fn(() => {
        let excludeIds: string[] = [];
        const qb = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn((_sql?: string, params?: any) => {
            if (Array.isArray(params?.excludeIds)) excludeIds = params.excludeIds;
            return qb;
          }),
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          getMany: jest.fn(async () => (options.vendors || []).filter((v: any) => !excludeIds.includes(v.id))),
        };
        return qb;
      }),
      findOne: jest.fn(async ({ where }: any) => (options.vendors || []).find((v: any) => v.id === where?.id || v.user_id === where?.user_id) || null),
    };
    const eventEmitter = { emit: jest.fn() };
    const notificationsGateway = {
      notifyAdmins: jest.fn(),
      notifyAdminNewInquiry: jest.fn(),
      notifyVendorNewInquiry: jest.fn(),
    };
    const commissionService = {
      create: jest.fn(async (dto: any) => dto),
    };
    const mailService = {
      sendVendorNewInquiry: jest.fn(async () => undefined),
      sendAdminNewInquiry: jest.fn(async () => undefined),
    };
    const quoteEngine = {
      calculateWide: jest.fn(async () => ({
        total_price: 107982,
        unit_price: 107982,
        breakdown: {
          material: 18700,
          print: 26000,
          finishing: 18000,
          setup: 5000,
          rush: 0,
          vat: 9817,
        },
        material_key: 'vinyl_440',
        material_name: 'Vinyl 440gsm',
        area_m2: 2,
        billable_area_m2: 2,
        material_rate_m2: 8500,
        print_rate_m2: 6500,
        waste_pct: 10,
      })),
    };

    const service = new PrintInquiryService(
      repo as any,
      chatRepo as any,
      vendorRepo as any,
      eventEmitter as any,
      commissionService as any,
      mailService as any,
      notificationsGateway as any,
      quoteEngine as any,
    );
    jest.spyOn(service as any, 'scheduleSLATimeout').mockImplementation(() => undefined);

    return {
      service,
      repo,
      chatRepo,
      vendorRepo,
      quoteEngine,
      notificationsGateway,
      commissionService,
      mailService,
      savedItems,
      qbs,
      setInquiryToFind: (inquiry: any) => { inquiryToFind = inquiry; },
    };
  }

  it('overrides client-provided wide-format price with server quote-engine result', async () => {
    const { service, repo, quoteEngine, savedItems } = makeService();

    const saved = await service.create({
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: 'Vinyl   440gsm',
      sides: 'double',
      finishing: ['Гантиг гагнуур', 'Оосор нэмэх'],
      estimated_price: 1,
      size_label: ' 1000x2000\r\n   mm ',
      color_mode: ' CMYK   full ',
      pricing_snapshot: {
        source: 'fallback',
        total: 1,
      },
    });

    expect(quoteEngine.calculateWide).toHaveBeenCalledWith(expect.objectContaining({
      type: 'banner',
      width: 1,
      length: 2,
      quantity: 1,
      material: 'Vinyl 440gsm',
      sides: 'double',
      pricing_mode: 'retail',
    }));
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(savedItems[0].estimated_price).toBe(107982);
    expect(savedItems[0].pricing_snapshot).toMatchObject({
      source: 'server',
      verifiedBy: 'backend',
      pricingContractVersion: 'pricing-golden-v1',
      pricingEngine: 'quote-engine.calculateWide',
      pricingTrigger: 'create',
      clientSnapshot: {
        source: 'fallback',
        total: 1,
      },
      clientTotal: 1,
      serverDelta: 107981,
      serverDeltaPct: 10798100,
      serverDeltaSeverity: 'critical',
      total: 107982,
      unitPrice: 107982,
      serverResult: {
        materialKey: 'vinyl_440',
        materialRateM2: 8500,
        printRateM2: 6500,
        wastePct: 10,
      },
      spec: expect.objectContaining({
        sizeLabel: '1000x2000 mm',
        colorMode: 'CMYK full',
      }),
    });
    expect(saved.status).toBe(InquiryStatus.NEW);
  });

  it('uses client snapshot backendTotal when auditing submitted server-priced inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: 'Vinyl 440gsm',
      sides: 'double',
      finishing: ['Гантиг гагнуур', 'Оосор нэмэх'],
      estimated_price: 1,
      pricing_snapshot: {
        source: 'server',
        total: 1,
        meta: { backendTotal: 107982 },
      },
    });

    expect(savedItems[0].estimated_price).toBe(107982);
    expect(savedItems[0].pricing_snapshot).toMatchObject({
      source: 'server',
      verifiedBy: 'backend',
      clientTotal: 107982,
      serverDelta: 0,
      serverDeltaPct: 0,
      serverDeltaSeverity: 'none',
      total: 107982,
    });
  });

  it('overwrites client pricing contract metadata with backend verification metadata', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: 'Vinyl 440gsm',
      pricing_snapshot: {
        source: 'client',
        total: 107982,
        verifiedBy: 'client',
        pricingContractVersion: 'client-draft',
        pricingEngine: 'frontend-fallback',
      },
    });

    expect(savedItems[0].pricing_snapshot).toMatchObject({
      source: 'server',
      verifiedBy: 'backend',
      pricingContractVersion: 'pricing-golden-v1',
      pricingEngine: 'quote-engine.calculateWide',
      pricingTrigger: 'create',
      clientSnapshot: expect.objectContaining({
        pricingContractVersion: 'client-draft',
        pricingEngine: 'frontend-fallback',
      }),
    });
  });

  it('does not coerce non-scalar client pricing totals when auditing server-priced inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: 'Vinyl 440gsm',
      sides: 'double',
      estimated_price: { value: 107982 } as any,
      pricing_snapshot: {
        source: 'server',
        total: [107982],
        meta: { backendTotal: { value: 107982 } },
      } as any,
    });

    expect(savedItems[0].pricing_snapshot).toMatchObject({
      clientTotal: 0,
      serverDelta: 107982,
      serverDeltaPct: null,
      serverDeltaSeverity: 'minor',
      total: 107982,
    });
  });

  it('does not coerce non-scalar persisted estimates when auditing manual reprice', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      status: InquiryStatus.REVIEWING,
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: 'Vinyl 440gsm',
      sides: 'double',
      estimated_price: [107982],
      pricing_snapshot: null,
    });

    await service.reprice(id);

    expect(repo.update).toHaveBeenCalledWith(id, expect.objectContaining({
      pricing_snapshot: expect.objectContaining({
        clientTotal: 0,
        serverDelta: 107982,
        serverDeltaPct: null,
      }),
    }));
  });

  it('stores scalar-only product and spec fields in backend pricing snapshots', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'banner',
      product_name: { name: 'Banner' } as any,
      quantity: 1,
      size_label: { label: '1000x2000' } as any,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: 'Vinyl 440gsm',
      color_mode: ['CMYK'] as any,
      sides: { value: 'double' } as any,
      estimated_price: 50000,
    });

    expect(savedItems[0].pricing_snapshot).toMatchObject({
      product: {
        name: '',
        category: 'banner',
      },
      spec: expect.objectContaining({
        sizeLabel: '',
        colorMode: '',
        sides: 'single',
      }),
    });
  });

  it('normalizes non-scalar quote engine result metrics before storing pricing snapshots', async () => {
    const { service, quoteEngine, savedItems } = makeService();
    quoteEngine.calculateWide.mockResolvedValueOnce({
      total_price: '107982',
      unit_price: ['107982'],
      breakdown: {
        material: ['18700'],
        print: '26000',
        finishing: { value: 18000 },
        setup: -5000,
        rush: '0',
        vat: '9817',
      },
      material_key: { key: 'vinyl_440' },
      material_name: ' Vinyl\r\n440gsm\u0007 ',
      area_m2: { value: 2 },
      billable_area_m2: '2',
      material_rate_m2: [8500],
      print_rate_m2: '6500',
      waste_pct: -10,
      side_multiplier: '2',
    } as any);

    await service.create({
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: 'Vinyl 440gsm',
      estimated_price: 50000,
    });

    expect(savedItems[0].estimated_price).toBe(107982);
    expect(savedItems[0].pricing_snapshot).toMatchObject({
      total: 107982,
      unitPrice: 0,
      breakdown: {
        material: null,
        print: 26000,
        finishing: null,
        setup: null,
        rush: 0,
        vat: 9817,
      },
      serverResult: {
        materialKey: null,
        materialName: 'Vinyl 440gsm',
        areaM2: null,
        billableAreaM2: 2,
        materialRateM2: null,
        printRateM2: 6500,
        wastePct: null,
        sideMultiplier: 2,
      },
    });
  });

  it('keeps existing pricing when quote engine returns an invalid total', async () => {
    const { service, quoteEngine, savedItems } = makeService();
    quoteEngine.calculateWide.mockResolvedValueOnce({
      total_price: { value: 107982 },
      unit_price: 107982,
      breakdown: {},
    } as any);

    await service.create({
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: 'Vinyl 440gsm',
      estimated_price: 50000,
      pricing_snapshot: { source: 'fallback', total: 50000 },
    });

    expect(savedItems[0]).toMatchObject({
      estimated_price: 50000,
      pricing_snapshot: { source: 'fallback', total: 50000 },
    });
  });

  it('does not call wide quote engine for non-wide inquiries', async () => {
    const { service, quoteEngine, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      quantity: 100,
      width_mm: 90,
      height_mm: 54,
      estimated_price: 50000,
    });

    expect(quoteEngine.calculateWide).not.toHaveBeenCalled();
    expect(savedItems[0].estimated_price).toBe(50000);
  });

  it('normalizes customer ids before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      customer_id: ' customer-1 ',
      category: 'business-card',
      product_name: 'Business card',
    });

    expect(savedItems[0].customer_id).toBe('customer-1');
  });

  it('rejects unsafe customer ids before saving created inquiries', async () => {
    const { service, repo } = makeService();

    await expect(service.create({
      customer_id: '../customer-1',
      category: 'business-card',
      product_name: 'Business card',
    })).rejects.toThrow('ID');
    await expect(service.create({
      customer_id: [] as any,
      category: 'business-card',
      product_name: 'Business card',
    })).rejects.toThrow('ID');

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('sanitizes inquiry file metadata before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      files: [
        {
          name: '../bad"name\r\n.pdf',
          size: 999999999,
          type: 'text/html',
          url: '/api/uploads/inquiries/stored file.pdf',
          uploaded_at: 'bad-date',
          extra: '<script>',
        },
        {
          name: 'evil.pdf',
          size: 10,
          type: 'application/pdf',
          url: 'https://evil.test/evil.pdf',
        },
        {
          name: 'bad.exe',
          size: 10,
          type: 'application/octet-stream',
          url: '/api/uploads/inquiries/bad.exe',
        },
      ] as any,
    });

    expect(savedItems[0].files).toHaveLength(1);
    expect(savedItems[0].files[0]).toMatchObject({
      name: '.._bad_name  .pdf',
      size: 50 * 1024 * 1024,
      type: 'application/octet-stream',
      url: '/api/uploads/inquiries/stored%20file.pdf',
    });
    expect(savedItems[0].files[0]).not.toHaveProperty('extra');
    expect(Date.parse(savedItems[0].files[0].uploaded_at)).not.toBeNaN();
  });

  it('strips non-whitespace control characters from created inquiry file names', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      files: [{
        name: 'bad\u0007name\u001F/design.pdf',
        size: 12,
        type: 'application/pdf',
        url: '/api/uploads/inquiries/stored.pdf',
      }] as any,
    });

    expect(savedItems[0].files).toHaveLength(1);
    expect(savedItems[0].files[0]).toMatchObject({
      name: 'badname_design.pdf',
      url: '/api/uploads/inquiries/stored.pdf',
    });
  });

  it('defaults non-scalar created inquiry file names before saving', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      files: [{
        name: { value: 'design.pdf' },
        size: 12,
        type: 'application/pdf',
        url: '/api/uploads/inquiries/stored.pdf',
      }] as any,
    });

    expect(savedItems[0].files).toHaveLength(1);
    expect(savedItems[0].files[0]).toMatchObject({
      name: 'file',
      url: '/api/uploads/inquiries/stored.pdf',
    });
  });

  it('defaults non-scalar created inquiry file MIME types before saving', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      files: [{
        name: 'stored.pdf',
        size: 12,
        type: { value: 'application/pdf' },
        url: '/api/uploads/inquiries/stored.pdf',
      }] as any,
    });

    expect(savedItems[0].files).toHaveLength(1);
    expect(savedItems[0].files[0]).toMatchObject({
      type: 'application/octet-stream',
      url: '/api/uploads/inquiries/stored.pdf',
    });
  });

  it('defaults non-scalar created inquiry file sizes before saving', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      files: [{
        name: 'stored.pdf',
        size: ['12'],
        type: 'application/pdf',
        url: '/api/uploads/inquiries/stored.pdf',
      }] as any,
    });

    expect(savedItems[0].files).toHaveLength(1);
    expect(savedItems[0].files[0]).toMatchObject({
      size: 0,
      url: '/api/uploads/inquiries/stored.pdf',
    });
  });

  it('defaults non-scalar created inquiry file timestamps before saving', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      files: [{
        name: 'stored.pdf',
        size: 12,
        type: 'application/pdf',
        url: '/api/uploads/inquiries/stored.pdf',
        uploaded_at: { value: '2026-01-01T00:00:00.000Z' },
      }] as any,
    });

    expect(savedItems[0].files).toHaveLength(1);
    expect(Date.parse(savedItems[0].files[0].uploaded_at)).not.toBeNaN();
    expect(savedItems[0].files[0].uploaded_at).not.toBe('2026-01-01T00:00:00.000Z');
  });

  it('rejects created inquiries with more than five files before saving', async () => {
    const { service, repo } = makeService();

    await expect(service.create({
      category: 'business-card',
      product_name: 'Business card',
      files: Array.from({ length: 6 }, (_, i) => ({
        name: `design-${i}.pdf`,
        size: 12,
        type: 'application/pdf',
        url: `/api/uploads/inquiries/design-${i}.pdf`,
      })),
    } as any)).rejects.toThrow('Файлын тоо');

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('drops created inquiry file metadata with oversized URLs', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      files: [{
        name: 'stored.pdf',
        size: 12,
        type: 'application/pdf',
        url: `/api/uploads/inquiries/${'a'.repeat(280)}.pdf`,
      }] as any,
    });

    expect(savedItems[0].files).toEqual([]);
  });

  it('drops created inquiry file metadata with non-scalar URLs', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      files: [{
        name: 'stored.pdf',
        size: 12,
        type: 'application/pdf',
        url: { value: '/api/uploads/inquiries/stored.pdf' },
      }] as any,
    });

    expect(savedItems[0].files).toEqual([]);
  });

  it('drops created inquiry file metadata with reserved device URL filenames', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      files: [
        {
          name: 'CON.pdf',
          size: 12,
          type: 'application/pdf',
          url: '/api/uploads/inquiries/CON.pdf',
        },
        {
          name: 'NUL .zip',
          size: 12,
          type: 'application/zip',
          url: '/api/uploads/inquiries/NUL%20.zip',
        },
      ] as any,
    });

    expect(savedItems[0].files).toEqual([]);
  });

  it('drops created inquiry file metadata with unsafe path or control-character URLs', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      files: [
        {
          name: 'bad.pdf',
          size: 12,
          type: 'application/pdf',
          url: '/api/uploads/inquiries/../bad.pdf',
        },
        {
          name: 'bad.pdf',
          size: 12,
          type: 'application/pdf',
          url: '/api/uploads/inquiries/bad\u0007.pdf',
        },
      ] as any,
    });

    expect(savedItems[0].files).toEqual([]);
  });

  it('sanitizes pricing snapshots before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      pricing_snapshot: ['not-object'] as any,
    });
    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      pricing_snapshot: { blob: 'x'.repeat(21000) },
    });
    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      pricing_snapshot: { total: 120000, source: 'client' },
    });

    expect(savedItems[0].pricing_snapshot).toBeNull();
    expect(savedItems[1].pricing_snapshot).toBeNull();
    expect(savedItems[2].pricing_snapshot).toEqual({ total: 120000, source: 'client' });
  });

  it('drops pricing snapshots with unsafe prototype keys before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      pricing_snapshot: JSON.parse('{"total":120000,"meta":{"__proto__":{"polluted":true}}}'),
    });
    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      pricing_snapshot: JSON.parse('{"total":120000,"constructor":{"prototype":{"polluted":true}}}'),
    });

    expect(savedItems[0].pricing_snapshot).toBeNull();
    expect(savedItems[1].pricing_snapshot).toBeNull();
    expect(({} as any).polluted).toBeUndefined();
  });

  it('deduplicates and caps finishing values before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      finishing: [
        '  matte  ',
        'matte',
        'x'.repeat(150),
        '',
        ...Array.from({ length: 30 }, (_, i) => `finish-${i}`),
      ] as any,
    });

    expect(savedItems[0].finishing).toHaveLength(20);
    expect(savedItems[0].finishing[0]).toBe('matte');
    expect(savedItems[0].finishing[1]).toBe('x'.repeat(120));
    expect(savedItems[0].finishing.filter((item: string) => item === 'matte')).toHaveLength(1);
  });

  it('normalizes control characters in finishing values before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      finishing: [
        '  fold\r\n\tline  ',
        'fold line',
        '  crease   score  ',
        'cut\0\u0007edge',
      ] as any,
    });

    expect(savedItems[0].finishing).toEqual(['fold line', 'crease score', 'cutedge']);
  });

  it('drops non-scalar finishing values before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      finishing: ['Matte', null, { label: 'bad' }, ['nested'], 0, 123] as any,
    });

    expect(savedItems[0].finishing).toEqual(['Matte', '0', '123']);
  });

  it('normalizes numeric fields before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      quantity: '-5' as any,
      width_mm: 'not-a-number' as any,
      height_mm: '0' as any,
      estimated_price: '-1000' as any,
    });
    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      quantity: '999999999' as any,
      width_mm: '999999999' as any,
      height_mm: '999999999' as any,
      estimated_price: '99999999999999' as any,
    });

    expect(savedItems[0]).toMatchObject({
      quantity: 1,
      width_mm: null,
      height_mm: 1,
      estimated_price: 0,
    });
    expect(savedItems[1]).toMatchObject({
      quantity: 1000000,
      width_mm: 100000,
      height_mm: 100000,
      estimated_price: 10000000000,
    });
  });

  it('drops non-scalar numeric fields before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      quantity: [5] as any,
      width_mm: { value: 1000 } as any,
      height_mm: [2000] as any,
      estimated_price: { value: 100000 } as any,
    });

    expect(savedItems[0]).toMatchObject({
      quantity: null,
      width_mm: null,
      height_mm: null,
      estimated_price: null,
    });
  });

  it('trims and caps text fields before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      customer_name: ` ${'n'.repeat(300)} `,
      customer_phone: ` ${'9'.repeat(80)} `,
      customer_email: ` ${'e'.repeat(220)} `,
      product_name: ' ',
      category: ` ${'c'.repeat(200)} `,
      size_label: ` ${'s'.repeat(120)} `,
      color_mode: ` ${'m'.repeat(120)} `,
      notes: ` ${'x'.repeat(6000)} `,
      delivery_address: ` ${'a'.repeat(800)} `,
      delivery_district: ` ${'d'.repeat(200)} `,
    } as any);

    expect(savedItems[0]).toMatchObject({
      customer_name: 'n'.repeat(255),
      customer_phone: '9'.repeat(40),
      customer_email: null,
      product_name: null,
      category: 'c'.repeat(120),
      size_label: 's'.repeat(80),
      color_mode: 'm'.repeat(80),
      notes: 'x'.repeat(5000),
      delivery_address: 'a'.repeat(500),
      delivery_district: 'd'.repeat(120),
    });
  });

  it('normalizes control characters in text fields before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      customer_name: ' Test\r\n   User\0 ',
      customer_company: ' Biz\tPrint ',
      product_name: ' Banner\u0007Print ',
      notes: 'line1\r\n\t  line2\0',
      delivery_address: 'Apt\t1\r\nStreet',
      category: 'business-card',
    } as any);

    expect(savedItems[0]).toMatchObject({
      customer_name: 'Test User',
      customer_company: 'Biz Print',
      product_name: 'BannerPrint',
      notes: 'line1 line2',
      delivery_address: 'Apt 1 Street',
    });
  });

  it('drops non-scalar text fields before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      customer_name: { value: 'Test User' },
      product_name: ['Banner'],
      notes: { text: 'note' },
      category: 'business-card',
    } as any);

    expect(savedItems[0]).toMatchObject({
      customer_name: null,
      product_name: null,
      notes: null,
    });
  });

  it('normalizes category casing before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: ' Banner ',
      product_name: 'Banner',
    });

    expect(savedItems[0].category).toBe('banner');
  });

  it('normalizes valid customer emails before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      customer_email: ' Test@Example.COM ',
      category: 'business-card',
      product_name: 'Business card',
    });

    expect(savedItems[0].customer_email).toBe('test@example.com');
  });

  it('drops invalid customer emails before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      customer_email: 'bad-email\r\n@example',
      category: 'business-card',
      product_name: 'Business card',
    });
    await service.create({
      customer_email: 'bad\u0007@example.com',
      category: 'business-card',
      product_name: 'Business card',
    });

    expect(savedItems[0].customer_email).toBeNull();
    expect(savedItems[1].customer_email).toBeNull();
  });

  it('normalizes phone and viber numbers before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      customer_phone: '  +976\r\n9911-2233 ext<script>  ',
      viber_number: ' (976) 8811 2233 ',
      category: 'business-card',
      product_name: 'Business card',
    });

    expect(savedItems[0]).toMatchObject({
      customer_phone: '+976 9911-2233',
      viber_number: '(976) 8811 2233',
    });
  });

  it('drops phone fields without digits before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      customer_phone: 'abc<script>',
      viber_number: '---',
      category: 'business-card',
      product_name: 'Business card',
    });

    expect(savedItems[0]).toMatchObject({
      customer_phone: null,
      viber_number: null,
    });
  });

  it('drops non-scalar email and phone fields before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      customer_email: { value: 'test@example.com' },
      customer_phone: { value: '99112233' },
      viber_number: ['99112233'],
      category: 'business-card',
      product_name: 'Business card',
    } as any);

    expect(savedItems[0]).toMatchObject({
      customer_email: null,
      customer_phone: null,
      viber_number: null,
    });
  });

  it('normalizes product ids before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      product_id: ' product-1 ',
      category: 'business-card',
      product_name: 'Business card',
    });

    expect(savedItems[0].product_id).toBe('product-1');
  });

  it('rejects unsafe product ids before saving created inquiries', async () => {
    const { service, repo } = makeService();

    await expect(service.create({
      product_id: '../product-1',
      category: 'business-card',
      product_name: 'Business card',
    })).rejects.toThrow('ID');
    await expect(service.create({
      product_id: { id: 'product-1' } as any,
      category: 'business-card',
      product_name: 'Business card',
    })).rejects.toThrow('ID');
    await expect(service.create({
      product_id: [] as any,
      category: 'business-card',
      product_name: 'Business card',
    })).rejects.toThrow('ID');

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('normalizes contact, sides, and boolean fields before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      preferred_contact: 'sms' as any,
      sides: 'triple',
      has_design: 'yes' as any,
      needs_design: 1 as any,
    });
    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      preferred_contact: 'viber' as any,
      sides: '2-sided',
      has_design: 'true' as any,
      needs_design: true,
    });

    expect(savedItems[0]).toMatchObject({
      preferred_contact: 'chat',
      sides: 'single',
      has_design: true,
      needs_design: true,
    });
    expect(savedItems[1]).toMatchObject({
      preferred_contact: 'viber',
      sides: 'double',
      has_design: true,
      needs_design: true,
    });
  });

  it('treats non-scalar created inquiry boolean fields as false', async () => {
    const { service, savedItems } = makeService();

    await service.create({
      category: 'business-card',
      product_name: 'Business card',
      has_design: ['true'] as any,
      needs_design: { value: 'yes' } as any,
    });

    expect(savedItems[0]).toMatchObject({
      has_design: false,
      needs_design: false,
    });
  });

  it('normalizes common print side aliases before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({ product_name: 'Banner', sides: 'duplex' } as any);
    await service.create({ product_name: 'Banner', sides: 'single-sided' } as any);
    await service.create({ product_name: 'Banner', sides: { value: 'double' } } as any);

    expect(savedItems[0].sides).toBe('double');
    expect(savedItems[1].sides).toBe('single');
    expect(savedItems[2].sides).toBe('single');
  });

  it('normalizes common preferred contact aliases before saving created inquiries', async () => {
    const { service, savedItems } = makeService();

    await service.create({ product_name: 'Banner', preferred_contact: 'call' } as any);
    await service.create({ product_name: 'Banner', preferred_contact: 'e-mail' } as any);
    await service.create({ product_name: 'Banner', preferred_contact: 'messenger' } as any);
    await service.create({ product_name: 'Banner', preferred_contact: { method: 'phone' } } as any);

    expect(savedItems[0].preferred_contact).toBe('phone');
    expect(savedItems[1].preferred_contact).toBe('email');
    expect(savedItems[2].preferred_contact).toBe('chat');
    expect(savedItems[3].preferred_contact).toBe('chat');
  });

  it('keeps wide inquiry unverified when material is missing on create', async () => {
    const { service, quoteEngine, savedItems } = makeService();

    await service.create({
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: '',
      estimated_price: 50000,
      pricing_snapshot: { source: 'fallback', total: 50000 },
    });

    expect(quoteEngine.calculateWide).not.toHaveBeenCalled();
    expect(savedItems[0].estimated_price).toBe(50000);
    expect(savedItems[0].pricing_snapshot).toMatchObject({
      source: 'fallback',
      verifiedBy: 'backend',
      pricingContractVersion: 'pricing-golden-v1',
      pricingEngine: 'quote-engine.calculateWide',
      pricingTrigger: 'create',
      verificationError: 'missing_material',
    });
  });

  it('keeps wide inquiry unverified when material is non-scalar on create', async () => {
    const { service, quoteEngine, savedItems } = makeService();

    await service.create({
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: { name: 'Vinyl 440gsm' } as any,
      estimated_price: 50000,
      pricing_snapshot: { source: 'fallback', total: 50000 },
    });

    expect(quoteEngine.calculateWide).not.toHaveBeenCalled();
    expect(savedItems[0].pricing_snapshot).toMatchObject({
      verificationError: 'missing_material',
    });
  });

  it('keeps wide inquiry unverified when size is missing on create', async () => {
    const { service, quoteEngine, savedItems } = makeService();

    await service.create({
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 0,
      height_mm: null as any,
      paper_type: 'Vinyl 440gsm',
      estimated_price: 50000,
      pricing_snapshot: { source: 'fallback', total: 50000 },
    });

    expect(quoteEngine.calculateWide).not.toHaveBeenCalled();
    expect(savedItems[0].estimated_price).toBe(50000);
    expect(savedItems[0].pricing_snapshot).toMatchObject({
      source: 'fallback',
      verifiedBy: 'backend',
      pricingContractVersion: 'pricing-golden-v1',
      pricingEngine: 'quote-engine.calculateWide',
      pricingTrigger: 'create',
      verificationError: 'missing_size',
    });
  });

  it('keeps wide inquiry unverified when backend pricing throws on create', async () => {
    const { service, quoteEngine, savedItems } = makeService();
    quoteEngine.calculateWide.mockRejectedValueOnce(new Error('pricing unavailable'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      await service.create({
        category: 'banner',
        product_name: 'Banner',
        quantity: 1,
        width_mm: 1000,
        height_mm: 2000,
        paper_type: 'Vinyl 440gsm',
        estimated_price: 50000,
        pricing_snapshot: { source: 'fallback', total: 50000 },
      });
    } finally {
      consoleSpy.mockRestore();
    }

    expect(quoteEngine.calculateWide).toHaveBeenCalledTimes(1);
    expect(savedItems[0].estimated_price).toBe(50000);
    expect(savedItems[0].pricing_snapshot).toMatchObject({
      source: 'fallback',
      verifiedBy: 'backend',
      pricingContractVersion: 'pricing-golden-v1',
      pricingEngine: 'quote-engine.calculateWide',
      pricingTrigger: 'create',
      verificationError: 'pricing_engine_error',
      verificationMessage: 'Backend үнийн тооцоолол амжилтгүй боллоо',
    });
  });

  it('keeps wide inquiry unverified when backend pricing returns invalid total on create', async () => {
    const { service, quoteEngine, savedItems } = makeService();
    quoteEngine.calculateWide.mockResolvedValueOnce({
      total_price: 0,
      unit_price: 0,
      breakdown: {
        material: 0,
        print: 0,
        finishing: 0,
        setup: 0,
        rush: 0,
        vat: 0,
      },
      material_key: 'vinyl_440',
      material_name: 'Vinyl 440gsm',
      area_m2: 2,
      billable_area_m2: 2,
      material_rate_m2: 8500,
      print_rate_m2: 6500,
      waste_pct: 10,
    });

    await service.create({
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: 'Vinyl 440gsm',
      estimated_price: 50000,
      pricing_snapshot: { source: 'fallback', total: 50000 },
    });

    expect(quoteEngine.calculateWide).toHaveBeenCalledTimes(1);
    expect(savedItems[0].estimated_price).toBe(50000);
    expect(savedItems[0].pricing_snapshot).toMatchObject({
      source: 'fallback',
      verifiedBy: 'backend',
      pricingContractVersion: 'pricing-golden-v1',
      pricingEngine: 'quote-engine.calculateWide',
      pricingTrigger: 'create',
      verificationError: 'invalid_server_total',
      verificationMessage: 'Backend үнийн тооцоолол 0 эсвэл буруу дүн буцаалаа',
    });
  });

  it('filters inquiries by backend pricing delta when requested', async () => {
    const { service, repo, qbs } = makeService();

    await service.findAll({ pricingDelta: true, pricingDeltaSeverity: 'critical' });
    const qb = qbs[0];

    expect(repo.createQueryBuilder).toHaveBeenCalledWith('i');
    expect(qb.andWhere).toHaveBeenCalledWith("i.pricing_snapshot ->> 'verifiedBy' = :verifiedBy", { verifiedBy: 'backend' });
    expect(qb.andWhere).toHaveBeenCalledWith("ABS(COALESCE((i.pricing_snapshot ->> 'serverDelta')::numeric, 0)) > 0");
    expect(qb.andWhere).toHaveBeenCalledWith("i.pricing_snapshot ->> 'serverDeltaSeverity' = :pricingDeltaSeverity", {
      pricingDeltaSeverity: 'critical',
    });
    expect(qb.getMany).toHaveBeenCalled();
  });

  it('ignores non-object inquiry list filters before building queries', async () => {
    const { service, qbs } = makeService();

    await service.findAll(null);
    await service.findAll(['pricingDelta'] as any);

    expect(qbs[0].andWhere).not.toHaveBeenCalled();
    expect(qbs[1].andWhere).not.toHaveBeenCalled();
    expect(qbs[0].getMany).toHaveBeenCalled();
    expect(qbs[1].getMany).toHaveBeenCalled();
  });

  it('normalizes list filters before building inquiry queries', async () => {
    const { service, qbs } = makeService();

    await service.findAll({
      status: 'not-a-status',
      category: ` ${'c'.repeat(200)} `,
      pricingDelta: true,
      pricingDeltaSeverity: 'urgent',
      pricingUnverified: true,
      pricingUnverifiedReason: 'unknown',
    });
    const qb = qbs[0];

    expect(qb.andWhere).not.toHaveBeenCalledWith('i.status = :s', expect.any(Object));
    expect(qb.andWhere).toHaveBeenCalledWith('i.category = :c', { c: 'c'.repeat(120) });
    expect(qb.andWhere).not.toHaveBeenCalledWith(
      "i.pricing_snapshot ->> 'serverDeltaSeverity' = :pricingDeltaSeverity",
      expect.any(Object),
    );
    expect(qb.andWhere).not.toHaveBeenCalledWith(
      "i.pricing_snapshot ->> 'verificationError' = :pricingUnverifiedReason",
      expect.any(Object),
    );
  });

  it('ignores non-scalar enum list filters before building inquiry queries', async () => {
    const { service, qbs } = makeService();

    await service.findAll({
      status: [InquiryStatus.REVIEWING],
      pricingDelta: true,
      pricingDeltaSeverity: ['critical'],
      pricingUnverified: true,
      pricingUnverifiedReason: { reason: 'missing_material' },
    } as any);
    const qb = qbs[0];

    expect(qb.andWhere).not.toHaveBeenCalledWith('i.status = :s', expect.any(Object));
    expect(qb.andWhere).not.toHaveBeenCalledWith(
      "i.pricing_snapshot ->> 'serverDeltaSeverity' = :pricingDeltaSeverity",
      expect.any(Object),
    );
    expect(qb.andWhere).not.toHaveBeenCalledWith(
      "i.pricing_snapshot ->> 'verificationError' = :pricingUnverifiedReason",
      expect.any(Object),
    );
  });

  it('normalizes casing and whitespace in list enum filters', async () => {
    const { service, qbs } = makeService();

    await service.findAll({
      status: ' REVIEWING ',
      pricingDelta: true,
      pricingDeltaSeverity: ' Critical ',
      pricingUnverified: true,
      pricingUnverifiedReason: ' Missing_Material ',
    });
    const qb = qbs[0];

    expect(qb.andWhere).toHaveBeenCalledWith('i.status = :s', { s: InquiryStatus.REVIEWING });
    expect(qb.andWhere).toHaveBeenCalledWith(
      "i.pricing_snapshot ->> 'serverDeltaSeverity' = :pricingDeltaSeverity",
      { pricingDeltaSeverity: 'critical' },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      "i.pricing_snapshot ->> 'verificationError' = :pricingUnverifiedReason",
      { pricingUnverifiedReason: 'missing_material' },
    );
  });

  it('normalizes category casing in list filters', async () => {
    const { service, qbs } = makeService();

    await service.findAll({ category: ' Banner ' });
    const qb = qbs[0];

    expect(qb.andWhere).toHaveBeenCalledWith('i.category = :c', { c: 'banner' });
  });

  it('treats string false list filters as disabled', async () => {
    const { service, qbs } = makeService();

    await service.findAll({
      pricingDelta: 'false',
      pricingVerified: 'false',
      pricingUnverified: 'false',
      slaOverdue: 'false',
    } as any);
    const qb = qbs[0];

    expect(qb.andWhere).not.toHaveBeenCalledWith("i.pricing_snapshot ->> 'verifiedBy' = :verifiedBy", expect.any(Object));
    expect(qb.andWhere).not.toHaveBeenCalledWith("COALESCE(i.pricing_snapshot ->> 'verificationError', '') <> ''");
    expect(qb.andWhere).not.toHaveBeenCalledWith('i.vendor_sla_deadline IS NOT NULL');
  });

  it('treats non-scalar list flags as disabled', async () => {
    const { service, qbs } = makeService();

    await service.findAll({
      pricingDelta: ['true'],
      pricingVerified: { value: 'yes' },
      pricingUnverified: ['on'],
      slaOverdue: { value: '1' },
    } as any);
    const qb = qbs[0];

    expect(qb.andWhere).not.toHaveBeenCalledWith("i.pricing_snapshot ->> 'verifiedBy' = :verifiedBy", expect.any(Object));
    expect(qb.andWhere).not.toHaveBeenCalledWith("COALESCE(i.pricing_snapshot ->> 'verificationError', '') <> ''");
    expect(qb.andWhere).not.toHaveBeenCalledWith('i.vendor_sla_deadline IS NOT NULL');
  });

  it('treats string true list filters as enabled', async () => {
    const { service, qbs } = makeService();

    await service.findAll({ pricingDelta: 'true', slaOverdue: 'true' } as any);
    const qb = qbs[0];

    expect(qb.andWhere).toHaveBeenCalledWith("i.pricing_snapshot ->> 'verifiedBy' = :verifiedBy", { verifiedBy: 'backend' });
    expect(qb.andWhere).toHaveBeenCalledWith('i.vendor_sla_deadline IS NOT NULL');
  });

  it('normalizes string true list filters before applying them', async () => {
    const { service, qbs } = makeService();

    await service.findAll({
      pricingDelta: ' TRUE ',
      pricingVerified: ' True ',
      pricingUnverified: ' true ',
      slaOverdue: ' TRUE ',
    } as any);
    const qb = qbs[0];

    expect(qb.andWhere).toHaveBeenCalledWith("i.pricing_snapshot ->> 'verifiedBy' = :verifiedBy", { verifiedBy: 'backend' });
    expect(qb.andWhere).toHaveBeenCalledWith("COALESCE(i.pricing_snapshot ->> 'verificationError', '') <> ''");
    expect(qb.andWhere).toHaveBeenCalledWith('i.vendor_sla_deadline IS NOT NULL');
  });

  it('accepts common truthy query values for list filters', async () => {
    const { service, qbs } = makeService();

    await service.findAll({
      pricingDelta: '1',
      pricingVerified: 'yes',
      pricingUnverified: 'on',
      slaOverdue: '1',
    } as any);
    const qb = qbs[0];

    expect(qb.andWhere).toHaveBeenCalledWith("i.pricing_snapshot ->> 'verifiedBy' = :verifiedBy", { verifiedBy: 'backend' });
    expect(qb.andWhere).toHaveBeenCalledWith("COALESCE(i.pricing_snapshot ->> 'verificationError', '') <> ''");
    expect(qb.andWhere).toHaveBeenCalledWith('i.vendor_sla_deadline IS NOT NULL');
  });

  it('filters inquiries by verified backend pricing when requested', async () => {
    const { service, repo, qbs } = makeService();

    await service.findAll({ pricingVerified: true });
    const qb = qbs[0];

    expect(repo.createQueryBuilder).toHaveBeenCalledWith('i');
    expect(qb.andWhere).toHaveBeenCalledWith("i.pricing_snapshot ->> 'verifiedBy' = :verifiedBy", { verifiedBy: 'backend' });
    expect(qb.andWhere).toHaveBeenCalledWith("ABS(COALESCE((i.pricing_snapshot ->> 'serverDelta')::numeric, 0)) = 0");
    expect(qb.andWhere).toHaveBeenCalledWith("COALESCE(i.pricing_snapshot ->> 'verificationError', '') = ''");
    expect(qb.getMany).toHaveBeenCalled();
  });

  it('filters inquiries by unverified pricing when requested', async () => {
    const { service, repo, qbs } = makeService();

    await service.findAll({ pricingUnverified: true, pricingUnverifiedReason: 'missing_material' });
    const qb = qbs[0];

    expect(repo.createQueryBuilder).toHaveBeenCalledWith('i');
    expect(qb.andWhere).toHaveBeenCalledWith("COALESCE(i.pricing_snapshot ->> 'verificationError', '') <> ''");
    expect(qb.andWhere).toHaveBeenCalledWith("i.pricing_snapshot ->> 'verificationError' = :pricingUnverifiedReason", {
      pricingUnverifiedReason: 'missing_material',
    });
    expect(qb.getMany).toHaveBeenCalled();
  });

  it('filters inquiries by overdue vendor SLA when requested', async () => {
    const { service, repo, qbs } = makeService();

    await service.findAll({ slaOverdue: true });
    const qb = qbs[0];

    expect(repo.createQueryBuilder).toHaveBeenCalledWith('i');
    expect(qb.andWhere).toHaveBeenCalledWith('i.vendor_sla_deadline IS NOT NULL');
    expect(qb.andWhere).toHaveBeenCalledWith('i.vendor_sla_deadline < NOW()');
    expect(qb.andWhere).toHaveBeenCalledWith('i.vendor_accepted = false');
    expect(qb.andWhere).toHaveBeenCalledWith('i.vendor_id IS NOT NULL');
    expect(qb.getMany).toHaveBeenCalled();
  });

  it('filters inquiries that need manual pricing review when requested', async () => {
    const { service, qbs } = makeService();

    await service.findAll({ pricingManualReview: true });
    const qb = qbs[0];

    expect(qb.andWhere).toHaveBeenCalledWith('i.pricing_snapshot IS NOT NULL');
    expect(qb.andWhere).toHaveBeenCalledWith("COALESCE(i.pricing_snapshot ->> 'verifiedBy', '') <> :verifiedBy", { verifiedBy: 'backend' });
    expect(qb.andWhere).toHaveBeenCalledWith("COALESCE(i.pricing_snapshot ->> 'verificationError', '') = ''");
    expect(qb.getMany).toHaveBeenCalled();
  });

  it('filters inquiries with a price but missing pricing snapshot when requested', async () => {
    const { service, qbs } = makeService();

    await service.findAll({ pricingSnapshotMissing: true });
    const qb = qbs[0];

    expect(qb.andWhere).toHaveBeenCalledWith('i.pricing_snapshot IS NULL');
    expect(qb.andWhere).toHaveBeenCalledWith('COALESCE(i.estimated_price, 0) > 0');
    expect(qb.getMany).toHaveBeenCalled();
  });

  it('filters inquiries that require any pricing action when requested', async () => {
    const { service, qbs } = makeService();

    await service.findAll({ pricingActionRequired: true });
    const qb = qbs[0];

    expect(qb.andWhere).toHaveBeenCalledWith(expect.stringContaining("COALESCE(i.pricing_snapshot ->> 'verificationError', '') <> ''"), { verifiedBy: 'backend' });
    expect(qb.andWhere).toHaveBeenCalledWith(expect.stringContaining('i.pricing_snapshot IS NULL'), { verifiedBy: 'backend' });
    expect(qb.getMany).toHaveBeenCalled();
  });

  it('includes backend pricing delta count in summary', async () => {
    const { service, qbs } = makeService();

    const summary = await service.getSummary();
    const qb = qbs[0];

    expect(qb.where).toHaveBeenCalledWith("i.pricing_snapshot ->> 'verifiedBy' = :verifiedBy", { verifiedBy: 'backend' });
    expect(qb.andWhere).toHaveBeenCalledWith("ABS(COALESCE((i.pricing_snapshot ->> 'serverDelta')::numeric, 0)) > 0");
    expect(summary.pricing_delta_count).toBe(1);
    expect(summary.pricing_delta_minor_count).toBe(4);
    expect(summary.pricing_delta_warning_count).toBe(5);
    expect(summary.pricing_delta_critical_count).toBe(6);
    expect(summary.pricing_unverified_count).toBe(2);
    expect(summary.pricing_missing_size_count).toBe(7);
    expect(summary.pricing_missing_material_count).toBe(8);
    expect(summary.sla_overdue_count).toBe(3);
    expect(summary.pricing_verified_count).toBe(9);
    expect(summary.pricing_auto_quote_ready_count).toBe(9);
    expect(summary.pricing_reprice_required_count).toBe(1);
    expect(summary.pricing_input_fix_required_count).toBe(2);
    expect(summary.pricing_manual_review_count).toBe(10);
    expect(summary.pricing_snapshot_missing_count).toBe(11);
    expect(summary.pricing_action_required_count).toBe(12);
  });

  it('reprices an existing wide inquiry and persists the verified estimate', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      status: InquiryStatus.REVIEWING,
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: 'Vinyl 440gsm',
      sides: 'double',
      finishing: ['Гантиг гагнуур'],
      estimated_price: 50000,
      pricing_snapshot: { source: 'fallback', total: 50000 },
    });

    await service.reprice(id);

    expect(repo.update).toHaveBeenCalledWith(id, expect.objectContaining({
      estimated_price: 107982,
      pricing_snapshot: expect.objectContaining({
        source: 'server',
        verifiedBy: 'backend',
        pricingTrigger: 'manual_reprice',
        total: 107982,
      }),
    }));
  });

  it('sanitizes persisted finishing values before manual reprice', async () => {
    const { service, repo, quoteEngine, setInquiryToFind } = makeService();
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      status: InquiryStatus.REVIEWING,
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: 'Vinyl 440gsm',
      sides: 'double',
      finishing: ['  Grommet\r\n ', ' hem   seal ', { value: 'bad' }, ['rope'], 123],
      estimated_price: 50000,
    });

    await service.reprice(id);

    expect(quoteEngine.calculateWide).toHaveBeenCalledWith(expect.objectContaining({
      finishing: ['Grommet', 'hem seal', '123'],
    }));
    expect(repo.update).toHaveBeenCalledWith(id, expect.objectContaining({
      pricing_snapshot: expect.objectContaining({
        spec: expect.objectContaining({
          finishing: ['Grommet', 'hem seal', '123'],
        }),
      }),
    }));
  });

  it('sanitizes persisted material before manual reprice', async () => {
    const { service, quoteEngine, setInquiryToFind } = makeService();
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      status: InquiryStatus.REVIEWING,
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: ' Vinyl\r\n  440gsm\u0007 ',
      estimated_price: 50000,
    } as any);

    await service.reprice(id);

    expect(quoteEngine.calculateWide).toHaveBeenCalledWith(expect.objectContaining({
      material: 'Vinyl 440gsm',
    }));
  });

  it('normalizes persisted sides before manual reprice', async () => {
    const { service, repo, quoteEngine, setInquiryToFind } = makeService();
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      status: InquiryStatus.REVIEWING,
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: 'Vinyl 440gsm',
      sides: { value: 'double' },
      finishing: [],
      estimated_price: 50000,
    });

    await service.reprice(id);

    expect(quoteEngine.calculateWide).toHaveBeenCalledWith(expect.objectContaining({
      sides: 'single',
    }));
    expect(repo.update).toHaveBeenCalledWith(id, expect.objectContaining({
      pricing_snapshot: expect.objectContaining({
        spec: expect.objectContaining({
          sides: 'single',
        }),
      }),
    }));
  });

  it('normalizes scalar string quantity and sizes before manual reprice', async () => {
    const { service, quoteEngine, setInquiryToFind } = makeService();
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      status: InquiryStatus.REVIEWING,
      category: 'banner',
      product_name: 'Banner',
      quantity: '2',
      width_mm: '1000',
      height_mm: '2000',
      paper_type: 'Vinyl 440gsm',
      sides: 'double',
      finishing: [],
      estimated_price: 50000,
    });

    await service.reprice(id);

    expect(quoteEngine.calculateWide).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 2,
      width: 1,
      length: 2,
    }));
  });

  it('clamps oversized persisted quantity and sizes before manual reprice', async () => {
    const { service, quoteEngine, setInquiryToFind } = makeService();
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      status: InquiryStatus.REVIEWING,
      category: 'banner',
      product_name: 'Banner',
      quantity: '999999999',
      width_mm: '999999999',
      height_mm: '999999999',
      paper_type: 'Vinyl 440gsm',
      sides: 'double',
      finishing: [],
      estimated_price: 50000,
    });

    await service.reprice(id);

    expect(quoteEngine.calculateWide).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 1000000,
      width: 100,
      length: 100,
    }));
  });

  it('defaults non-positive persisted quantity to one before manual reprice', async () => {
    const { service, quoteEngine, setInquiryToFind } = makeService();
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      status: InquiryStatus.REVIEWING,
      category: 'banner',
      product_name: 'Banner',
      quantity: '-5',
      width_mm: '1000',
      height_mm: '2000',
      paper_type: 'Vinyl 440gsm',
      sides: 'double',
      finishing: [],
      estimated_price: 50000,
    });

    await service.reprice(id);

    expect(quoteEngine.calculateWide).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 1,
    }));
  });

  it('normalizes reprice inquiry ids before lookup and update', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      status: InquiryStatus.REVIEWING,
      category: 'banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: 'Vinyl 440gsm',
      estimated_price: 50000,
    });

    await service.reprice(` ${id} `);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(repo.update).toHaveBeenCalledWith(id, expect.objectContaining({
      estimated_price: 107982,
    }));
  });

  it('rejects unsafe reprice inquiry ids before lookup', async () => {
    const { service, repo } = makeService();

    await expect(service.reprice('../11111111-1111-4111-8111-111111111111')).rejects.toThrow('ID');
    await expect(service.reprice(['11111111-1111-4111-8111-111111111111'] as any)).rejects.toThrow('ID');

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('reprices inquiries identified by Mongolian wide product names', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      status: InquiryStatus.REVIEWING,
      category: '',
      product_name: 'Гадна баннер хэвлэл',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: 'Vinyl 440gsm',
      sides: 'double',
      finishing: [],
      estimated_price: 50000,
    });

    await service.reprice(id);

    expect(repo.update).toHaveBeenCalledWith(id, expect.objectContaining({
      estimated_price: 107982,
      pricing_snapshot: expect.objectContaining({
        product: expect.objectContaining({ category: 'banner' }),
      }),
    }));
  });

  it('falls back to product name when persisted category is non-scalar during reprice', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      status: InquiryStatus.REVIEWING,
      category: { value: 'bad' },
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: 'Vinyl 440gsm',
      sides: 'double',
      finishing: [],
      estimated_price: 50000,
    });

    await service.reprice(id);

    expect(repo.update).toHaveBeenCalledWith(id, expect.objectContaining({
      estimated_price: 107982,
      pricing_snapshot: expect.objectContaining({
        product: expect.objectContaining({ category: 'banner' }),
      }),
    }));
  });

  it('verifies pricing for UTF-8 Mongolian banner category aliases on create', async () => {
    const { service, quoteEngine, savedItems } = makeService();

    await service.create({
      category: 'Өргөн хэвлэл баннер',
      product_name: 'Гадна баннер хэвлэл',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: 'Vinyl 440gsm',
      sides: 'double',
      finishing: ['Гантиг гагнуур', 'Оосор нэмэх'],
      estimated_price: 50000,
      pricing_snapshot: { source: 'fallback', total: 50000 },
    });

    expect(quoteEngine.calculateWide).toHaveBeenCalledWith(expect.objectContaining({
      type: 'banner',
      material: 'Vinyl 440gsm',
      finishing: ['Гантиг гагнуур', 'Оосор нэмэх'],
      sides: 'double',
    }));
    expect(savedItems[0].estimated_price).toBe(107982);
    expect(savedItems[0].pricing_snapshot).toMatchObject({
      source: 'server',
      verifiedBy: 'backend',
      product: expect.objectContaining({ category: 'banner' }),
      serverResult: expect.objectContaining({
        materialKey: 'vinyl_440',
        materialRateM2: 8500,
        printRateM2: 6500,
      }),
    });
  });

  it('verifies pricing for spaced roll up category aliases on create', async () => {
    const { service, quoteEngine, savedItems } = makeService();

    await service.create({
      category: 'roll up',
      product_name: 'Event stand',
      quantity: 1,
      width_mm: 850,
      height_mm: 2000,
      paper_type: 'Vinyl 440gsm',
      estimated_price: 50000,
      pricing_snapshot: { source: 'fallback', total: 50000 },
    });

    expect(quoteEngine.calculateWide).toHaveBeenCalledWith(expect.objectContaining({
      type: 'banner',
      width: 0.85,
      length: 2,
      material: 'Vinyl 440gsm',
    }));
    expect(savedItems[0].pricing_snapshot).toMatchObject({
      source: 'server',
      product: expect.objectContaining({ category: 'banner' }),
    });
  });

  it('does not auto-assign inquiries to incomplete vendor records', async () => {
    const { service, repo, chatRepo, notificationsGateway } = makeService({
      vendors: [
        {
          id: 'vendor-incomplete',
          company_name: '',
          user_id: '',
          contact_email: '',
          services: ['banner'],
          floor_prices: {},
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: ' inq-1 ',
      category: 'banner',
      product_name: 'Баннер',
      quantity: 1,
      estimated_price: 107982,
    } as any);

    expect(repo.update).not.toHaveBeenCalled();
    expect(notificationsGateway.notifyAdmins).toHaveBeenCalledWith(expect.objectContaining({
      type: 'no_vendor_available',
      inquiryId: 'inq-1',
    }));
    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      inquiry_id: 'inq-1',
      content: 'Захиалга хүлээн авлаа. Оператор тохирох үйлдвэртэй холбож өгнө.',
      is_system: true,
    }));
  });

  it('sanitizes no-vendor auto assignment admin notification product names', async () => {
    const { service, notificationsGateway } = makeService({
      vendors: [
        {
          id: 'vendor-incomplete',
          company_name: '',
          user_id: '',
          contact_email: '',
          services: ['banner'],
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'banner\r\nwide\u0007',
      product_name: { name: 'Banner' },
      quantity: 1,
      estimated_price: 107982,
    } as any);

    expect(notificationsGateway.notifyAdmins).toHaveBeenCalledWith(expect.objectContaining({
      type: 'no_vendor_available',
      message: '"banner wide" захиалгад тохирох vendor алга',
    }));
  });

  it('normalizes SLA timeout ids before reassigning inquiries', async () => {
    const { service, repo, mailService, notificationsGateway, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          services: ['banner'],
        },
        {
          id: 'vendor-next',
          company_name: 'Next Print',
          user_id: 'user-next',
          contact_email: 'next@example.com',
          services: ['banner'],
        },
      ],
    });
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      category: 'banner',
      product_name: 'Баннер',
      vendor_id: 'vendor-good',
      vendor_accepted: false,
      reassign_count: 0,
    } as any);

    await service.checkSLATimeout(` ${id} `, ' vendor-good ');

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(repo.update).toHaveBeenCalledWith(id, expect.objectContaining({
      vendor_id: 'vendor-next',
      sla_missed_vendor_id: 'vendor-good',
      reassign_count: 1,
    }));
    expect(mailService.sendVendorNewInquiry).toHaveBeenCalledWith(
      { email: 'next@example.com', name: 'Next Print' },
      expect.objectContaining({ id }),
    );
    expect(notificationsGateway.notifyVendorNewInquiry).toHaveBeenCalledWith(
      'user-next',
      expect.objectContaining({ id }),
    );
  });

  it('sanitizes SLA reassign vendor email payload fields', async () => {
    const { service, mailService, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          services: ['banner'],
        },
        {
          id: 'vendor-next',
          company_name: 'Next Print',
          user_id: 'user-next',
          contact_email: 'next@example.com',
          services: ['banner'],
        },
      ],
    });
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id: '../dirty-inq',
      category: 'banner',
      product_name: ' Banner\u0007 Deluxe ',
      quantity: ['10'],
      estimated_price: { value: 107982 },
      customer_name: ' Test\u0007 User ',
      vendor_id: 'vendor-good',
      vendor_accepted: false,
      reassign_count: 0,
    } as any);

    await service.checkSLATimeout(` ${id} `, 'vendor-good');

    expect(mailService.sendVendorNewInquiry).toHaveBeenCalledWith(
      { email: 'next@example.com', name: 'Next Print' },
      expect.objectContaining({
        id,
        productName: 'Banner Deluxe',
        quantity: 0,
        estimatedPrice: 0,
        customerName: 'Test User',
      }),
    );
  });

  it('normalizes vendor exclude ids before finding the next SLA vendor', async () => {
    const { service, vendorRepo, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          services: ['banner'],
        },
        {
          id: 'vendor-next',
          company_name: 'Next Print',
          user_id: 'user-next',
          services: ['banner'],
        },
      ],
    });
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      category: 'banner',
      product_name: 'Баннер',
      vendor_id: 'vendor-good',
      vendor_accepted: false,
      reassign_count: 0,
      sla_missed_vendor_id: '../vendor-bad',
    } as any);

    await service.checkSLATimeout(id, ' vendor-good ');

    const vendorQb = vendorRepo.createQueryBuilder.mock.results[0].value;
    expect(vendorQb.andWhere).toHaveBeenCalledWith('v.id NOT IN (:...excludeIds)', {
      excludeIds: ['vendor-good'],
    });
  });

  it('caps SLA vendor exclude ids before finding the next vendor', async () => {
    const { service, vendorRepo, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          services: ['banner'],
        },
        {
          id: 'vendor-next',
          company_name: 'Next Print',
          user_id: 'user-next',
          services: ['banner'],
        },
      ],
    });
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      category: 'banner',
      product_name: 'Баннер',
      vendor_id: 'vendor-good',
      vendor_accepted: false,
      reassign_count: 0,
      sla_missed_vendor_id: Array.from({ length: 80 }, (_, index) => `vendor-${index}`),
    } as any);

    await service.checkSLATimeout(id, 'vendor-good');

    const vendorQb = vendorRepo.createQueryBuilder.mock.results[0].value;
    expect(vendorQb.andWhere).toHaveBeenCalledWith('v.id NOT IN (:...excludeIds)', {
      excludeIds: ['vendor-good'],
    });
  });

  it('ignores stale SLA timeout jobs after the inquiry has moved to another vendor', async () => {
    const { service, repo, vendorRepo, notificationsGateway, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          services: ['banner'],
        },
        {
          id: 'vendor-next',
          company_name: 'Next Print',
          user_id: 'user-next',
          services: ['banner'],
        },
      ],
    });
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      category: 'banner',
      product_name: 'Banner',
      vendor_id: 'vendor-next',
      vendor_accepted: false,
      reassign_count: 0,
    } as any);

    await service.checkSLATimeout(id, 'vendor-good');

    expect(vendorRepo.createQueryBuilder).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
    expect(notificationsGateway.notifyAdmins).not.toHaveBeenCalled();
    expect(notificationsGateway.notifyVendorNewInquiry).not.toHaveBeenCalled();
  });

  it('stops SLA reassignment after the maximum reassign count', async () => {
    const { service, repo, vendorRepo, notificationsGateway, chatRepo, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          services: ['banner'],
        },
        {
          id: 'vendor-next',
          company_name: 'Next Print',
          user_id: 'user-next',
          services: ['banner'],
        },
      ],
    });
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      category: 'banner',
      product_name: 'Banner',
      vendor_id: ' vendor-good ',
      vendor_accepted: false,
      reassign_count: '3',
    } as any);

    await service.checkSLATimeout(id, 'vendor-good');

    expect(vendorRepo.createQueryBuilder).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith(id, expect.objectContaining({
      status: InquiryStatus.REVIEWING,
      vendor_id: undefined,
    }));
    expect(notificationsGateway.notifyAdmins).toHaveBeenCalledWith(expect.objectContaining({
      type: 'sla_max_reassign',
      inquiryId: id,
    }));
    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      inquiry_id: id,
      is_system: true,
    }));
  });

  it('skips SLA reassign vendors below their floor price', async () => {
    const { service, repo, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          services: ['banner'],
        },
        {
          id: 'vendor-expensive',
          company_name: 'Expensive Print',
          user_id: 'user-expensive',
          services: ['banner'],
          floor_prices: { banner: 200000 },
          commission_rate: 15,
        },
        {
          id: 'vendor-next',
          company_name: 'Next Print',
          user_id: 'user-next',
          services: ['banner'],
          floor_prices: { banner: 1000 },
          commission_rate: 15,
        },
      ],
    });
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      category: 'banner',
      product_name: 'Banner',
      vendor_id: 'vendor-good',
      vendor_accepted: false,
      reassign_count: 0,
      estimated_price: 107982,
    } as any);

    await service.checkSLATimeout(id, 'vendor-good');

    expect(repo.update).toHaveBeenCalledWith(id, expect.objectContaining({
      vendor_id: 'vendor-next',
      reassign_count: 1,
      sla_missed_vendor_id: 'vendor-good',
    }));
  });

  it('does not reassign SLA timeouts to vendors whose services do not match the product', async () => {
    const { service, repo, notificationsGateway, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          services: ['banner'],
        },
        {
          id: 'vendor-sticker',
          company_name: 'Sticker Print',
          user_id: 'user-sticker',
          services: ['sticker'],
        },
      ],
    });
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      category: 'banner',
      product_name: 'Banner',
      vendor_id: 'vendor-good',
      vendor_accepted: false,
      reassign_count: 0,
      estimated_price: 107982,
    } as any);

    await service.checkSLATimeout(id, 'vendor-good');

    expect(repo.update).not.toHaveBeenCalled();
    expect(notificationsGateway.notifyAdmins).toHaveBeenCalledWith(expect.objectContaining({
      type: 'no_vendor_available',
      inquiryId: id,
    }));
  });

  it('rejects unsafe SLA timeout ids before lookup', async () => {
    const { service, repo, vendorRepo } = makeService();

    await expect(service.checkSLATimeout('../11111111-1111-4111-8111-111111111111', 'vendor-good')).rejects.toThrow('ID');
    await expect(service.checkSLATimeout('11111111-1111-4111-8111-111111111111', '../vendor-good')).rejects.toThrow('ID');
    await expect(service.checkSLATimeout(['11111111-1111-4111-8111-111111111111'] as any, 'vendor-good')).rejects.toThrow('ID');
    await expect(service.checkSLATimeout('11111111-1111-4111-8111-111111111111', ['vendor-good'] as any)).rejects.toThrow('ID');

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(vendorRepo.createQueryBuilder).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('skips incomplete vendors and auto-assigns the next reachable vendor', async () => {
    const { service, repo, notificationsGateway } = makeService({
      vendors: [
        {
          id: 'vendor-incomplete',
          company_name: '',
          user_id: '',
          contact_email: '',
          services: ['banner'],
          floor_prices: {},
          commission_rate: 15,
        },
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          contact_email: '',
          services: ['banner'],
          floor_prices: {},
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Баннер',
      quantity: 1,
      estimated_price: 107982,
      customer_name: 'Test',
    } as any);

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      vendor_id: 'vendor-good',
      status: InquiryStatus.REVIEWING,
    }));
    expect(notificationsGateway.notifyVendorNewInquiry).toHaveBeenCalledWith('user-good', expect.objectContaining({ id: 'inq-1' }));
  });

  it('skips vendors with non-scalar company names during auto assignment', async () => {
    const { service, repo, notificationsGateway } = makeService({
      vendors: [
        {
          id: 'vendor-object-name',
          company_name: { value: 'Object Print' },
          user_id: 'user-object',
          contact_email: '',
          services: ['banner'],
          floor_prices: {},
          commission_rate: 15,
        } as any,
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          contact_email: '',
          services: ['banner'],
          floor_prices: {},
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      estimated_price: 107982,
      customer_name: 'Test',
    } as any);

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      vendor_id: 'vendor-good',
      status: InquiryStatus.REVIEWING,
    }));
    expect(notificationsGateway.notifyVendorNewInquiry).toHaveBeenCalledWith('user-good', expect.objectContaining({ id: 'inq-1' }));
  });

  it('skips vendors with unsafe ids during auto assignment', async () => {
    const { service, repo, setInquiryToFind } = makeService({
      vendors: [
        {
          id: '../vendor-bad',
          company_name: 'Bad Print',
          user_id: 'user-bad',
          contact_email: '',
          services: ['banner'],
          floor_prices: {},
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Баннер',
      quantity: 1,
      estimated_price: 107982,
    } as any);

    expect(repo.update).not.toHaveBeenCalled();
  });

  it('skips auto assignment when the inquiry id is unsafe', async () => {
    const { service, repo, vendorRepo, chatRepo, notificationsGateway } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          contact_email: '',
          services: ['banner'],
          floor_prices: {},
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: '../inq-1',
      category: 'banner',
      product_name: 'Баннер',
      vendor_id: null,
      quantity: 1,
      estimated_price: 107982,
    } as any);

    expect(vendorRepo.createQueryBuilder).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
    expect(chatRepo.save).not.toHaveBeenCalled();
    expect(notificationsGateway.notifyVendorNewInquiry).not.toHaveBeenCalled();
  });

  it('does not treat blank legacy vendor ids as manual assignments during auto assignment', async () => {
    const { service, repo } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          contact_email: '',
          services: ['banner'],
          floor_prices: {},
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Баннер',
      vendor_id: '   ',
      quantity: 1,
      estimated_price: 107982,
    } as any);

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      vendor_id: 'vendor-good',
      status: InquiryStatus.REVIEWING,
    }));
  });

  it('does not auto-assign when a legacy vendor id normalizes to a real manual assignment', async () => {
    const { service, repo } = makeService({
      vendors: [
        {
          id: 'vendor-next',
          company_name: 'Next Print',
          user_id: 'user-next',
          contact_email: '',
          services: ['banner'],
          floor_prices: {},
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Баннер',
      vendor_id: ' vendor-existing ',
      quantity: 1,
      estimated_price: 107982,
    } as any);

    expect(repo.update).not.toHaveBeenCalled();
  });

  it('drops unsafe vendor realtime user ids when notifying auto-assigned vendors', async () => {
    const { service, mailService, notificationsGateway } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: '../user-good',
          contact_email: ' Vendor@Example.COM ',
          services: ['banner'],
          floor_prices: {},
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Баннер',
      quantity: 1,
      estimated_price: 107982,
    } as any);

    expect(notificationsGateway.notifyVendorNewInquiry).toHaveBeenCalledWith(null, expect.objectContaining({ id: 'inq-1' }));
    expect(mailService.sendVendorNewInquiry).toHaveBeenCalledWith(
      { email: 'vendor@example.com', name: 'Good Print' },
      expect.objectContaining({ id: 'inq-1' }),
    );
  });

  it('normalizes vendor notification quantity and estimate values', async () => {
    const { service, mailService } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          contact_email: 'vendor@example.com',
          services: ['banner'],
          floor_prices: {},
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'banner',
      product_name: { name: 'Banner' },
      quantity: ['10'],
      estimated_price: { value: 107982 },
      customer_name: { name: 'Customer' },
    } as any);

    expect(mailService.sendVendorNewInquiry).toHaveBeenCalledWith(
      { email: 'vendor@example.com', name: 'Good Print' },
      expect.objectContaining({
        productName: '',
        quantity: 0,
        estimatedPrice: 0,
        customerName: '',
      }),
    );
  });

  it('skips invalid vendor contact emails when notifying auto-assigned vendors', async () => {
    const { service, mailService, notificationsGateway } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          contact_email: 'bad-email\r\n@example',
          services: ['banner'],
          floor_prices: {},
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Баннер',
      quantity: 1,
      estimated_price: 107982,
    } as any);

    expect(notificationsGateway.notifyVendorNewInquiry).toHaveBeenCalledWith('user-good', expect.objectContaining({ id: 'inq-1' }));
    expect(mailService.sendVendorNewInquiry).not.toHaveBeenCalled();
  });

  it('normalizes vendor display names before writing mail and system messages', async () => {
    const { service, chatRepo, mailService } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: ' Good\r\nPrint\0 ',
          user_id: 'user-good',
          contact_email: 'vendor@example.com',
          services: ['banner'],
          floor_prices: {},
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Баннер',
      quantity: 1,
      estimated_price: 107982,
    } as any);

    expect(mailService.sendVendorNewInquiry).toHaveBeenCalledWith(
      { email: 'vendor@example.com', name: 'Good Print' },
      expect.objectContaining({ id: 'inq-1' }),
    );
    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      content: 'Захиалга автоматаар "Good Print" үйлдвэрт хуваарилагдлаа',
    }));
  });

  it('normalizes vendor service names before matching products', async () => {
    const { service, repo } = makeService({
      vendors: [
        {
          id: 'vendor-sticker',
          company_name: 'Sticker Print',
          user_id: 'user-sticker',
          contact_email: '',
          services: ['  Sticker\r\nPrint  '],
          floor_prices: {},
          commission_rate: 15,
        },
        {
          id: 'vendor-banner',
          company_name: 'Banner Print',
          user_id: 'user-banner',
          contact_email: '',
          services: ['  Banner\r\nPrint  '],
          floor_prices: {},
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'BANNER',
      product_name: 'Banner',
      quantity: 1,
      estimated_price: 107982,
    } as any);

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      vendor_id: 'vendor-banner',
    }));
  });

  it('matches vendor service names across spaces and hyphens', async () => {
    const { service, repo } = makeService({
      vendors: [
        {
          id: 'vendor-business-card',
          company_name: 'Business Card Print',
          user_id: 'user-business-card',
          contact_email: '',
          services: [' business   card '],
          floor_prices: {},
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'business-card',
      product_name: 'Business card',
      quantity: 1,
      estimated_price: 50000,
    } as any);

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      vendor_id: 'vendor-business-card',
    }));
  });

  it('ignores non-string vendor service names before matching products', async () => {
    const { service, repo, notificationsGateway } = makeService({
      vendors: [
        {
          id: 'vendor-numeric-service',
          company_name: 'Numeric Service Print',
          user_id: 'user-numeric-service',
          contact_email: '',
          services: [12345],
          floor_prices: {},
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: '12345',
      product_name: 'Custom',
      quantity: 1,
      estimated_price: 107982,
    } as any);

    expect(repo.update).not.toHaveBeenCalled();
    expect(notificationsGateway.notifyAdmins).toHaveBeenCalledWith(expect.objectContaining({
      type: 'no_vendor_available',
      inquiryId: 'inq-1',
    }));
  });

  it('does not auto-assign to vendors whose services do not match the product', async () => {
    const { service, repo, notificationsGateway } = makeService({
      vendors: [
        {
          id: 'vendor-sticker',
          company_name: 'Sticker Print',
          user_id: 'user-sticker',
          contact_email: '',
          services: ['sticker'],
          floor_prices: {},
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'BANNER',
      product_name: 'Banner',
      quantity: 1,
      estimated_price: 107982,
    } as any);

    expect(repo.update).not.toHaveBeenCalled();
    expect(notificationsGateway.notifyAdmins).toHaveBeenCalledWith(expect.objectContaining({
      type: 'no_vendor_available',
      inquiryId: 'inq-1',
    }));
  });

  it('normalizes vendor floor price keys before applying the floor gate', async () => {
    const { service, repo } = makeService({
      vendors: [
        {
          id: 'vendor-expensive',
          company_name: 'Expensive Print',
          user_id: 'user-expensive',
          contact_email: '',
          services: ['banner'],
          floor_prices: { ' Banner\r\n ': 200000 },
          commission_rate: 15,
        },
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          contact_email: '',
          services: ['banner'],
          floor_prices: { default: 1000 },
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'BANNER',
      product_name: 'Banner',
      quantity: 1,
      estimated_price: 107982,
    } as any);

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      vendor_id: 'vendor-good',
    }));
  });

  it('matches vendor floor price keys across spaces and hyphens', async () => {
    const { service, repo, notificationsGateway } = makeService({
      vendors: [
        {
          id: 'vendor-business-expensive',
          company_name: 'Business Expensive Print',
          user_id: 'user-business-expensive',
          contact_email: '',
          services: ['business card'],
          floor_prices: { 'business card': 200000 },
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'business-card',
      product_name: 'Business card',
      quantity: 1,
      estimated_price: 50000,
    } as any);

    expect(repo.update).not.toHaveBeenCalled();
    expect(notificationsGateway.notifyAdmins).toHaveBeenCalledWith(expect.objectContaining({
      type: 'no_vendor_available',
      inquiryId: 'inq-1',
    }));
  });

  it('ignores non-scalar vendor floor price values before applying the floor gate', async () => {
    const { service, repo } = makeService({
      vendors: [
        {
          id: 'vendor-array-floor',
          company_name: 'Array Floor Print',
          user_id: 'user-array-floor',
          contact_email: '',
          services: ['banner'],
          floor_prices: { banner: [200000] },
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'BANNER',
      product_name: 'Banner',
      quantity: 1,
      estimated_price: 107982,
    } as any);

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      vendor_id: 'vendor-array-floor',
    }));
  });

  it('does not bypass vendor floor prices when every capable vendor is below floor', async () => {
    const { service, repo, chatRepo, notificationsGateway } = makeService({
      vendors: [
        {
          id: 'vendor-expensive',
          company_name: 'Expensive Print',
          user_id: 'user-expensive',
          contact_email: '',
          services: ['banner'],
          floor_prices: { banner: 200000 },
          commission_rate: 15,
        },
        {
          id: 'vendor-premium',
          company_name: 'Premium Print',
          user_id: 'user-premium',
          contact_email: '',
          services: ['banner'],
          floor_prices: { default: 150000 },
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'BANNER',
      product_name: 'Banner',
      quantity: 1,
      estimated_price: 107982,
    } as any);

    expect(repo.update).not.toHaveBeenCalled();
    expect(notificationsGateway.notifyAdmins).toHaveBeenCalledWith(expect.objectContaining({
      type: 'no_vendor_available',
      inquiryId: 'inq-1',
    }));
    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      inquiry_id: 'inq-1',
      is_system: true,
    }));
  });

  it('does not let invalid vendor commission rates inflate floor price eligibility', async () => {
    const { service, repo } = makeService({
      vendors: [
        {
          id: 'vendor-invalid-commission',
          company_name: 'Invalid Commission Print',
          user_id: 'user-invalid-commission',
          contact_email: '',
          services: ['banner'],
          floor_prices: { banner: 120000 },
          commission_rate: -50,
        },
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          contact_email: '',
          services: ['banner'],
          floor_prices: { banner: 1000 },
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'BANNER',
      product_name: 'Banner',
      quantity: 1,
      estimated_price: 100000,
    } as any);

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      vendor_id: 'vendor-good',
    }));
  });

  it('defaults non-scalar vendor commission rates before floor price checks', async () => {
    const { service, repo } = makeService({
      vendors: [
        {
          id: 'vendor-array-commission',
          company_name: 'Array Commission Print',
          user_id: 'user-array-commission',
          contact_email: '',
          services: ['banner'],
          floor_prices: { banner: 90000 },
          commission_rate: [0],
        },
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          contact_email: '',
          services: ['banner'],
          floor_prices: { banner: 1000 },
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'BANNER',
      product_name: 'Banner',
      quantity: 1,
      estimated_price: 100000,
    } as any);

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      vendor_id: 'vendor-good',
    }));
  });

  it('does not auto-assign to vendors with floor prices when inquiry price is missing', async () => {
    const { service, repo, notificationsGateway } = makeService({
      vendors: [
        {
          id: 'vendor-priced',
          company_name: 'Priced Print',
          user_id: 'user-priced',
          contact_email: '',
          services: ['banner'],
          floor_prices: { banner: 1000 },
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'BANNER',
      product_name: 'Banner',
      quantity: 1,
      estimated_price: null,
    } as any);

    expect(repo.update).not.toHaveBeenCalled();
    expect(notificationsGateway.notifyAdmins).toHaveBeenCalledWith(expect.objectContaining({
      type: 'no_vendor_available',
      inquiryId: 'inq-1',
    }));
  });

  it('does not coerce non-scalar inquiry prices through the vendor floor gate', async () => {
    const { service, repo, notificationsGateway } = makeService({
      vendors: [
        {
          id: 'vendor-priced',
          company_name: 'Priced Print',
          user_id: 'user-priced',
          contact_email: '',
          services: ['banner'],
          floor_prices: { banner: 1000 },
          commission_rate: 15,
        },
      ],
    });

    await service.autoAssignVendor({
      id: 'inq-1',
      category: 'BANNER',
      product_name: 'Banner',
      quantity: 1,
      quoted_price: [107982],
      estimated_price: { value: 107982 },
      pricing_snapshot: { total: [107982] },
    } as any);

    expect(repo.update).not.toHaveBeenCalled();
    expect(notificationsGateway.notifyAdmins).toHaveBeenCalledWith(expect.objectContaining({
      type: 'no_vendor_available',
      inquiryId: 'inq-1',
    }));
  });

  it('rejects manual reprice for non-wide inquiries', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      status: InquiryStatus.REVIEWING,
      category: 'business-card',
      product_name: 'Business card',
      quantity: 100,
      width_mm: 90,
      height_mm: 54,
      estimated_price: 50000,
    });

    await expect(service.reprice(id)).rejects.toThrow('reprice');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects manual reprice when wide inquiry has no size', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      status: InquiryStatus.REVIEWING,
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: null,
      height_mm: 0,
      estimated_price: 50000,
    });

    await expect(service.reprice(id)).rejects.toThrow('хэмжээ');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects manual reprice when wide inquiry size is non-scalar', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      status: InquiryStatus.REVIEWING,
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: [1000],
      height_mm: { value: 2000 },
      paper_type: 'Vinyl 440gsm',
      estimated_price: 50000,
    });

    await expect(service.reprice(id)).rejects.toThrow();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects manual reprice when wide inquiry has no material', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      status: InquiryStatus.REVIEWING,
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: '',
      estimated_price: 50000,
    });

    await expect(service.reprice(id)).rejects.toThrow('материал');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects manual reprice when wide inquiry material is non-scalar', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      status: InquiryStatus.REVIEWING,
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: { name: 'Vinyl 440gsm' },
      estimated_price: 50000,
    });

    await expect(service.reprice(id)).rejects.toThrow();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects manual reprice after inquiry is confirmed', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      status: InquiryStatus.CONFIRMED,
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      width_mm: 1000,
      height_mm: 2000,
      paper_type: 'Vinyl 440gsm',
      estimated_price: 50000,
    });

    await expect(service.reprice(id)).rejects.toThrow('дахин үнэ бодох боломжгүй');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects auto quote when backend pricing is unverified', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      status: InquiryStatus.REVIEWING,
      estimated_price: 50000,
      pricing_snapshot: {
        source: 'fallback',
        verifiedBy: 'backend',
        verificationError: 'missing_material',
        total: 50000,
      },
    });

    await expect(service.sendQuote('inq-1', 50000, 'auto', 'auto_verified')).rejects.toThrow('баталгаажаагүй');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects quote when price is not positive', async () => {
    const { service, repo } = makeService();

    await expect(service.sendQuote('inq-1', 0, 'manual')).rejects.toThrow('0-ээс их');
    await expect(service.sendQuote('inq-1', -1, 'manual')).rejects.toThrow('0-ээс их');
    await expect(service.sendQuote('inq-1', [107982] as any, 'manual')).rejects.toThrow('0-ээс их');
    await expect(service.sendQuote('inq-1', { value: 107982 } as any, 'manual')).rejects.toThrow('0-ээс их');

    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects quote when price exceeds the supported maximum', async () => {
    const { service, repo } = makeService();

    await expect(service.sendQuote('inq-1', 10_000_000_001, 'manual')).rejects.toThrow('хэт өндөр');

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects quote when inquiry is already confirmed or later', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      status: InquiryStatus.CONFIRMED,
      quoted_price: 107982,
    });

    await expect(service.sendQuote('inq-1', 120000, 'manual')).rejects.toThrow('дахин илгээх боломжгүй');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects quote when assigned vendor floor price is above the quote', async () => {
    const { service, repo, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-expensive',
        company_name: 'Expensive Print',
        user_id: 'user-expensive',
        services: ['banner'],
        floor_prices: { banner: 200000 },
        commission_rate: 15,
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      status: InquiryStatus.REVIEWING,
      category: 'banner',
      product_name: 'Banner',
      vendor_id: 'vendor-expensive',
    } as any);

    await expect(service.sendQuote('inq-1', 107982, 'manual')).rejects.toThrow('доод үнэ');

    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects quote when assigned vendor services do not match the inquiry product', async () => {
    const { service, repo, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-sticker',
        company_name: 'Sticker Print',
        user_id: 'user-sticker',
        services: ['sticker'],
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      status: InquiryStatus.REVIEWING,
      category: 'banner',
      product_name: 'Banner',
      vendor_id: 'vendor-sticker',
    } as any);

    await expect(service.sendQuote('inq-1', 107982, 'manual')).rejects.toThrow('төрлийг');

    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects quote when assigned vendor id is unsafe', async () => {
    const { service, repo, vendorRepo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      status: InquiryStatus.REVIEWING,
      category: 'banner',
      product_name: 'Banner',
      vendor_id: '../vendor-good',
    } as any);

    await expect(service.sendQuote('inq-1', 107982, 'manual')).rejects.toThrow('Vendor ID');

    expect(vendorRepo.findOne).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('allows auto quote only when price matches verified backend estimate', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      status: InquiryStatus.REVIEWING,
      estimated_price: 107982,
      pricing_snapshot: {
        source: 'server',
        verifiedBy: 'backend',
        serverDelta: 0,
        total: 107982,
      },
    });

    await service.sendQuote('inq-1', 107982, 'auto', 'auto_verified');

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      quoted_price: 107982,
      status: InquiryStatus.QUOTED,
    }));
  });

  it('rejects auto quote when backend server delta is non-scalar', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      status: InquiryStatus.REVIEWING,
      estimated_price: 107982,
      pricing_snapshot: {
        source: 'server',
        verifiedBy: 'backend',
        serverDelta: [0],
        total: 107982,
      },
    });

    await expect(service.sendQuote('inq-1', 107982, 'auto', 'auto_verified')).rejects.toThrow();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects auto quote when verified estimate totals are non-scalar', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      status: InquiryStatus.REVIEWING,
      estimated_price: [107982],
      pricing_snapshot: {
        source: 'server',
        verifiedBy: 'backend',
        serverDelta: 0,
        total: [107982],
      },
    });

    await expect(service.sendQuote('inq-1', 107982, 'auto', 'auto_verified')).rejects.toThrow();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects unsafe inquiry ids before sending quotes', async () => {
    const { service, repo } = makeService();

    await expect(service.sendQuote('../inq-1', 107982, 'auto')).rejects.toThrow('ID');
    await expect(service.sendQuote(['inq-1'] as any, 107982, 'auto')).rejects.toThrow('ID');

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects unknown quote sources before loading inquiries', async () => {
    const { service, repo } = makeService();

    await expect(service.sendQuote('inq-1', 107982, 'auto', 'imported' as any)).rejects.toThrow('эх сурвалж');
    await expect(service.sendQuote('inq-1', 107982, 'auto', { source: 'manual' } as any)).rejects.toThrow('эх сурвалж');
    await expect(service.sendQuote('inq-1', 107982, 'auto', ['manual'] as any)).rejects.toThrow('эх сурвалж');

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('sanitizes quote notes before saving and writing system messages', async () => {
    const { service, repo, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      status: InquiryStatus.REVIEWING,
      estimated_price: 107982,
      pricing_snapshot: {
        source: 'server',
        verifiedBy: 'backend',
        serverDelta: 0,
        total: 107982,
      },
    });

    await service.sendQuote(' inq-1 ', 107982, ` ${'n'.repeat(1200)} `, 'auto_verified');

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      admin_notes: 'n'.repeat(1000),
    }));
    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      inquiry_id: 'inq-1',
      content: `Үнийн санал: 107,982₮. ${'n'.repeat(1000)}`,
    }));
  });

  it('normalizes control characters in system messages before saving', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      status: InquiryStatus.REVIEWING,
      estimated_price: 107982,
      pricing_snapshot: {
        source: 'server',
        verifiedBy: 'backend',
        serverDelta: 0,
        total: 107982,
      },
    });

    await service.sendQuote('inq-1', 107982, 'line1\r\n\tline2\0\u0007', 'auto_verified');

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      content: 'Үнийн санал: 107,982₮. line1 line2',
    }));
  });

  it('rejects quoted status update when no quote price exists', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      quoted_price: null,
    });

    await expect(service.updateStatus('inq-1', InquiryStatus.QUOTED)).rejects.toThrow('Үнэ илгээх');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects unsafe inquiry ids before status updates', async () => {
    const { service, repo } = makeService();

    await expect(service.updateStatus('../inq-1', InquiryStatus.REVIEWING)).rejects.toThrow('ID');

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects unknown status values before loading inquiries', async () => {
    const { service, repo } = makeService();

    await expect(service.updateStatus('inq-1', 'archived' as InquiryStatus)).rejects.toThrow('төлөв');
    await expect(service.updateStatus('inq-1', { status: InquiryStatus.REVIEWING } as any)).rejects.toThrow('төлөв');
    await expect(service.updateStatus('inq-1', [InquiryStatus.REVIEWING] as any)).rejects.toThrow('төлөв');

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('allows quoted status update when quote price already exists', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      quoted_price: 107982,
    });

    await service.updateStatus('inq-1', InquiryStatus.QUOTED);

    expect(repo.update).toHaveBeenCalledWith('inq-1', { status: InquiryStatus.QUOTED });
  });

  it('rejects status updates after inquiry is cancelled', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      status: InquiryStatus.CANCELLED,
      quoted_price: 107982,
    });

    await expect(service.updateStatus('inq-1', InquiryStatus.REVIEWING)).rejects.toThrow('Цуцлагдсан');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects status updates after inquiry is completed', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      status: InquiryStatus.COMPLETED,
      quoted_price: 107982,
    });

    await expect(service.updateStatus('inq-1', InquiryStatus.REVIEWING)).rejects.toThrow('Дууссан');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects cancelling an inquiry after production starts', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      status: InquiryStatus.IN_WORK,
      quoted_price: 107982,
    });

    await expect(service.updateStatus('inq-1', InquiryStatus.CANCELLED)).rejects.toThrow('Үйлдвэрлэл эхэлсэн');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects confirmed status update when no quote price exists', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      quoted_price: null,
    });

    await expect(service.updateStatus('inq-1', InquiryStatus.CONFIRMED)).rejects.toThrow('үнийн санал');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects quoted and confirmed status updates when quote price is non-scalar', async () => {
    const { service, repo, setInquiryToFind } = makeService();

    for (const status of [InquiryStatus.QUOTED, InquiryStatus.CONFIRMED]) {
      repo.update.mockClear();
      setInquiryToFind({
        id: 'inq-1',
        quoted_price: [107982],
      });

      await expect(service.updateStatus('inq-1', status)).rejects.toThrow();
      expect(repo.update).not.toHaveBeenCalled();
    }
  });

  it('allows confirmed status update when quote price exists', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      quoted_price: 107982,
    });

    await service.updateStatus('inq-1', InquiryStatus.CONFIRMED);

    expect(repo.update).toHaveBeenCalledWith('inq-1', { status: InquiryStatus.CONFIRMED });
  });

  it('sanitizes status update notes before saving admin notes', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      quoted_price: 107982,
    });

    await service.updateStatus('inq-1', InquiryStatus.CONFIRMED, ` ${'s'.repeat(1200)} `);

    expect(repo.update).toHaveBeenCalledWith('inq-1', {
      status: InquiryStatus.CONFIRMED,
      admin_notes: 's'.repeat(1000),
    });
  });

  it('rejects in-work status update before confirmation', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      status: InquiryStatus.QUOTED,
      quoted_price: 107982,
    });

    await expect(service.updateStatus('inq-1', InquiryStatus.IN_WORK)).rejects.toThrow('баталгаажуулах');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('allows in-work status update after confirmation', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      status: InquiryStatus.CONFIRMED,
      quoted_price: 107982,
    });

    await service.updateStatus('inq-1', InquiryStatus.IN_WORK);

    expect(repo.update).toHaveBeenCalledWith('inq-1', { status: InquiryStatus.IN_WORK });
  });

  it('rejects completed status update before production starts', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      status: InquiryStatus.CONFIRMED,
      quoted_price: 107982,
    });

    await expect(service.updateStatus('inq-1', InquiryStatus.COMPLETED)).rejects.toThrow('үйлдвэрлэл');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('allows completed status update after production starts', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      status: InquiryStatus.IN_WORK,
      quoted_price: 107982,
    });

    await service.updateStatus('inq-1', InquiryStatus.COMPLETED);

    expect(repo.update).toHaveBeenCalledWith('inq-1', { status: InquiryStatus.COMPLETED });
  });

  it('normalizes admin assignment ids before saving', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1' });

    await service.assign(' inq-1 ', ' admin-1 ');

    expect(repo.update).toHaveBeenCalledWith('inq-1', {
      assigned_to: 'admin-1',
      status: InquiryStatus.REVIEWING,
    });
  });

  it('rejects unsafe admin assignment ids before saving', async () => {
    const { service, repo } = makeService();

    await expect(service.assign('inq-1', '../admin-1')).rejects.toThrow('ID');
    await expect(service.assign(['inq-1'] as any, 'admin-1')).rejects.toThrow('ID');
    await expect(service.assign('inq-1', { id: 'admin-1' } as any)).rejects.toThrow('ID');

    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects admin assignment when the inquiry is missing', async () => {
    const { service, repo } = makeService();

    await expect(service.assign('inq-1', 'admin-1')).rejects.toThrow('Захиалга');

    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects admin assignment for started, completed, or cancelled inquiries', async () => {
    const { service, repo, setInquiryToFind } = makeService();

    for (const status of [InquiryStatus.IN_WORK, InquiryStatus.COMPLETED, InquiryStatus.CANCELLED]) {
      repo.update.mockClear();
      setInquiryToFind({ id: 'inq-1', status });

      await expect(service.assign('inq-1', 'admin-1')).rejects.toThrow('дахин оноох боломжгүй');

      expect(repo.update).not.toHaveBeenCalled();
    }
  });

  it('normalizes customer ids before querying customer inquiries', async () => {
    const { service, repo } = makeService();

    await service.findByCustomer(' customer-1 ');

    expect(repo.find).toHaveBeenCalledWith({
      where: { customer_id: 'customer-1' },
      order: { created_at: 'DESC' },
    });
  });

  it('rejects unsafe customer ids before querying customer inquiries', async () => {
    const { service, repo } = makeService();

    expect(() => service.findByCustomer('../customer-1')).toThrow('ID');
    expect(() => service.findByCustomer('customer\u0007-1')).toThrow('ID');
    expect(() => service.findByCustomer(['customer-1'] as any)).toThrow('ID');
    expect(() => service.findByCustomer({ id: 'customer-1' } as any)).toThrow('ID');

    expect(repo.find).not.toHaveBeenCalled();
  });

  it('returns only vendor-scoped inquiry query for vendor dashboard', async () => {
    const { service, qbs } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
      }],
    });

    await service.findForVendor('user-good');

    expect(qbs[0].where).toHaveBeenCalledWith(expect.stringContaining('i.vendor_id = :vendorId'), {
      vendorId: 'vendor-good',
      userId: 'user-good',
    });
    expect(qbs[0].where).toHaveBeenCalledWith(expect.stringContaining('i.vendor_user_id = :userId'), expect.any(Object));
    expect(qbs[0].orderBy).toHaveBeenCalledWith('i.created_at', 'DESC');
  });

  it('filters vendor dashboard open opportunities by services and floor price', async () => {
    const { service, repo, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        services: ['banner'],
        floor_prices: { banner: 1000 },
        commission_rate: 15,
      }],
    });
    repo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [
        {
          id: 'assigned-sticker',
          vendor_id: 'vendor-good',
          vendor_user_id: null,
          is_broadcast: false,
          category: 'sticker',
          product_name: 'Sticker',
          estimated_price: 100,
        },
        {
          id: 'open-sticker',
          vendor_id: null,
          vendor_user_id: null,
          is_broadcast: false,
          category: 'sticker',
          product_name: 'Sticker',
          estimated_price: 100000,
        },
        {
          id: 'open-low-banner',
          vendor_id: null,
          vendor_user_id: null,
          is_broadcast: false,
          category: 'banner',
          product_name: 'Banner',
          estimated_price: 100,
        },
        {
          id: 'open-banner',
          vendor_id: null,
          vendor_user_id: null,
          is_broadcast: false,
          category: 'banner',
          product_name: 'Banner',
          estimated_price: 107982,
        },
      ]),
    } as any);

    const result = await service.findForVendor('user-good');

    expect(result.map(item => item.id)).toEqual(['assigned-sticker', 'open-banner']);
  });

  it('normalizes persisted vendor assignment ids before vendor dashboard filtering', async () => {
    const { service, repo } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        services: ['banner'],
      }],
    });
    repo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [
        {
          id: 'assigned-by-vendor',
          vendor_id: ' vendor-good ',
          vendor_user_id: null,
          is_broadcast: false,
          category: 'sticker',
          product_name: 'Sticker',
        },
        {
          id: 'assigned-by-user',
          vendor_id: null,
          vendor_user_id: ' user-good ',
          is_broadcast: false,
          category: 'sticker',
          product_name: 'Sticker',
        },
        {
          id: 'broadcast-target',
          vendor_id: null,
          vendor_user_id: null,
          is_broadcast: true,
          broadcast_vendor_ids: [{ id: 'bad' }, ' vendor-good '],
          category: 'banner',
          product_name: 'Banner',
        },
      ]),
    } as any);

    const result = await service.findForVendor('user-good');

    expect(result.map(item => item.id)).toEqual(['assigned-by-vendor', 'assigned-by-user', 'broadcast-target']);
  });

  it('tracks an inquiry by number without exposing sensitive fields', async () => {
    const { service, repo, setInquiryToFind } = makeService();
    const createdAt = new Date('2026-05-24T00:00:00.000Z');
    setInquiryToFind({
      inquiry_number: 'INQ-123',
      status: InquiryStatus.QUOTED,
      product_name: 'Banner',
      created_at: createdAt,
      quoted_price: 120000,
      customer_phone: '99112233',
      files: [{ url: '/api/uploads/inquiries/job.pdf' }],
    } as any);

    const result = await service.trackByNumber(' inq-123 ');

    expect(result).toEqual({
      found: true,
      inquiry_number: 'INQ-123',
      status: InquiryStatus.QUOTED,
      product_name: 'Banner',
      created_at: createdAt,
      quoted_price: 120000,
    });
    expect(repo.findOne).toHaveBeenCalledWith({ where: { inquiry_number: 'INQ-123' } });
  });

  it('returns not found for empty or missing tracking numbers', async () => {
    const { service, repo } = makeService();

    await expect(service.trackByNumber('')).resolves.toEqual({ found: false });
    await expect(service.trackByNumber('../INQ-123')).resolves.toEqual({ found: false });
    await expect(service.trackByNumber('INQ-abc')).resolves.toEqual({ found: false });
    await expect(service.trackByNumber(`INQ-${'1'.repeat(40)}`)).resolves.toEqual({ found: false });
    await expect(service.trackByNumber({ number: 'INQ-123' } as any)).resolves.toEqual({ found: false });
    await expect(service.trackByNumber(['INQ-123'] as any)).resolves.toEqual({ found: false });
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  it('sanitizes public tracking result product and quote fields', async () => {
    const { service, setInquiryToFind } = makeService();
    const createdAt = new Date('2026-01-01T00:00:00Z');
    setInquiryToFind({
      inquiry_number: 'INQ-123',
      status: InquiryStatus.QUOTED,
      product_name: { name: 'Banner' },
      created_at: createdAt,
      quoted_price: [120000],
    } as any);

    await expect(service.trackByNumber('INQ-123')).resolves.toEqual({
      found: true,
      inquiry_number: 'INQ-123',
      status: InquiryStatus.QUOTED,
      product_name: '',
      created_at: createdAt,
      quoted_price: null,
    });
  });

  it('sanitizes public tracking metadata fields', async () => {
    const { service, setInquiryToFind } = makeService();
    setInquiryToFind({
      inquiry_number: ' INQ\r\n-123\u0007 ',
      status: { value: InquiryStatus.QUOTED },
      product_name: 'Banner',
      created_at: { iso: '2026-01-01T00:00:00Z' },
      quoted_price: 120000,
    } as any);

    await expect(service.trackByNumber('INQ-123')).resolves.toEqual({
      found: true,
      inquiry_number: 'INQ -123',
      status: undefined,
      product_name: 'Banner',
      created_at: undefined,
      quoted_price: 120000,
    });
  });

  it('falls back to the requested tracking number when persisted inquiry number is non-scalar', async () => {
    const { service, setInquiryToFind } = makeService();
    setInquiryToFind({
      inquiry_number: { value: 'INQ-123' },
      status: InquiryStatus.REVIEWING,
      product_name: 'Banner',
      quoted_price: 120000,
    } as any);

    await expect(service.trackByNumber(' inq-123 ')).resolves.toEqual({
      found: true,
      inquiry_number: 'INQ-123',
      status: InquiryStatus.REVIEWING,
      product_name: 'Banner',
      created_at: undefined,
      quoted_price: 120000,
    });
  });

  it('returns full inquiry details to the owning customer', async () => {
    const { service, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      customer_id: 'customer-1',
      customer_phone: '99112233',
      files: [{ url: '/secret.pdf', name: 'secret.pdf' }],
      pricing_snapshot: { total: 120000 },
    } as any);

    const result = await service.findOneForUser('inq-1', { id: 'customer-1', role: 'customer' });

    expect(result).toMatchObject({
      customer_phone: '99112233',
      files: [{ url: '/secret.pdf', name: 'secret.pdf' }],
      pricing_snapshot: { total: 120000 },
    });
  });

  it('normalizes persisted customer ids before full inquiry permission checks', async () => {
    const { service, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      customer_id: ' customer-1 ',
      customer_phone: '99112233',
      files: [{ url: '/secret.pdf', name: 'secret.pdf' }],
      pricing_snapshot: { total: 120000 },
    } as any);

    const result = await service.findOneForUser('inq-1', { id: 'customer-1', role: 'customer' });

    expect(result).toMatchObject({
      customer_phone: '99112233',
      files: [{ url: '/secret.pdf', name: 'secret.pdf' }],
      pricing_snapshot: { total: 120000 },
    });
  });

  it('normalizes persisted vendor user ids before full inquiry permission checks', async () => {
    const { service, vendorRepo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      vendor_user_id: ' vendor-user-1 ',
      customer_phone: '99112233',
      files: [{ url: '/secret.pdf', name: 'secret.pdf' }],
      pricing_snapshot: { total: 120000 },
    } as any);

    const result = await service.findOneForUser('inq-1', { id: 'vendor-user-1', role: 'vendor' });

    expect(result).toMatchObject({
      customer_phone: '99112233',
      files: [{ url: '/secret.pdf', name: 'secret.pdf' }],
      pricing_snapshot: { total: 120000 },
    });
    expect(vendorRepo.findOne).not.toHaveBeenCalled();
  });

  it('masks inquiry details when fallback vendor record has an unsafe id', async () => {
    const { service, setInquiryToFind } = makeService({
      vendors: [{
        id: '../vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      inquiry_number: 'INQ-1',
      vendor_id: '../vendor-good',
      customer_phone: '99112233',
      files: [{ url: '/secret.pdf', name: 'secret.pdf' }],
      pricing_snapshot: { total: 120000 },
    } as any);

    const result = await service.findOneForUser('inq-1', { id: 'user-good', role: 'vendor' });

    expect(result).toMatchObject({
      id: 'inq-1',
      inquiry_number: 'INQ-1',
      files: [],
      pricing_snapshot: undefined,
    });
    expect(result).not.toHaveProperty('customer_phone');
  });

  it('normalizes request user ids before inquiry permission checks', async () => {
    const { service, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      customer_id: 'customer-1',
      customer_phone: '99112233',
      files: [{ url: '/secret.pdf', name: 'secret.pdf' }],
    } as any);

    const result = await service.findOneForUser('inq-1', { id: ' customer-1 ', role: 'customer' });

    expect(result).toMatchObject({
      customer_phone: '99112233',
      files: [{ url: '/secret.pdf', name: 'secret.pdf' }],
    });
  });

  it('masks inquiry details for unsafe request user ids', async () => {
    const { service, vendorRepo, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      inquiry_number: 'INQ-1',
      customer_id: 'customer-1',
      customer_phone: '99112233',
      files: [{ url: '/secret.pdf', name: 'secret.pdf' }],
    } as any);

    const result = await service.findOneForUser('inq-1', { id: '../customer-1', role: 'customer' });

    expect(result).toMatchObject({
      id: 'inq-1',
      inquiry_number: 'INQ-1',
      files: [],
    });
    expect(result).not.toHaveProperty('customer_phone');
    expect(vendorRepo.findOne).not.toHaveBeenCalled();
  });

  it('masks sensitive inquiry details for public reads', async () => {
    const { service, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      inquiry_number: 'INQ-1',
      customer_id: 'customer-1',
      customer_name: 'Test User',
      customer_company: 'Secret LLC',
      customer_phone: '99112233',
      customer_email: 'test@example.com',
      notes: 'private note',
      preferred_contact: 'viber',
      files: [{ url: '/secret.pdf', name: 'secret.pdf' }],
      pricing_snapshot: { total: 120000 },
      admin_notes: 'internal',
      vendor_id: 'vendor-1',
      delivery_address: 'secret address',
    } as any);

    const result = await service.findOneForUser('inq-1');

    expect(result).toMatchObject({
      id: 'inq-1',
      inquiry_number: 'INQ-1',
      files: [],
      pricing_snapshot: undefined,
    });
    expect(result).not.toHaveProperty('customer_name');
    expect(result).not.toHaveProperty('customer_company');
    expect(result).not.toHaveProperty('customer_phone');
    expect(result).not.toHaveProperty('customer_email');
    expect(result).not.toHaveProperty('notes');
    expect(result).not.toHaveProperty('preferred_contact');
    expect(result).not.toHaveProperty('admin_notes');
    expect(result).not.toHaveProperty('vendor_id');
    expect(result).not.toHaveProperty('delivery_address');
  });

  it('uses the sanitized route id for public reads when persisted id is unsafe', async () => {
    const { service, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: '../dirty-inq',
      inquiry_number: 'INQ-1',
      customer_id: 'customer-1',
      files: [{ url: '/secret.pdf', name: 'secret.pdf' }],
    } as any);

    const result = await service.findOneForUser(' inq-1 ');

    expect(result).toMatchObject({
      id: 'inq-1',
      inquiry_number: 'INQ-1',
      files: [],
    });
  });

  it('sanitizes public inquiry number and drops invalid status values', async () => {
    const { service, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      inquiry_number: ' INQ\r\n-1\u0007 ',
      status: { value: InquiryStatus.QUOTED },
      customer_id: 'customer-1',
      files: [{ url: '/secret.pdf', name: 'secret.pdf' }],
    } as any);

    const result = await service.findOneForUser('inq-1');

    expect(result).toMatchObject({
      id: 'inq-1',
      inquiry_number: 'INQ -1',
      status: undefined,
      files: [],
    });
  });

  it('drops invalid public inquiry timestamps', async () => {
    const { service, setInquiryToFind } = makeService();
    const updatedAt = new Date('2026-01-02T00:00:00Z');
    setInquiryToFind({
      id: 'inq-1',
      inquiry_number: 'INQ-1',
      status: InquiryStatus.REVIEWING,
      created_at: { iso: '2026-01-01T00:00:00Z' },
      updated_at: updatedAt,
      customer_id: 'customer-1',
      files: [{ url: '/secret.pdf', name: 'secret.pdf' }],
    } as any);

    const result = await service.findOneForUser('inq-1');

    expect(result).toMatchObject({
      id: 'inq-1',
      created_at: undefined,
      updated_at: updatedAt,
      files: [],
    });
  });

  it('sanitizes public inquiry product and price fields', async () => {
    const { service, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      inquiry_number: 'INQ-1',
      customer_id: 'customer-1',
      product_id: { id: 'product-1' },
      product_name: { name: 'Banner' },
      category: ['banner'],
      quantity: ['10'],
      size_label: { label: '1000x2000' },
      width_mm: [1000],
      height_mm: '2000',
      paper_type: { name: 'Vinyl' },
      color_mode: ['CMYK'],
      sides: { value: 'double' },
      finishing: [' Grommet\r\n ', { bad: true }, 123],
      has_design: ['true'],
      needs_design: { value: 'yes' },
      quoted_price: [120000],
      estimated_price: { value: 107982 },
      files: [{ url: '/secret.pdf', name: 'secret.pdf' }],
    } as any);

    const result = await service.findOneForUser('inq-1');

    expect(result).toMatchObject({
      product_id: '',
      product_name: '',
      category: '',
      quantity: 0,
      size_label: '',
      width_mm: null,
      height_mm: 2000,
      paper_type: '',
      color_mode: '',
      sides: 'single',
      finishing: ['Grommet', '123'],
      has_design: false,
      needs_design: false,
      quoted_price: null,
      estimated_price: null,
      files: [],
    });
  });

  it('strips control characters from public scalar inquiry fields', async () => {
    const { service, setInquiryToFind } = makeService();
    setInquiryToFind({
      id: 'inq-1',
      inquiry_number: 'INQ-1',
      product_id: ' product\r\n-1\u0007 ',
      product_name: ' Banner\r\nPremium\u0007 ',
      category: ' Wide\tFormat\u0000 ',
      size_label: ' 1000x2000\r\nmm ',
      paper_type: ' Vinyl\t440gsm\u0007 ',
      color_mode: ' CMYK\r\n ',
      files: [],
    } as any);

    const result = await service.findOneForUser('inq-1');

    expect(result).toMatchObject({
      product_id: 'product -1',
      product_name: 'Banner Premium',
      category: 'Wide Format',
      size_label: '1000x2000 mm',
      paper_type: 'Vinyl 440gsm',
      color_mode: 'CMYK',
    });
  });

  it('resolves inquiry upload only for users allowed to read the inquiry', async () => {
    const { service, repo } = makeService();
    const inquiry = {
      id: 'inq-1',
      customer_id: 'customer-1',
      files: [{ url: '/api/uploads/inquiries/job.pdf', name: 'job.pdf' }],
    };
    const qb = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [inquiry]),
    };
    repo.createQueryBuilder.mockReturnValueOnce(qb as any);

    const result = await service.resolveInquiryUpload('job.pdf', { id: 'customer-1', role: 'customer' });

    expect(result.filename).toBe('job.pdf');
    expect(result.absolutePath).toContain('uploads');
    expect(qb.where).toHaveBeenCalledWith(
      '(i.files::text LIKE :filename OR i.files::text LIKE :encodedFilename)',
      { filename: '%job.pdf%', encodedFilename: '%job.pdf%' },
    );
  });

  it('normalizes persisted customer ids before resolving owner inquiry uploads', async () => {
    const { service, repo } = makeService();
    repo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [{
        id: 'inq-1',
        customer_id: ' customer-1 ',
        files: [{ url: '/api/uploads/inquiries/job.pdf', name: 'job.pdf' }],
      }]),
    } as any);

    const result = await service.resolveInquiryUpload('job.pdf', { id: 'customer-1', role: 'customer' });

    expect(result.filename).toBe('job.pdf');
    expect(result.absolutePath).toContain('uploads');
  });

  it('escapes LIKE wildcards when querying upload filenames', async () => {
    const { service, repo, chatRepo } = makeService();
    const inquiryQb = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => []),
    };
    const messageQb = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => []),
    };
    repo.createQueryBuilder.mockReturnValueOnce(inquiryQb as any);
    chatRepo.createQueryBuilder.mockReturnValueOnce(messageQb as any);

    await expect(service.resolveInquiryUpload('job_1.pdf', { id: 'customer-1', role: 'customer' }))
      .rejects.toThrow();

    expect(inquiryQb.where).toHaveBeenCalledWith(
      '(i.files::text LIKE :filename OR i.files::text LIKE :encodedFilename)',
      { filename: '%job\\_1.pdf%', encodedFilename: '%job\\_1.pdf%' },
    );
    expect(messageQb.where).toHaveBeenCalledWith(
      '(m.attachments::text LIKE :filename OR m.attachments::text LIKE :encodedFilename)',
      { filename: '%job\\_1.pdf%', encodedFilename: '%job\\_1.pdf%' },
    );
  });

  it('normalizes persisted vendor ids before resolving vendor inquiry uploads', async () => {
    const { service, repo } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'vendor-user-1',
      }],
    });
    repo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [{
        id: 'inq-1',
        vendor_id: ' vendor-good ',
        files: [{ url: '/api/uploads/inquiries/job.pdf', name: 'job.pdf' }],
      }]),
    } as any);

    const result = await service.resolveInquiryUpload('job.pdf', { id: 'vendor-user-1', role: 'vendor' });

    expect(result.filename).toBe('job.pdf');
    expect(result.absolutePath).toContain('uploads');
  });

  it('resolves inquiry uploads from encoded stored URL filenames', async () => {
    const { service, repo } = makeService();
    const inquiry = {
      id: 'inq-1',
      customer_id: 'customer-1',
      files: [{ url: '/api/uploads/inquiries/stored%20file.pdf', name: 'stored file.pdf' }],
    };
    const qb = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [inquiry]),
    };
    repo.createQueryBuilder.mockReturnValueOnce(qb as any);

    const result = await service.resolveInquiryUpload('stored%20file.pdf', { id: 'customer-1', role: 'customer' });

    expect(result.filename).toBe('stored file.pdf');
    expect(result.absolutePath).toContain('stored file.pdf');
    expect(qb.where).toHaveBeenCalledWith(
      '(i.files::text LIKE :filename OR i.files::text LIKE :encodedFilename)',
      { filename: '%stored file.pdf%', encodedFilename: '%stored\\%20file.pdf%' },
    );
  });

  it('blocks public access to inquiry uploads', async () => {
    const { service, repo } = makeService();
    repo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [{
      id: 'inq-1',
      customer_id: 'customer-1',
      files: [{ url: '/api/uploads/inquiries/job.pdf', name: 'job.pdf' }],
      }]),
    } as any);

    await expect(service.resolveInquiryUpload('job.pdf')).rejects.toThrow('эрхгүй');
  });

  it('does not authorize inquiry uploads from partial filename matches', async () => {
    const { service, repo, chatRepo } = makeService();
    repo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [{
        id: 'inq-1',
        customer_id: 'customer-1',
        files: [{ url: '/api/uploads/inquiries/job.pdf.bak', name: 'job.pdf.bak' }],
      }]),
    } as any);
    chatRepo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => []),
    } as any);

    await expect(service.resolveInquiryUpload('job.pdf', { id: 'customer-1', role: 'customer' }))
      .rejects.toThrow('олдсонгүй');
  });

  it('does not resolve uploads by original display name without a matching stored URL filename', async () => {
    const { service, repo, chatRepo } = makeService();
    repo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [{
        id: 'inq-1',
        customer_id: 'customer-1',
        files: [{ url: '/api/uploads/inquiries/1700000000.pdf', name: 'job.pdf' }],
      }]),
    } as any);
    chatRepo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => []),
    } as any);

    await expect(service.resolveInquiryUpload('job.pdf', { id: 'customer-1', role: 'customer' }))
      .rejects.toThrow('олдсонгүй');
  });

  it('resolves the accessible inquiry when multiple inquiries share the same filename', async () => {
    const { service, repo, chatRepo } = makeService();
    repo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [
        {
          id: 'inq-other',
          customer_id: 'customer-other',
          files: [{ url: '/api/uploads/inquiries/job.pdf', name: 'job.pdf' }],
        },
        {
          id: 'inq-own',
          customer_id: 'customer-1',
          files: [{ url: '/api/uploads/inquiries/job.pdf', name: 'job.pdf' }],
        },
      ]),
    } as any);
    chatRepo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => []),
    } as any);

    const result = await service.resolveInquiryUpload('job.pdf', { id: 'customer-1', role: 'customer' });

    expect(result.filename).toBe('job.pdf');
  });

  it('skips unsafe message inquiry ids while resolving upload attachments', async () => {
    const { service, repo, chatRepo, setInquiryToFind } = makeService();
    repo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => []),
    } as any);
    chatRepo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [
        {
          inquiry_id: '../dirty-inq',
          attachments: [{ url: '/api/uploads/inquiries/job.pdf', name: 'job.pdf' }],
        },
        {
          inquiry_id: 'inq-1',
          attachments: [{ url: '/api/uploads/inquiries/job.pdf', name: 'job.pdf' }],
        },
      ]),
    } as any);
    setInquiryToFind({
      id: 'inq-1',
      customer_id: 'customer-1',
    } as any);

    const result = await service.resolveInquiryUpload('job.pdf', { id: 'customer-1', role: 'customer' });

    expect(result.filename).toBe('job.pdf');
  });

  it('returns forbidden instead of throwing raw id errors for unsafe attachment inquiry ids', async () => {
    const { service, repo, chatRepo } = makeService();
    repo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => []),
    } as any);
    chatRepo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [{
        inquiry_id: '../dirty-inq',
        attachments: [{ url: '/api/uploads/inquiries/job.pdf', name: 'job.pdf' }],
      }]),
    } as any);

    await expect(service.resolveInquiryUpload('job.pdf', { id: 'customer-1', role: 'customer' }))
      .rejects.toThrow('эрхгүй');
  });

  it('rejects unsafe inquiry upload filenames', async () => {
    const { service } = makeService();

    await expect(service.resolveInquiryUpload('../job.pdf', { id: 'customer-1' })).rejects.toThrow('Файлын нэр');
  });

  it('rejects backslash variants in inquiry upload filenames before querying', async () => {
    const { service, repo } = makeService();

    await expect(service.resolveInquiryUpload('..\\job.pdf', { id: 'customer-1' })).rejects.toThrow();
    await expect(service.resolveInquiryUpload('..%5Cjob.pdf', { id: 'customer-1' })).rejects.toThrow();
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('rejects percent wildcard variants in inquiry upload filenames before querying', async () => {
    const { service, repo } = makeService();

    await expect(service.resolveInquiryUpload('job%.pdf', { id: 'customer-1' })).rejects.toThrow();
    await expect(service.resolveInquiryUpload('job%25.pdf', { id: 'customer-1' })).rejects.toThrow();
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('rejects reserved device inquiry upload filenames before querying', async () => {
    const { service, repo } = makeService();

    await expect(service.resolveInquiryUpload('CON.pdf', { id: 'customer-1' })).rejects.toThrow();
    await expect(service.resolveInquiryUpload('nul.zip', { id: 'customer-1' })).rejects.toThrow();
    await expect(service.resolveInquiryUpload('CON .pdf', { id: 'customer-1' })).rejects.toThrow();
    await expect(service.resolveInquiryUpload('LPT1..zip', { id: 'customer-1' })).rejects.toThrow();
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('rejects non-scalar inquiry upload filenames before querying', async () => {
    const { service, repo } = makeService();

    await expect(service.resolveInquiryUpload({ filename: 'job.pdf' } as any, { id: 'customer-1' })).rejects.toThrow();
    await expect(service.resolveInquiryUpload(['job.pdf'] as any, { id: 'customer-1' })).rejects.toThrow();
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('ignores non-scalar stored upload URLs while resolving inquiry uploads', async () => {
    const { service, repo, chatRepo } = makeService();
    repo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [{
        id: 'inq-1',
        customer_id: 'customer-1',
        files: [{ url: { value: '/api/uploads/inquiries/job.pdf' }, name: 'job.pdf' }],
      }]),
    } as any);
    chatRepo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => []),
    } as any);

    await expect(service.resolveInquiryUpload('job.pdf', { id: 'customer-1', role: 'customer' }))
      .rejects.toThrow();
  });

  it('handles numeric stored upload URLs without throwing type errors', async () => {
    const { service, repo, chatRepo } = makeService();
    repo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [{
        id: 'inq-1',
        customer_id: 'customer-1',
        files: [{ url: 12345, name: 'job.pdf' }],
      }]),
    } as any);
    chatRepo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => []),
    } as any);

    await expect(service.resolveInquiryUpload('job.pdf', { id: 'customer-1', role: 'customer' }))
      .rejects.toThrow();
  });

  it('rejects inquiry upload filenames with disallowed extensions', async () => {
    const { service } = makeService();

    await expect(service.resolveInquiryUpload('malware.exe', { id: 'customer-1' })).rejects.toThrow('Файлын нэр');
  });

  it('rejects encoded unsafe inquiry upload filenames before querying', async () => {
    const { service, repo } = makeService();

    await expect(service.resolveInquiryUpload('..%2Fjob.pdf', { id: 'customer-1' })).rejects.toThrow();
    await expect(service.resolveInquiryUpload('job%07.pdf', { id: 'customer-1' })).rejects.toThrow();
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('does not resolve unsafe decoded stored upload URL filenames', async () => {
    const { service, repo, chatRepo } = makeService();
    repo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [{
        id: 'inq-1',
        customer_id: 'customer-1',
        files: [{ url: '/api/uploads/inquiries/job%07.pdf', name: 'job.pdf' }],
      }]),
    } as any);
    chatRepo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => []),
    } as any);

    await expect(service.resolveInquiryUpload('job.pdf', { id: 'customer-1', role: 'customer' }))
      .rejects.toThrow('олдсонгүй');
  });

  it('ignores malformed encoded stored upload URL filenames without crashing', async () => {
    const { service, repo, chatRepo } = makeService();
    repo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [{
        id: 'inq-1',
        customer_id: 'customer-1',
        files: [{ url: '/api/uploads/inquiries/job%E0%A4%A.pdf', name: 'job.pdf' }],
      }]),
    } as any);
    chatRepo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => []),
    } as any);

    await expect(service.resolveInquiryUpload('job.pdf', { id: 'customer-1', role: 'customer' }))
      .rejects.toThrow('олдсонгүй');
  });

  it('rejects malformed encoded inquiry upload filenames with a readable message', async () => {
    const { service, repo } = makeService();

    await expect(service.resolveInquiryUpload('job%E0%A4%A.pdf', { id: 'customer-1' }))
      .rejects.toThrow('Файлын нэр');
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('rejects oversized inquiry upload filenames before querying', async () => {
    const { service, repo } = makeService();

    await expect(service.resolveInquiryUpload(`${'a'.repeat(221)}.pdf`, { id: 'customer-1' })).rejects.toThrow();
    await expect(service.resolveInquiryUpload(`${'b'.repeat(181)}.pdf`, { id: 'customer-1' })).rejects.toThrow();
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('hides messages from public reads for registered-customer inquiries', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: 'customer-1' } as any);

    const result = await service.getMessagesForUser('inq-1');

    expect(result).toEqual([]);
    expect(chatRepo.find).not.toHaveBeenCalled();
  });

  it('normalizes persisted customer ids before full inquiry message reads', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: ' customer-1 ' } as any);

    await service.getMessagesForUser('inq-1', { id: 'customer-1', role: 'customer' });

    expect(chatRepo.find).toHaveBeenCalledWith({
      where: { inquiry_id: 'inq-1' },
      order: { created_at: 'ASC' },
    });
  });

  it('returns only system inquiry messages for public guest inquiries', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.getMessagesForUser('inq-1');

    expect(chatRepo.find).toHaveBeenCalledWith({
      where: { inquiry_id: 'inq-1', is_system: true },
      order: { created_at: 'ASC' },
    });
  });

  it('rejects unsafe inquiry ids before reading inquiry messages', async () => {
    const { service, chatRepo } = makeService();

    await expect(service.getMessagesForUser('../inq-1')).rejects.toThrow('ID');
    await expect(service.getMessagesForUser({ id: 'inq-1' } as any)).rejects.toThrow('ID');

    expect(chatRepo.find).not.toHaveBeenCalled();
  });

  it('allows public messages only for guest inquiries without a customer owner', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: 'hello',
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      inquiry_id: 'inq-1',
      sender_id: 'guest',
      content: 'hello',
    }));
  });

  it('trims inquiry message content before saving', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: '  hello  ',
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      content: 'hello',
    }));
  });

  it('normalizes control characters in inquiry message content before saving', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: '  hello\r\n\tworld\0\u0007  ',
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      content: 'hello world',
    }));
  });

  it('collapses repeated whitespace in inquiry message content before saving', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: 'hello     world',
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      content: 'hello world',
    }));
  });

  it('normalizes sender name and role before saving inquiry messages', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: ` ${'x'.repeat(120)} `,
      senderRole: 'superuser',
      content: 'hello',
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      sender_name: 'x'.repeat(80),
      sender_role: 'customer',
    }));
  });

  it('defaults non-scalar sender roles before saving inquiry messages', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: { role: 'admin' } as any,
      content: 'hello',
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      sender_role: 'customer',
    }));
  });

  it('removes unsafe characters from sender names before saving inquiry messages', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: '  Bad\r\n<Name>/User  ',
      senderRole: 'customer',
      content: 'hello',
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      sender_name: 'Bad  _Name__User',
    }));
  });

  it('strips non-whitespace control characters from sender names before saving inquiry messages', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: ' Good\u0007Name\u001F/Bad ',
      senderRole: 'customer',
      content: 'hello',
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      sender_name: 'GoodName_Bad',
    }));
  });

  it('defaults non-scalar sender names before saving inquiry messages', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: { name: 'Guest' } as any,
      senderRole: 'customer',
      content: 'hello',
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      sender_name: 'Харилцагч',
    }));
  });

  it('normalizes sender id before saving inquiry messages', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: ` user-1\r\n${'x'.repeat(160)} `,
      senderName: 'Guest',
      senderRole: 'customer',
      content: 'hello',
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      sender_id: `user-1${'x'.repeat(114)}`,
    }));
  });

  it('removes path separators from sender ids before saving inquiry messages', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: '../vendor\\user',
      senderName: 'Guest',
      senderRole: 'customer',
      content: 'hello',
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      sender_id: '.._vendor_user',
    }));
  });

  it('strips non-whitespace control characters from sender ids before saving inquiry messages', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: ' user\u0007-1\u001F/vendor ',
      senderName: 'Guest',
      senderRole: 'customer',
      content: 'hello',
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      sender_id: 'user-1_vendor',
    }));
  });

  it('defaults blank sender id before saving inquiry messages', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: '   ',
      senderName: 'Guest',
      senderRole: 'customer',
      content: 'hello',
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      sender_id: 'guest',
    }));
  });

  it('defaults non-scalar sender ids before saving inquiry messages', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: { id: 'user-1' } as any,
      senderName: 'Guest',
      senderRole: 'customer',
      content: 'hello',
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      sender_id: 'guest',
    }));
  });

  it('rejects unsafe inquiry ids before saving inquiry messages', async () => {
    const { service, chatRepo } = makeService();

    await expect(service.sendMessage({
      inquiryId: '../inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: 'hello',
    })).rejects.toThrow('ID');

    expect(chatRepo.save).not.toHaveBeenCalled();
  });

  it('sanitizes inquiry message attachments before saving', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: '',
      attachments: [{
        name: '../bad"name\r\n.pdf',
        type: 'not-a-mime',
        url: '/api/uploads/inquiries/stored%20file.pdf',
        extra: '<script>',
      }],
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [{
        name: '.._bad_name  .pdf',
        type: 'application/octet-stream',
        url: '/api/uploads/inquiries/stored%20file.pdf',
      }],
    }));
  });

  it('normalizes inquiry message attachment URLs to one safe encoded filename segment', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: '',
      attachments: [{
        name: 'stored file.pdf',
        type: 'application/pdf',
        url: '/api/uploads/inquiries/stored file.pdf',
      }],
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [expect.objectContaining({
        type: 'application/pdf',
        url: '/api/uploads/inquiries/stored%20file.pdf',
      })],
    }));
  });

  it('drops inquiry message attachment URLs with reserved device filenames', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    for (const filename of ['CON.pdf', 'NUL .zip', 'LPT1..pdf']) {
      await expect(service.sendMessage({
        inquiryId: 'inq-1',
        senderId: 'guest',
        senderName: 'Guest',
        senderRole: 'customer',
        content: '',
        attachments: [{
          name: filename,
          type: 'application/pdf',
          url: `/api/uploads/inquiries/${encodeURIComponent(filename)}`,
        }],
      })).rejects.toThrow();
    }

    expect(chatRepo.save).not.toHaveBeenCalled();
  });

  it('strips non-whitespace control characters from inquiry message attachment names', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: '',
      attachments: [{
        name: 'bad\u0007name\u001F/design.pdf',
        type: 'application/pdf',
        url: '/api/uploads/inquiries/stored.pdf',
      }],
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [expect.objectContaining({
        name: 'badname_design.pdf',
      })],
    }));
  });

  it('defaults non-scalar inquiry message attachment names before saving', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: '',
      attachments: [{
        name: { value: 'stored.pdf' },
        type: 'application/pdf',
        url: '/api/uploads/inquiries/stored.pdf',
      }],
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [expect.objectContaining({
        name: 'file',
      })],
    }));
  });

  it('defaults non-scalar inquiry message attachment MIME types before saving', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: '',
      attachments: [{
        name: 'stored.pdf',
        type: { value: 'application/pdf' },
        url: '/api/uploads/inquiries/stored.pdf',
      }],
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [expect.objectContaining({
        type: 'application/octet-stream',
      })],
    }));
  });

  it('rejects inquiry messages with only oversized attachment URLs', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await expect(service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: '',
      attachments: [{
        name: 'stored.pdf',
        type: 'application/pdf',
        url: `/api/uploads/inquiries/${'a'.repeat(280)}.pdf`,
      }],
    })).rejects.toThrow();
    expect(chatRepo.save).not.toHaveBeenCalled();
  });

  it('rejects attachment URLs whose encoded safe filename would be truncated', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await expect(service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: '',
      attachments: [{
        name: 'stored.pdf',
        type: 'application/pdf',
        url: `/api/uploads/inquiries/${' '.repeat(120)}.pdf`,
      }],
    })).rejects.toThrow();
    expect(chatRepo.save).not.toHaveBeenCalled();
  });

  it('falls back when inquiry message attachment MIME is not allowed', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: '',
      attachments: [{
        name: 'stored.pdf',
        type: 'text/html',
        url: '/api/uploads/inquiries/stored.pdf',
      }],
    });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [expect.objectContaining({
        type: 'application/octet-stream',
      })],
    }));
  });

  it('rejects inquiry messages with only invalid attachments', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await expect(service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: '',
      attachments: [{ name: 'bad.pdf', type: 'application/pdf', url: 'https://evil.test/bad.pdf' }],
    })).rejects.toThrow('хоосон');
    expect(chatRepo.save).not.toHaveBeenCalled();
  });

  it('rejects non-object inquiry messages before lookup', async () => {
    const { service, repo, chatRepo } = makeService();

    await expect(service.sendMessage(null as any)).rejects.toThrow('ID');
    await expect(service.sendMessage(['inq-1'] as any)).rejects.toThrow('ID');

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(chatRepo.save).not.toHaveBeenCalled();
  });

  it('rejects inquiry messages with only path traversal attachment URLs', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await expect(service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: '',
      attachments: [{ name: 'bad.pdf', type: 'application/pdf', url: '/api/uploads/inquiries/../bad.pdf' }],
    })).rejects.toThrow('хоосон');
    expect(chatRepo.save).not.toHaveBeenCalled();
  });

  it('rejects inquiry messages with only control-character attachment URLs', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await expect(service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: '',
      attachments: [{ name: 'bad.pdf', type: 'application/pdf', url: '/api/uploads/inquiries/bad\u0007.pdf' }],
    })).rejects.toThrow('хоосон');
    expect(chatRepo.save).not.toHaveBeenCalled();
  });

  it('rejects inquiry messages with only non-scalar attachment URLs', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await expect(service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: '',
      attachments: [{ name: 'bad.pdf', type: 'application/pdf', url: { value: '/api/uploads/inquiries/bad.pdf' } }],
    })).rejects.toThrow('хоосон');
    expect(chatRepo.save).not.toHaveBeenCalled();
  });

  it('rejects inquiry messages with only disallowed attachment URL extensions', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await expect(service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: '',
      attachments: [{ name: 'bad.exe', type: 'application/octet-stream', url: '/api/uploads/inquiries/bad.exe' }],
    })).rejects.toThrow('хоосон');
    expect(chatRepo.save).not.toHaveBeenCalled();
  });

  it('rejects inquiry messages longer than 5000 characters', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await expect(service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: 'x'.repeat(5001),
    })).rejects.toThrow('5000');
    expect(chatRepo.save).not.toHaveBeenCalled();
  });

  it('rejects inquiry messages with non-scalar content and no valid attachments', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await expect(service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: { text: 'hello' } as any,
    })).rejects.toThrow('хоосон');
    expect(chatRepo.save).not.toHaveBeenCalled();
  });

  it('rejects inquiry messages with more than three attachments', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: null } as any);

    await expect(service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: '',
      attachments: [{}, {}, {}, {}],
    })).rejects.toThrow('3-аас');
    expect(chatRepo.save).not.toHaveBeenCalled();
  });

  it('blocks public messages for inquiries owned by a registered customer', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: 'customer-1' } as any);

    await expect(service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'guest',
      senderName: 'Guest',
      senderRole: 'customer',
      content: 'hello',
    })).rejects.toThrow('эрхгүй');
    expect(chatRepo.save).not.toHaveBeenCalled();
  });

  it('normalizes persisted customer ids before allowing owner messages', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: ' customer-1 ' } as any);

    await service.sendMessage({
      inquiryId: 'inq-1',
      senderId: 'customer-1',
      senderName: 'Customer',
      senderRole: 'customer',
      content: 'hello',
    }, { id: 'customer-1', role: 'customer' });

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      inquiry_id: 'inq-1',
      sender_id: 'customer-1',
      content: 'hello',
    }));
  });

  it('allows the owning customer to mark inquiry messages as read', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: 'customer-1' } as any);

    const result = await service.markReadForUser('inq-1', { id: 'customer-1', role: 'customer' });

    expect(result).toEqual({ ok: true });
    expect(chatRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ inquiry_id: 'inq-1', is_read: false }),
      { is_read: true },
    );
    expect(((chatRepo.update.mock.calls as any)[0][0] as any).sender_role).toMatchObject({
      _value: ['admin', 'vendor', 'system'],
    });
  });

  it('normalizes persisted customer ids before marking owner messages as read', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: ' customer-1 ' } as any);

    const result = await service.markReadForUser(' inq-1 ', { id: 'customer-1', role: 'customer' });

    expect(result).toEqual({ ok: true });
    expect(chatRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ inquiry_id: 'inq-1', is_read: false }),
      { is_read: true },
    );
    expect(((chatRepo.update.mock.calls as any)[0][0] as any).sender_role).toMatchObject({
      _value: ['admin', 'vendor', 'system'],
    });
  });

  it('marks only customer messages as read when admin opens an inquiry', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: 'customer-1' } as any);

    await service.markReadForUser('inq-1', { id: 'admin-1', role: 'admin' });

    expect(((chatRepo.update.mock.calls as any)[0][0] as any).sender_role).toMatchObject({
      _value: ['customer'],
    });
  });

  it('marks customer and admin messages as read when vendor opens an inquiry', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'vendor-user-1',
      }],
    });
    setInquiryToFind({ id: 'inq-1', vendor_id: 'vendor-good' } as any);

    await service.markReadForUser('inq-1', { id: 'vendor-user-1', role: 'vendor' });

    expect(((chatRepo.update.mock.calls as any)[0][0] as any).sender_role).toMatchObject({
      _value: ['customer', 'admin', 'system'],
    });
  });

  it('normalizes persisted vendor ids before marking vendor messages as read', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'vendor-user-1',
      }],
    });
    setInquiryToFind({ id: 'inq-1', vendor_id: ' vendor-good ' } as any);

    await service.markReadForUser(' inq-1 ', { id: 'vendor-user-1', role: 'vendor' });

    expect(chatRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ inquiry_id: 'inq-1', is_read: false }),
      { is_read: true },
    );
    expect(((chatRepo.update.mock.calls as any)[0][0] as any).sender_role).toMatchObject({
      _value: ['customer', 'admin', 'system'],
    });
  });

  it('blocks unrelated users from marking inquiry messages as read', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService();
    setInquiryToFind({ id: 'inq-1', customer_id: 'customer-1' } as any);

    await expect(service.markReadForUser('inq-1', { id: 'customer-2', role: 'customer' })).rejects.toThrow('эрхгүй');
    expect(chatRepo.update).not.toHaveBeenCalled();
  });

  it('rejects unsafe inquiry ids before marking messages as read', async () => {
    const { service, chatRepo } = makeService();

    await expect(service.markReadForUser('../inq-1', { id: 'customer-1', role: 'customer' })).rejects.toThrow('ID');
    await expect(service.markReadForUser(['inq-1'] as any, { id: 'customer-1', role: 'customer' })).rejects.toThrow('ID');

    expect(chatRepo.update).not.toHaveBeenCalled();
  });

  it('counts confirmed assigned inquiries as vendor pending work', async () => {
    const { service, qbs } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
      }],
    });

    await service.getVendorPendingCount('user-good');

    expect(qbs[0].andWhere).toHaveBeenCalledWith('i.status IN (:...statuses)', {
      statuses: [InquiryStatus.NEW, InquiryStatus.REVIEWING, InquiryStatus.CONFIRMED],
    });
    expect(qbs[0].getMany).toHaveBeenCalled();
  });

  it('filters vendor pending count by services and floor price', async () => {
    const { service, repo } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        services: ['banner'],
        floor_prices: { banner: 1000 },
        commission_rate: 15,
      }],
    });
    repo.createQueryBuilder.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [
        {
          id: 'assigned-sticker',
          vendor_id: 'vendor-good',
          vendor_user_id: null,
          is_broadcast: false,
          category: 'sticker',
          estimated_price: 100,
        },
        {
          id: 'open-sticker',
          vendor_id: null,
          vendor_user_id: null,
          is_broadcast: false,
          category: 'sticker',
          estimated_price: 100000,
        },
        {
          id: 'open-low-banner',
          vendor_id: null,
          vendor_user_id: null,
          is_broadcast: false,
          category: 'banner',
          estimated_price: 100,
        },
        {
          id: 'open-banner',
          vendor_id: null,
          vendor_user_id: null,
          is_broadcast: false,
          category: 'banner',
          estimated_price: 107982,
        },
      ]),
    } as any);

    await expect(service.getVendorPendingCount('user-good')).resolves.toBe(2);
  });

  it('uses normalized vendor record ids for pending count queries', async () => {
    const { service, qbs } = makeService({
      vendors: [{
        id: ' vendor-good ',
        company_name: 'Good Print',
        user_id: 'user-good',
      }],
    });

    await service.getVendorPendingCount('user-good');

    expect(qbs[0].andWhere).toHaveBeenCalledWith(expect.stringContaining('i.vendor_id = :vendorId'), {
      vendorId: 'vendor-good',
    });
  });

  it('normalizes vendor dashboard user ids before querying', async () => {
    const { service, qbs } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
      }],
    });

    await service.findForVendor(' user-good ');

    expect(qbs[0].where).toHaveBeenCalledWith(expect.stringContaining('i.vendor_user_id = :userId'), {
      vendorId: 'vendor-good',
      userId: 'user-good',
    });
  });

  it('uses normalized vendor record ids for vendor dashboard queries', async () => {
    const { service, qbs } = makeService({
      vendors: [{
        id: ' vendor-good ',
        company_name: 'Good Print',
        user_id: 'user-good',
      }],
    });

    await service.findForVendor('user-good');

    expect(qbs[0].where).toHaveBeenCalledWith(expect.stringContaining('i.vendor_id = :vendorId'), {
      vendorId: 'vendor-good',
      userId: 'user-good',
    });
  });

  it('rejects unsafe vendor user ids before vendor dashboard queries', async () => {
    const { service, repo, vendorRepo } = makeService();

    await expect(service.getVendorPendingCount('../user-good')).rejects.toThrow('Vendor хэрэглэгчийн ID');
    await expect(service.findForVendor('user/good')).rejects.toThrow('Vendor хэрэглэгчийн ID');
    await expect(service.getVendorPendingCount('user\u0007-good')).rejects.toThrow('Vendor хэрэглэгчийн ID');
    await expect(service.findForVendor({ id: 'user-good' } as any)).rejects.toThrow('Vendor хэрэглэгчийн ID');

    await expect(service.getVendorPendingCount(['user-good'] as any)).rejects.toThrow('Vendor');

    expect(vendorRepo.findOne).not.toHaveBeenCalled();
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('rejects unsafe inquiry ids before vendor accept lookup', async () => {
    const { service, repo, vendorRepo } = makeService();

    await expect(service.vendorAccept('../inq-1', 'user-good')).rejects.toThrow('ID');
    await expect(service.vendorAccept(['inq-1'] as any, 'user-good')).rejects.toThrow('ID');

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(vendorRepo.findOne).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('blocks vendor accept when inquiry belongs to another vendor', async () => {
    const { service, repo, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      vendor_id: 'other-vendor',
      vendor_accepted: false,
      is_broadcast: false,
    } as any);

    await expect(service.vendorAccept('inq-1', 'user-good')).rejects.toThrow('оноогдоогүй');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('blocks vendor accept when matched vendor record has an unsafe id', async () => {
    const { service, repo, commissionService, setInquiryToFind } = makeService({
      vendors: [{
        id: '../vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      vendor_id: '../vendor-good',
      vendor_accepted: false,
      is_broadcast: false,
      status: InquiryStatus.CONFIRMED,
      quoted_price: 120000,
    } as any);

    await expect(service.vendorAccept('inq-1', 'user-good')).rejects.toThrow('Vendor');
    expect(repo.update).not.toHaveBeenCalled();
    expect(commissionService.create).not.toHaveBeenCalled();
  });

  it('normalizes persisted broadcast vendor ids before vendor access checks', async () => {
    const { service, repo, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        services: ['banner'],
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Banner',
      vendor_id: null,
      vendor_accepted: false,
      is_broadcast: true,
      broadcast_vendor_ids: [{ id: 'vendor-bad' }, '../vendor-bad', ' vendor-good ', 'vendor-good'],
      status: InquiryStatus.CONFIRMED,
      estimated_price: 107982,
      quoted_price: 107982,
    } as any);

    await service.vendorAccept('inq-1', 'user-good');

    expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 'inq-1',
      vendor_accepted: false,
      status: InquiryStatus.CONFIRMED,
    }), expect.objectContaining({
      vendor_id: 'vendor-good',
      vendor_user_id: 'user-good',
      vendor_accepted: true,
      status: InquiryStatus.IN_WORK,
    }));
  });

  it('accepts assigned inquiry with the real vendor id', async () => {
    const { service, repo, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      vendor_id: 'vendor-good',
      vendor_accepted: false,
      is_broadcast: false,
      status: InquiryStatus.CONFIRMED,
      estimated_price: 107982,
      quoted_price: 107982,
    } as any);

    await service.vendorAccept('inq-1', 'user-good');

    expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 'inq-1',
      vendor_accepted: false,
      status: InquiryStatus.CONFIRMED,
    }), expect.objectContaining({
      vendor_id: 'vendor-good',
      vendor_user_id: 'user-good',
      vendor_accepted: true,
      status: InquiryStatus.IN_WORK,
    }));
  });

  it('normalizes vendor accept ids before updating accepted inquiries and side effects', async () => {
    const { service, repo, chatRepo, commissionService, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
      }],
    });
    setInquiryToFind({
      id: '../dirty-inq',
      vendor_id: ' vendor-good ',
      vendor_accepted: false,
      is_broadcast: false,
      status: InquiryStatus.CONFIRMED,
      quoted_price: 120000,
    } as any);

    await service.vendorAccept(' inq-1 ', ' user-good ');

    expect(repo.update).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
      vendor_id: 'vendor-good',
      vendor_user_id: 'user-good',
    }));
    expect(commissionService.create).toHaveBeenCalledWith(expect.objectContaining({
      inquiryId: 'inq-1',
      vendorId: 'user-good',
    }));
    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      inquiry_id: 'inq-1',
      sender_role: 'system',
    }));
  });

  it('rejects invalid vendor user ids before vendor lookup', async () => {
    const { service, repo } = makeService();

    await expect(service.getVendorPendingCount(' '.repeat(3))).rejects.toThrow('Vendor хэрэглэгчийн ID');
    await expect(service.findForVendor('x'.repeat(121))).rejects.toThrow('Vendor хэрэглэгчийн ID');

    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('blocks vendor accept when confirmed inquiry has no quoted price', async () => {
    const { service, repo, commissionService, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      vendor_id: 'vendor-good',
      vendor_accepted: false,
      is_broadcast: false,
      status: InquiryStatus.CONFIRMED,
      estimated_price: 107982,
      quoted_price: null,
    } as any);

    await expect(service.vendorAccept('inq-1', 'user-good')).rejects.toThrow('үнийн санал');
    expect(repo.update).not.toHaveBeenCalled();
    expect(commissionService.create).not.toHaveBeenCalled();
  });

  it('blocks vendor accept when quoted price is non-scalar', async () => {
    const { service, repo, commissionService, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      vendor_id: 'vendor-good',
      vendor_accepted: false,
      is_broadcast: false,
      status: InquiryStatus.CONFIRMED,
      estimated_price: 107982,
      quoted_price: [120000],
    } as any);

    await expect(service.vendorAccept('inq-1', 'user-good')).rejects.toThrow();
    expect(repo.update).not.toHaveBeenCalled();
    expect(commissionService.create).not.toHaveBeenCalled();
  });

  it('uses quoted price before estimate when creating vendor commission', async () => {
    const { service, commissionService, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      vendor_id: 'vendor-good',
      vendor_accepted: false,
      is_broadcast: false,
      status: InquiryStatus.CONFIRMED,
      estimated_price: 107982,
      quoted_price: 120000,
    } as any);

    await service.vendorAccept('inq-1', 'user-good');

    expect(commissionService.create).toHaveBeenCalledWith(expect.objectContaining({
      inquiryId: 'inq-1',
      vendorId: 'user-good',
      grossAmount: 120000,
    }));
  });

  it('blocks vendor accept when vendor services do not match the inquiry product', async () => {
    const { service, repo, commissionService, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-sticker',
        company_name: 'Sticker Print',
        user_id: 'user-sticker',
        services: ['sticker'],
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Banner',
      vendor_id: 'vendor-sticker',
      vendor_accepted: false,
      is_broadcast: false,
      status: InquiryStatus.CONFIRMED,
      quoted_price: 120000,
    } as any);

    await expect(service.vendorAccept('inq-1', 'user-sticker')).rejects.toThrow('төрлийг');
    expect(repo.update).not.toHaveBeenCalled();
    expect(commissionService.create).not.toHaveBeenCalled();
  });

  it('blocks vendor accept when quoted price is below vendor floor price', async () => {
    const { service, repo, commissionService, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-expensive',
        company_name: 'Expensive Print',
        user_id: 'user-expensive',
        services: ['banner'],
        floor_prices: { banner: 200000 },
        commission_rate: 15,
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Banner',
      vendor_id: 'vendor-expensive',
      vendor_accepted: false,
      is_broadcast: false,
      status: InquiryStatus.CONFIRMED,
      quoted_price: 107982,
    } as any);

    await expect(service.vendorAccept('inq-1', 'user-expensive')).rejects.toThrow('доод үнэ');
    expect(repo.update).not.toHaveBeenCalled();
    expect(commissionService.create).not.toHaveBeenCalled();
  });

  it('blocks vendor accept when atomic update loses a broadcast race', async () => {
    const { service, repo, commissionService, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      vendor_id: null,
      broadcast_vendor_ids: ['vendor-good', 'vendor-next'],
      vendor_accepted: false,
      is_broadcast: true,
      status: InquiryStatus.CONFIRMED,
      quoted_price: 120000,
    } as any);
    repo.update.mockResolvedValueOnce({ affected: 0 });

    await expect(service.vendorAccept('inq-1', 'user-good')).rejects.toThrow('аль хэдийн');
    expect(commissionService.create).not.toHaveBeenCalled();
  });

  it('blocks duplicate vendor accept for an already accepted inquiry', async () => {
    const { service, repo, commissionService, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      vendor_id: 'vendor-good',
      vendor_accepted: true,
      is_broadcast: false,
      status: InquiryStatus.CONFIRMED,
      quoted_price: 120000,
    } as any);

    await expect(service.vendorAccept('inq-1', 'user-good')).rejects.toThrow('аль хэдийн');
    expect(repo.update).not.toHaveBeenCalled();
    expect(commissionService.create).not.toHaveBeenCalled();
  });

  it('blocks vendor accept before inquiry is confirmed', async () => {
    const { service, repo, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      vendor_id: 'vendor-good',
      vendor_accepted: false,
      is_broadcast: false,
      status: InquiryStatus.QUOTED,
    } as any);

    await expect(service.vendorAccept('inq-1', 'user-good')).rejects.toThrow('батлагдсан');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('reassigns to the next vendor when assigned vendor rejects', async () => {
    const { service, repo, notificationsGateway, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          services: ['banner'],
        },
        {
          id: 'vendor-next',
          company_name: 'Next Print',
          user_id: 'user-next',
          services: ['banner'],
        },
      ],
    });
    setInquiryToFind({
      id: '../dirty-inq',
      category: 'banner',
      product_name: 'Баннер',
      vendor_id: 'vendor-good',
      vendor_accepted: false,
      is_broadcast: false,
      reassign_count: 0,
    } as any);

    await service.vendorReject(' inq-1 ', 'user-good');

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      vendor_id: 'vendor-next',
      vendor_user_id: undefined,
      vendor_accepted: false,
      reassign_count: 1,
      sla_missed_vendor_id: 'vendor-good',
      status: InquiryStatus.REVIEWING,
    }));
    expect(notificationsGateway.notifyVendorNewInquiry).toHaveBeenCalledWith('user-next', expect.objectContaining({ id: 'inq-1' }));
  });

  it('emails the next vendor with sanitized payload when assigned vendor rejects', async () => {
    const { service, mailService, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          services: ['banner'],
        },
        {
          id: 'vendor-next',
          company_name: ' Next\r\nPrint\0 ',
          user_id: 'user-next',
          contact_email: ' next@example.com ',
          services: ['banner'],
        },
      ],
    });
    setInquiryToFind({
      id: '../dirty-inq',
      category: 'banner',
      product_name: ' Banner\u0007 Deluxe ',
      quantity: ['10'],
      estimated_price: { value: 107982 },
      customer_name: ' Test\u0007 User ',
      vendor_id: 'vendor-good',
      vendor_accepted: false,
      is_broadcast: false,
      reassign_count: 0,
    } as any);

    await service.vendorReject(' inq-1 ', 'user-good');

    expect(mailService.sendVendorNewInquiry).toHaveBeenCalledWith(
      { email: 'next@example.com', name: 'Next Print' },
      expect.objectContaining({
        id: 'inq-1',
        productName: 'Banner Deluxe',
        quantity: 0,
        estimatedPrice: 0,
        customerName: 'Test User',
      }),
    );
  });

  it('skips invalid next vendor emails when assigned vendor rejects', async () => {
    const { service, mailService, notificationsGateway, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          services: ['banner'],
        },
        {
          id: 'vendor-next',
          company_name: 'Next Print',
          user_id: 'user-next',
          contact_email: 'bad-email\r\n@example',
          services: ['banner'],
        },
      ],
    });
    setInquiryToFind({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Banner',
      vendor_id: 'vendor-good',
      vendor_accepted: false,
      is_broadcast: false,
      reassign_count: 0,
    } as any);

    await service.vendorReject('inq-1', 'user-good');

    expect(notificationsGateway.notifyVendorNewInquiry).toHaveBeenCalledWith(
      'user-next',
      expect.objectContaining({ id: 'inq-1' }),
    );
    expect(mailService.sendVendorNewInquiry).not.toHaveBeenCalled();
  });

  it('normalizes non-scalar reassign counts when assigned vendor rejects', async () => {
    const { service, repo, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          services: ['banner'],
        },
        {
          id: 'vendor-next',
          company_name: 'Next Print',
          user_id: 'user-next',
          services: ['banner'],
        },
      ],
    });
    setInquiryToFind({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Banner',
      vendor_id: 'vendor-good',
      vendor_accepted: false,
      is_broadcast: false,
      reassign_count: { value: 2 },
    } as any);

    await service.vendorReject('inq-1', 'user-good');

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      vendor_id: 'vendor-next',
      reassign_count: 1,
      sla_missed_vendor_id: 'vendor-good',
    }));
  });

  it('rejects unsafe inquiry ids before vendor reject lookup', async () => {
    const { service, repo, vendorRepo } = makeService();

    await expect(service.vendorReject('../inq-1', 'user-good')).rejects.toThrow('ID');
    await expect(service.vendorReject(['inq-1'] as any, 'user-good')).rejects.toThrow('ID');

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(vendorRepo.findOne).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('blocks vendor reject when matched vendor record has an unsafe id', async () => {
    const { service, repo, setInquiryToFind } = makeService({
      vendors: [{
        id: '../vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        services: ['banner'],
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Banner',
      vendor_id: '../vendor-good',
      vendor_accepted: false,
      is_broadcast: false,
    } as any);

    await expect(service.vendorReject('inq-1', 'user-good')).rejects.toThrow('Vendor');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('notifies admins when vendor rejects and no alternative vendor exists', async () => {
    const { service, repo, notificationsGateway, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        services: ['banner'],
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Баннер',
      vendor_id: ' vendor-good ',
      vendor_accepted: false,
      is_broadcast: false,
    } as any);

    await service.vendorReject('inq-1', 'user-good');

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      vendor_id: undefined,
      vendor_accepted: false,
      status: InquiryStatus.REVIEWING,
    }));
    expect(notificationsGateway.notifyAdmins).toHaveBeenCalledWith(expect.objectContaining({
      type: 'vendor_rejected_no_alternative',
      inquiryId: 'inq-1',
    }));
  });

  it('blocks vendor reject after work has started', async () => {
    const { service, repo, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      vendor_id: 'vendor-good',
      vendor_accepted: true,
      is_broadcast: false,
      status: InquiryStatus.IN_WORK,
    } as any);

    await expect(service.vendorReject('inq-1', 'user-good')).rejects.toThrow('татгалзах боломжгүй');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('removes rejecting vendor from broadcast candidate list', async () => {
    const { service, repo, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          services: ['banner'],
        },
        {
          id: 'vendor-next',
          company_name: 'Next Print',
          user_id: 'user-next',
          services: ['banner'],
        },
      ],
    });
    setInquiryToFind({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Banner',
      estimated_price: 107982,
      vendor_id: null,
      vendor_accepted: false,
      is_broadcast: true,
      broadcast_vendor_ids: ['vendor-good', 'vendor-next'],
    } as any);

    await service.vendorReject('inq-1', 'user-good');

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      broadcast_vendor_ids: ['vendor-next'],
      vendor_accepted: false,
      status: InquiryStatus.REVIEWING,
    }));
  });

  it('removes stale or ineligible vendors from broadcast list when a vendor rejects', async () => {
    const { service, repo, notificationsGateway, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          services: ['banner'],
        },
        {
          id: 'vendor-sticker',
          company_name: 'Sticker Print',
          user_id: 'user-sticker',
          services: ['sticker'],
        },
        {
          id: 'vendor-expensive',
          company_name: 'Expensive Print',
          user_id: 'user-expensive',
          services: ['banner'],
          floor_prices: { banner: 200000 },
          commission_rate: 15,
        },
      ],
    });
    setInquiryToFind({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Banner',
      estimated_price: 107982,
      vendor_id: null,
      vendor_accepted: false,
      is_broadcast: true,
      broadcast_vendor_ids: ['vendor-good', 'vendor-sticker', '../bad', 'vendor-expensive'],
    } as any);

    await service.vendorReject('inq-1', 'user-good');

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      broadcast_vendor_ids: [],
      vendor_accepted: false,
      status: InquiryStatus.REVIEWING,
    }));
    expect(notificationsGateway.notifyAdmins).toHaveBeenCalledWith(expect.objectContaining({
      type: 'vendor_broadcast_all_rejected',
      inquiryId: 'inq-1',
    }));
  });

  it('caps persisted broadcast candidate cleanup during vendor rejection', async () => {
    const vendors = [
      {
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        services: ['banner'],
      },
      ...Array.from({ length: 60 }, (_, index) => ({
        id: `vendor-${index}`,
        company_name: `Vendor ${index}`,
        user_id: `user-${index}`,
        services: ['banner'],
      })),
    ];
    const { service, repo, vendorRepo, setInquiryToFind } = makeService({ vendors });
    setInquiryToFind({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Banner',
      estimated_price: 107982,
      vendor_id: null,
      vendor_accepted: false,
      is_broadcast: true,
      broadcast_vendor_ids: ['vendor-good', ...Array.from({ length: 60 }, (_, index) => `vendor-${index}`)],
    } as any);

    await service.vendorReject('inq-1', 'user-good');

    expect(vendorRepo.findOne).toHaveBeenCalledTimes(51);
    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      broadcast_vendor_ids: Array.from({ length: 50 }, (_, index) => `vendor-${index}`),
    }));
  });

  it('rejects manual assignment to incomplete vendor records', async () => {
    const { service, repo } = makeService({
      vendors: [{
        id: 'vendor-incomplete',
        company_name: '',
        user_id: '',
        contact_email: '',
      }],
    });

    await expect(service.assignVendor('inq-1', 'vendor-incomplete')).rejects.toThrow('дутуу');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects manual assignment when inquiry does not exist', async () => {
    const { service, repo, notificationsGateway } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        contact_email: '',
      }],
    });

    await expect(service.assignVendor('missing-inq', 'vendor-good')).rejects.toThrow('олдсонгүй');

    expect(repo.update).not.toHaveBeenCalled();
    expect(notificationsGateway.notifyVendorNewInquiry).not.toHaveBeenCalled();
  });

  it('rejects manual assignment for started, completed, or cancelled inquiries', async () => {
    const { service, repo, notificationsGateway, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        contact_email: '',
      }],
    });

    for (const status of [InquiryStatus.IN_WORK, InquiryStatus.COMPLETED, InquiryStatus.CANCELLED]) {
      repo.update.mockClear();
      notificationsGateway.notifyVendorNewInquiry.mockClear();
      setInquiryToFind({
        id: 'inq-1',
        category: 'banner',
        product_name: 'Banner',
        status,
      } as any);

      await expect(service.assignVendor('inq-1', 'vendor-good')).rejects.toThrow('дахин оноох боломжгүй');

      expect(repo.update).not.toHaveBeenCalled();
      expect(notificationsGateway.notifyVendorNewInquiry).not.toHaveBeenCalled();
    }
  });

  it('normalizes manual assignment vendor ids before lookup and save', async () => {
    const { service, repo, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        contact_email: '',
      }],
    });
    setInquiryToFind({ id: 'inq-1', category: 'banner', product_name: 'Banner' } as any);

    await service.assignVendor('inq-1', ' vendor-good ');

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      vendor_id: 'vendor-good',
    }));
  });

  it('uses the sanitized route inquiry id in manual assignment realtime notifications', async () => {
    const { service, notificationsGateway, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        contact_email: '',
      }],
    });
    setInquiryToFind({ id: '../dirty-inq', category: 'banner', product_name: 'Banner' } as any);

    await service.assignVendor(' inq-1 ', 'vendor-good');

    expect(notificationsGateway.notifyVendorNewInquiry).toHaveBeenCalledWith(
      'user-good',
      expect.objectContaining({ id: 'inq-1' }),
    );
  });

  it('drops unsafe vendor realtime user ids during manual assignment but still emails', async () => {
    const { service, mailService, notificationsGateway, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: '../user-good',
        contact_email: ' Vendor@Example.COM ',
        services: ['banner'],
      }],
    });
    setInquiryToFind({ id: '../dirty-inq', category: 'banner', product_name: 'Banner' } as any);

    await service.assignVendor(' inq-1 ', 'vendor-good');

    expect(notificationsGateway.notifyVendorNewInquiry).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ id: 'inq-1' }),
    );
    expect(mailService.sendVendorNewInquiry).toHaveBeenCalledWith(
      { email: 'vendor@example.com', name: 'Good Print' },
      expect.objectContaining({ id: 'inq-1' }),
    );
  });

  it('sanitizes manual assignment vendor email payload fields', async () => {
    const { service, mailService, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        contact_email: 'vendor@example.com',
        services: ['banner'],
      }],
    });
    setInquiryToFind({
      id: '../dirty-inq',
      category: 'banner',
      product_name: ' Banner\u0007 Deluxe ',
      quantity: { value: 3 },
      estimated_price: '107982.5',
      customer_name: ' Test\u0007 User ',
    } as any);

    await service.assignVendor(' inq-1 ', 'vendor-good');

    expect(mailService.sendVendorNewInquiry).toHaveBeenCalledWith(
      { email: 'vendor@example.com', name: 'Good Print' },
      expect.objectContaining({
        id: 'inq-1',
        productName: 'Banner Deluxe',
        quantity: 0,
        estimatedPrice: 107982.5,
        customerName: 'Test User',
      }),
    );
  });

  it('rejects manual assignment when vendor floor price is above inquiry price', async () => {
    const { service, repo, notificationsGateway, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-expensive',
        company_name: 'Expensive Print',
        user_id: 'user-expensive',
        contact_email: '',
        floor_prices: { banner: 200000 },
        commission_rate: 15,
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Banner',
      estimated_price: 107982,
    } as any);

    await expect(service.assignVendor('inq-1', 'vendor-expensive')).rejects.toThrow('доод үнэ');

    expect(repo.update).not.toHaveBeenCalled();
    expect(notificationsGateway.notifyVendorNewInquiry).not.toHaveBeenCalled();
  });

  it('uses quoted price before estimate for manual assignment floor checks', async () => {
    const { service, repo, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        contact_email: '',
        floor_prices: { banner: 100000 },
        commission_rate: 15,
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Banner',
      estimated_price: 100000,
      quoted_price: 130000,
    } as any);

    await service.assignVendor('inq-1', 'vendor-good');

    expect(repo.update).toHaveBeenCalledWith('inq-1', expect.objectContaining({
      vendor_id: 'vendor-good',
    }));
  });

  it('ignores invalid quoted prices instead of bypassing manual assignment floor checks', async () => {
    const { service, repo, notificationsGateway, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-expensive',
        company_name: 'Expensive Print',
        user_id: 'user-expensive',
        contact_email: '',
        floor_prices: { banner: 100000 },
        commission_rate: 15,
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Banner',
      estimated_price: 100000,
      quoted_price: -1,
    } as any);

    await expect(service.assignVendor('inq-1', 'vendor-expensive')).rejects.toThrow('доод үнэ');

    expect(repo.update).not.toHaveBeenCalled();
    expect(notificationsGateway.notifyVendorNewInquiry).not.toHaveBeenCalled();
  });

  it('rejects manual assignment when vendor services do not match the inquiry product', async () => {
    const { service, repo, notificationsGateway, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-sticker',
        company_name: 'Sticker Print',
        user_id: 'user-sticker',
        contact_email: '',
        services: ['sticker'],
      }],
    });
    setInquiryToFind({
      id: 'inq-1',
      category: 'banner',
      product_name: 'Banner',
      estimated_price: 107982,
    } as any);

    await expect(service.assignVendor('inq-1', 'vendor-sticker')).rejects.toThrow('төрлийг');

    expect(repo.update).not.toHaveBeenCalled();
    expect(notificationsGateway.notifyVendorNewInquiry).not.toHaveBeenCalled();
  });

  it('rejects invalid manual assignment vendor ids before lookup', async () => {
    const { service, repo, vendorRepo } = makeService();

    await expect(service.assignVendor('inq-1', ' '.repeat(3))).rejects.toThrow('Vendor ID');
    await expect(service.assignVendor('inq-1', 'x'.repeat(121))).rejects.toThrow('Vendor ID');
    await expect(service.assignVendor('inq-1', '../vendor-good')).rejects.toThrow('Vendor ID');
    await expect(service.assignVendor('inq-1', 'vendor\u0007-good')).rejects.toThrow('Vendor ID');
    await expect(service.assignVendor('inq-1', ['vendor-good'] as any)).rejects.toThrow('Vendor ID');
    await expect(service.assignVendor('inq-1', { id: 'vendor-good' } as any)).rejects.toThrow('Vendor ID');

    expect(vendorRepo.findOne).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects unsafe inquiry ids before manual assignment vendor lookup', async () => {
    const { service, repo, vendorRepo } = makeService();

    await expect(service.assignVendor('../inq-1', 'vendor-good')).rejects.toThrow('ID');

    expect(vendorRepo.findOne).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('sanitizes manual vendor assignment notes before writing system messages', async () => {
    const { service, chatRepo, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        contact_email: '',
      }],
    });
    setInquiryToFind({ id: 'inq-1', category: 'banner', product_name: 'Banner' } as any);

    await service.assignVendor('inq-1', 'vendor-good', ` ${'a'.repeat(1200)} `);

    expect(chatRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      content: `Захиалга "Good Print" үйлдвэрт хуваарилагдлаа: ${'a'.repeat(1000)}`,
    }));
  });

  it('broadcasts only to assignable unique vendors', async () => {
    const { service, repo, notificationsGateway, mailService, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-incomplete',
          company_name: '',
          user_id: '',
          contact_email: '',
        },
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          contact_email: 'good@example.com',
        },
      ],
    });
    setInquiryToFind({
      id: '11111111-1111-4111-8111-111111111111',
      product_name: 'Баннер',
      quantity: 1,
    } as any);

    const result = await service.broadcastToVendors('11111111-1111-4111-8111-111111111111', [
      'vendor-incomplete',
      'vendor-good',
      'vendor-good',
    ]);

    expect(repo.update).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', expect.objectContaining({
      broadcast_vendor_ids: ['vendor-good'],
      status: InquiryStatus.REVIEWING,
    }));
    expect(notificationsGateway.notifyVendorNewInquiry).toHaveBeenCalledTimes(1);
    expect(notificationsGateway.notifyVendorNewInquiry).toHaveBeenCalledWith('user-good', expect.objectContaining({
      id: '11111111-1111-4111-8111-111111111111',
      is_broadcast: true,
    }));
    expect(mailService.sendVendorNewInquiry).toHaveBeenCalledWith(
      { email: 'good@example.com', name: 'Good Print' },
      expect.objectContaining({ id: '11111111-1111-4111-8111-111111111111' }),
    );
    expect(result).toMatchObject({
      ok: true,
      vendorCount: 1,
      eligibleVendorCount: 2,
      requestedVendorCount: 3,
      skippedVendorCount: 2,
    });
  });

  it('sanitizes broadcast vendor email payload fields', async () => {
    const { service, mailService, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        contact_email: 'good@example.com',
        services: ['banner'],
      }],
    });
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id: '../dirty-inq',
      category: 'banner',
      product_name: ' Banner\u0007 Deluxe ',
      quantity: ['10'],
      estimated_price: { value: 107982 },
      customer_name: ' Test\u0007 User ',
    } as any);

    await service.broadcastToVendors(` ${id} `, ['vendor-good']);

    expect(mailService.sendVendorNewInquiry).toHaveBeenCalledWith(
      { email: 'good@example.com', name: 'Good Print' },
      expect.objectContaining({
        id,
        productName: 'Banner Deluxe',
        quantity: 0,
        estimatedPrice: 0,
        customerName: 'Test User',
      }),
    );
  });

  it('rejects broadcast for started, completed, or cancelled inquiries', async () => {
    const { service, repo, notificationsGateway, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        contact_email: '',
      }],
    });
    const id = '11111111-1111-4111-8111-111111111111';

    for (const status of [InquiryStatus.IN_WORK, InquiryStatus.COMPLETED, InquiryStatus.CANCELLED]) {
      repo.update.mockClear();
      notificationsGateway.notifyVendorNewInquiry.mockClear();
      setInquiryToFind({ id, product_name: 'Banner', quantity: 1, status } as any);

      await expect(service.broadcastToVendors(id, ['vendor-good'])).rejects.toThrow('broadcast');

      expect(repo.update).not.toHaveBeenCalled();
      expect(notificationsGateway.notifyVendorNewInquiry).not.toHaveBeenCalled();
    }
  });

  it('normalizes broadcast inquiry ids before lookup and update', async () => {
    const { service, repo, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        contact_email: '',
      }],
    });
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({ id, product_name: 'Баннер', quantity: 1 } as any);

    await service.broadcastToVendors(` ${id} `, ['vendor-good']);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id } });
    expect(repo.update).toHaveBeenCalledWith(id, expect.objectContaining({
      broadcast_vendor_ids: ['vendor-good'],
    }));
  });

  it('skips broadcast vendors below their floor price', async () => {
    const { service, repo, notificationsGateway, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-expensive',
          company_name: 'Expensive Print',
          user_id: 'user-expensive',
          contact_email: '',
          floor_prices: { banner: 200000 },
          commission_rate: 15,
        },
        {
          id: 'vendor-good',
          company_name: 'Good Print',
          user_id: 'user-good',
          contact_email: '',
          floor_prices: { banner: 1000 },
          commission_rate: 15,
        },
      ],
    });
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      estimated_price: 107982,
    } as any);

    const result = await service.broadcastToVendors(id, ['vendor-expensive', 'vendor-good']);

    expect(repo.update).toHaveBeenCalledWith(id, expect.objectContaining({
      broadcast_vendor_ids: ['vendor-good'],
      status: InquiryStatus.REVIEWING,
    }));
    expect(notificationsGateway.notifyVendorNewInquiry).toHaveBeenCalledTimes(1);
    expect(notificationsGateway.notifyVendorNewInquiry).toHaveBeenCalledWith('user-good', expect.objectContaining({ is_broadcast: true }));
    expect(result).toMatchObject({ ok: true, vendorCount: 1, skippedVendorCount: 1 });
  });

  it('skips broadcast vendors with floor prices when inquiry price is missing', async () => {
    const { service, repo, notificationsGateway, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-priced',
          company_name: 'Priced Print',
          user_id: 'user-priced',
          contact_email: '',
          services: ['banner'],
          floor_prices: { banner: 1000 },
          commission_rate: 15,
        },
        {
          id: 'vendor-open',
          company_name: 'Open Print',
          user_id: 'user-open',
          contact_email: '',
          services: ['banner'],
          floor_prices: {},
          commission_rate: 15,
        },
      ],
    });
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      estimated_price: null,
      quoted_price: null,
    } as any);

    const result = await service.broadcastToVendors(id, ['vendor-priced', 'vendor-open']);

    expect(repo.update).toHaveBeenCalledWith(id, expect.objectContaining({
      broadcast_vendor_ids: ['vendor-open'],
      status: InquiryStatus.REVIEWING,
    }));
    expect(notificationsGateway.notifyVendorNewInquiry).toHaveBeenCalledTimes(1);
    expect(notificationsGateway.notifyVendorNewInquiry).toHaveBeenCalledWith('user-open', expect.objectContaining({ is_broadcast: true }));
    expect(result).toMatchObject({ ok: true, vendorCount: 1, skippedVendorCount: 1 });
  });

  it('skips broadcast vendors whose services do not match the inquiry product', async () => {
    const { service, repo, notificationsGateway, setInquiryToFind } = makeService({
      vendors: [
        {
          id: 'vendor-sticker',
          company_name: 'Sticker Print',
          user_id: 'user-sticker',
          contact_email: '',
          services: ['sticker'],
        },
        {
          id: 'vendor-banner',
          company_name: 'Banner Print',
          user_id: 'user-banner',
          contact_email: '',
          services: ['banner'],
        },
      ],
    });
    const id = '11111111-1111-4111-8111-111111111111';
    setInquiryToFind({
      id,
      category: 'banner',
      product_name: 'Banner',
      quantity: 1,
      estimated_price: 107982,
    } as any);

    const result = await service.broadcastToVendors(id, ['vendor-sticker', 'vendor-banner']);

    expect(repo.update).toHaveBeenCalledWith(id, expect.objectContaining({
      broadcast_vendor_ids: ['vendor-banner'],
      status: InquiryStatus.REVIEWING,
    }));
    expect(notificationsGateway.notifyVendorNewInquiry).toHaveBeenCalledTimes(1);
    expect(notificationsGateway.notifyVendorNewInquiry).toHaveBeenCalledWith('user-banner', expect.objectContaining({ is_broadcast: true }));
    expect(result).toMatchObject({ ok: true, vendorCount: 1, skippedVendorCount: 1 });
  });

  it('rejects unsafe broadcast inquiry ids before lookup', async () => {
    const { service, repo, vendorRepo } = makeService();

    await expect(service.broadcastToVendors('../11111111-1111-4111-8111-111111111111', ['vendor-good'])).rejects.toThrow('ID');
    await expect(service.broadcastToVendors(['11111111-1111-4111-8111-111111111111'] as any, ['vendor-good'])).rejects.toThrow('ID');

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(vendorRepo.findOne).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('returns an error for non-array vendor broadcast ids before vendor lookups', async () => {
    const { service, repo, vendorRepo } = makeService();

    await expect(service.broadcastToVendors('11111111-1111-4111-8111-111111111111', { id: 'vendor-good' } as any))
      .resolves.toMatchObject({ error: expect.any(String) });
    await expect(service.broadcastToVendors('11111111-1111-4111-8111-111111111111', []))
      .resolves.toMatchObject({ error: expect.any(String) });

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(vendorRepo.findOne).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('returns an error for oversized vendor broadcast lists before inquiry lookup', async () => {
    const { service, repo, vendorRepo } = makeService();

    await expect(service.broadcastToVendors(
      '11111111-1111-4111-8111-111111111111',
      Array.from({ length: 51 }, (_, index) => `vendor-${index}`),
    )).resolves.toMatchObject({ error: 'vendorIds 50-аас их байж болохгүй' });

    expect(repo.findOne).not.toHaveBeenCalled();
    expect(vendorRepo.findOne).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('normalizes vendor broadcast ids before vendor lookups', async () => {
    const { service, repo, vendorRepo, setInquiryToFind } = makeService({
      vendors: [{
        id: 'vendor-good',
        company_name: 'Good Print',
        user_id: 'user-good',
        contact_email: '',
      }],
    });
    setInquiryToFind({
      id: '11111111-1111-4111-8111-111111111111',
      product_name: 'Баннер',
      quantity: 1,
    } as any);

    const result = await service.broadcastToVendors('11111111-1111-4111-8111-111111111111', [
      ' vendor-good ',
      '',
      'x'.repeat(121),
      '../vendor-bad',
      'vendor\u0007-bad',
      'vendor-good',
    ]);

    expect(repo.update).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', expect.objectContaining({
      broadcast_vendor_ids: ['vendor-good'],
    }));
    expect(vendorRepo.findOne).toHaveBeenCalledTimes(1);
    expect(vendorRepo.findOne).toHaveBeenCalledWith({ where: { id: 'vendor-good' } });
    expect(result).toMatchObject({
      ok: true,
      vendorCount: 1,
      eligibleVendorCount: 1,
      requestedVendorCount: 6,
      skippedVendorCount: 5,
    });
  });
});
