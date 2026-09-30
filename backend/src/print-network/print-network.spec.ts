import { deltaE2000, hexToLab, labToHex } from './color-math'
import { DeviceState, routeJob } from './routing'
import { buildJdf } from './jdf'
import { ticketFileName } from './print-network.service'

describe('color-math', () => {
  // Sharma, Wu, Dalal (2005) CIEDE2000 эталон утгууд
  const cases: [number, number, number, number, number, number, number][] = [
    [50, 2.6772, -79.7751, 50, 0, -82.7485, 2.0425],
    [50, 3.1571, -77.2803, 50, 0, -82.7485, 2.8615],
    [50, 0, 0, 50, -1, 2, 2.3669],
    [50, 2.5, 0, 73, 25, -18, 27.1492],
    [60.2574, -34.0099, 36.2677, 60.4626, -34.1751, 39.4387, 1.2644],
    [22.7233, 20.0904, -46.694, 23.0331, 14.973, -42.5619, 2.0373],
    [2.0776, 0.0795, -1.135, 0.9033, -0.0636, -0.5514, 0.9082],
  ]
  it.each(cases)('ΔE00 (%p,%p,%p) vs (%p,%p,%p) = %p', (l1, a1, b1, l2, a2, b2, expected) => {
    expect(deltaE2000({ l: l1, a: a1, b: b1 }, { l: l2, a: a2, b: b2 })).toBeCloseTo(expected, 4)
  })

  it('is symmetric and zero for identical colors', () => {
    const x = { l: 48, a: 73, b: 63 }
    const y = { l: 45, a: 70, b: 50 }
    expect(deltaE2000(x, x)).toBe(0)
    expect(deltaE2000(x, y)).toBeCloseTo(deltaE2000(y, x), 10)
  })

  it('converts hex ↔ Lab (D50)', () => {
    expect(hexToLab('#FFFFFF')).toEqual({ l: 100, a: 0, b: 0 })
    expect(hexToLab('#000000')).toEqual({ l: 0, a: 0, b: 0 })
    const red = hexToLab('#FF0000')
    expect(red.l).toBeCloseTo(54.29, 1)
    expect(red.a).toBeCloseTo(80.8, 0)
    expect(red.b).toBeCloseTo(69.89, 0)
    for (const hex of ['#FF6B00', '#0057B8', '#8B5CF6', '#1A1A1A']) expect(labToHex(hexToLab(hex))).toBe(hex)
  })
})

describe('routeJob', () => {
  const base = (over: Partial<DeviceState>): DeviceState => ({
    id: 'd', name: 'D', technology: 'dtf', status: 'active', productTypes: ['dtf_transfer'], media: [],
    maxWidthMm: 600, deltaETolerance: 3, online: true, queueLength: 0,
    profiles: new Map([['BP-R101', [{ media: '', deltaE: 1.2 }]], ['BP-B101', [{ media: '', deltaE: 2.1 }]]]),
    ...over,
  })

  const req = { productType: 'dtf_transfer', colorCodes: ['BP-R101', 'BP-B101'], widthMm: 300, heightMm: 400 }

  it('picks the least loaded capable device', () => {
    const r = routeJob([base({ id: 'a', queueLength: 3 }), base({ id: 'b', queueLength: 1 })], req)
    expect(r.chosen?.deviceId).toBe('b')
    expect(r.chosen?.maxDeltaE).toBe(2.1)
    expect(r.candidates).toHaveLength(2)
  })

  it('rejects devices with out-of-tolerance or uncalibrated colors', () => {
    const r = routeJob(
      [
        base({ id: 'far', profiles: new Map([['BP-R101', [{ media: '', deltaE: 4.5 }]], ['BP-B101', [{ media: '', deltaE: 1 }]]]) }),
        base({ id: 'missing', profiles: new Map([['BP-R101', [{ media: '', deltaE: 1 }]]]) }),
      ],
      req,
    )
    expect(r.chosen).toBeNull()
    expect(r.rejected.find((x) => x.deviceId === 'far')!.reasons[0]).toContain('BP-R101: ΔE 4.5')
    expect(r.rejected.find((x) => x.deviceId === 'missing')!.reasons[0]).toContain('BP-B101: калибровк')
  })

  it('rejects wrong product, paused device and too-wide jobs (rotation allowed)', () => {
    const r = routeJob(
      [
        base({ id: 'banner', productTypes: ['banner'] }),
        base({ id: 'paused', status: 'maintenance' }),
        base({ id: 'narrow', maxWidthMm: 250 }),
        base({ id: 'rotated', maxWidthMm: 320 }), // 300×400 → 300 богино тал багтана
      ],
      req,
    )
    expect(r.chosen?.deviceId).toBe('rotated')
    expect(r.rejected.map((x) => x.deviceId).sort()).toEqual(['banner', 'narrow', 'paused'])
  })

  it('prefers media-specific calibration over the generic one', () => {
    const d = base({
      media: ['cotton', 'polyester'],
      profiles: new Map([['BP-R101', [{ media: '', deltaE: 1 }, { media: 'polyester', deltaE: 5 }]]]),
    })
    const one = { productType: 'dtf_transfer', colorCodes: ['BP-R101'] }
    expect(routeJob([d], { ...one, media: 'cotton' }).chosen).not.toBeNull()
    expect(routeJob([d], { ...one, media: 'polyester' }).chosen).toBeNull()
    expect(routeJob([d], { ...one, media: 'vinyl' }).rejected[0].reasons[0]).toContain('материал')
  })

  it('ranks offline agents last', () => {
    const r = routeJob([base({ id: 'off', online: false }), base({ id: 'on', queueLength: 5 })], req)
    expect(r.chosen?.deviceId).toBe('on')
  })
})

describe('buildJdf', () => {
  it('produces a JDF with spot colors, media and quantity; escapes XML', () => {
    const xml = buildJdf({
      ticketId: 't-1', orderId: 'o-1', orderNumber: 'INV<1>', productType: 'dtf_transfer', quantity: 25,
      widthMm: 254, heightMm: 254, media: 'pet_film', fileUrl: 'https://x/y.pdf', fileName: 'INV_1_t-1.pdf',
      colors: [{ code: 'BP-R101', name: 'Улаан -- тод', lab: { l: 48.11, a: 73.05, b: 63.6 } }],
      device: { id: 'd', name: 'Epson F2100', technology: 'dtf' },
    })
    expect(xml).toContain('JobID="INV&lt;1&gt;"')
    expect(xml).toContain('<Color Name="BP-R101" ActualName="BP-R101" Lab="48.11 73.05 63.6"')
    expect(xml).toContain('<SeparationSpec Name="BP-R101"/>')
    expect(xml).toContain('Amount="25"')
    expect(xml).toContain('Dimension="720.00 720.00"')
    expect(xml).not.toMatch(/<!--[^>]*--[^>]*-->/)
  })
})

describe('ticketFileName', () => {
  it('keeps the source extension and sanitizes the prefix', () => {
    expect(ticketFileName('INV/2026 01', 'abcdef123456', 'https://res.cloudinary.com/a/b/file.PNG?x=1')).toBe('INV_2026_01_abcdef12.png')
    expect(ticketFileName('X', 'abcdef123456', 'not a url')).toBe('X_abcdef12.pdf')
  })
})

describe('PrintNetworkSeedService', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrintNetworkSeedService } = require('./print-network-seed.service')
  const { SEED_COLORS, SEED_PRODUCT_TYPES } = require('./seed-data')
  const repo = (count: number) => ({ count: jest.fn(async () => count), insert: jest.fn(async () => ({})) })

  it('seeds only empty tables', async () => {
    const colors = repo(0)
    const types = repo(3)
    await new PrintNetworkSeedService(colors, types).onApplicationBootstrap()
    expect(colors.insert).toHaveBeenCalledWith(SEED_COLORS)
    expect(types.insert).not.toHaveBeenCalled()
    expect(SEED_COLORS).toHaveLength(32)
    expect(SEED_PRODUCT_TYPES.map((t: any) => t.key)).toContain('dtf_transfer')
  })

  it('never throws on DB errors', async () => {
    const broken = { count: jest.fn(async () => { throw new Error('relation does not exist') }), insert: jest.fn() }
    await expect(new PrintNetworkSeedService(broken, broken).onApplicationBootstrap()).resolves.toBeUndefined()
  })

  it('seed Lab values match the hex they were derived from', () => {
    for (const c of SEED_COLORS) {
      const lab = hexToLab(c.hex)
      expect([c.labL, c.labA, c.labB]).toEqual([lab.l, lab.a, lab.b])
    }
  })
})

describe('safeUploadedFileUrl', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { safeUploadedFileUrl } = require('./print-network.service')
  const os = require('os')
  const fsx = require('fs')
  const pathx = require('path')
  const root = fsx.mkdtempSync(pathx.join(os.tmpdir(), 'bp-up-'))
  fsx.mkdirSync(pathx.join(root, 'print-files'))
  fsx.writeFileSync(pathx.join(root, 'print-files', '1-abc.pdf'), '%PDF')
  fsx.writeFileSync(pathx.join(root, '2-web.PNG'), 'x')
  fsx.writeFileSync(pathx.join(root, 'evil.hta'), 'x')

  it('accepts only existing print files under /uploads', () => {
    expect(safeUploadedFileUrl('/uploads/print-files/1-abc.pdf', root)).toBe('/uploads/print-files/1-abc.pdf')
    expect(safeUploadedFileUrl('/uploads/2-web.PNG', root)).toBe('/uploads/2-web.PNG')
    for (const bad of [
      'http://192.168.1.1/admin.pdf', 'https://evil.example/x.pdf', 'file:///C:/Windows/win.ini',
      '/uploads/evil.hta', '/uploads/../.env', '/uploads/print-files/../../x.pdf', '/uploads/print-files/missing.pdf',
      '//evil.example/uploads/x.pdf', '/uploads/inquiries/a.pdf',
    ]) expect(safeUploadedFileUrl(bad, root)).toBeNull()
  })

  it('ticketFileName never keeps a dangerous extension', () => {
    expect(ticketFileName('INV', 'abcdef123456', 'https://evil/x.hta')).toBe('INV_abcdef12.pdf')
    expect(ticketFileName('INV', 'abcdef123456', '/uploads/print-files/a.TIF')).toBe('INV_abcdef12.tif')
  })
})

describe('dispatchOrder (security)', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrintNetworkService } = require('./print-network.service')
  const fsx = require('fs')

  function build(itemSpecs: any, productId = 'prod-cheap') {
    const inserted: any[] = []
    const repo = (over: any = {}) => ({ find: jest.fn(async () => []), findOne: jest.fn(async () => null), ...over })
    const svc = new PrintNetworkService(
      repo({ find: jest.fn(async () => [{ id: 'c1', code: 'BP-R101', name: 'Улаан', labL: 48, labA: 73, labB: 63, isActive: true }]) }),
      repo({ find: jest.fn(async () => [{ id: 'd1', name: 'F2100', technology: 'dtf', agentId: null, hotfolderKey: 'k' }]) }),
      repo(), repo(),
      repo({ find: jest.fn(async () => []), create: (x: any) => x, insert: jest.fn(async (x: any) => { inserted.push(x) }) }),
      repo({ findOne: jest.fn(async () => ({ id: 'o1', status: 'confirmed', invoice_no: 'INV-1', quantity: 1 })) }),
      repo({ find: jest.fn(async () => [{ id: 'i1', product_id: productId, quantity: 3, specs: itemSpecs }]) }),
      repo({ find: jest.fn(async () => [{ key: 'dtf_transfer', productId: 'prod-dtf', isActive: true }]) }),
      { query: jest.fn(async () => []) },
    )
    jest.spyOn(svc, 'loadDeviceStates').mockResolvedValue([{
      id: 'd1', name: 'F2100', technology: 'dtf', status: 'active', productTypes: ['dtf_transfer', 'uv_print'], media: [],
      maxWidthMm: 600, deltaETolerance: 3, online: true, queueLength: 0,
      profiles: new Map([['BP-R101', [{ media: '', deltaE: 1 }]]]),
    }])
    return { svc, inserted }
  }
  const existsSpy = jest.spyOn(fsx, 'existsSync')
  afterAll(() => existsSpy.mockRestore())

  it('uses the paid product mapping and ignores spoofed specs', async () => {
    existsSpy.mockReturnValue(true)
    const { svc, inserted } = build({ productType: 'uv_print', color_codes: ['bp-r101'], file_url: '/uploads/print-files/1-a.pdf' }, 'prod-dtf')
    const r = await svc.dispatchOrder('o1', {})
    expect(r.created).toHaveLength(1)
    expect(inserted[0].payload.productType).toBe('dtf_transfer')
    expect(inserted[0].jdf).toContain('BP-R101')
    expect(inserted[0].id).toBe(inserted[0].payload.ticketId)
  })

  it('refuses unmapped products and foreign file URLs', async () => {
    existsSpy.mockReturnValue(true)
    let { svc } = build({ productType: 'dtf_transfer', file_url: '/uploads/print-files/1-a.pdf' }, 'prod-cheap')
    expect((await svc.dispatchOrder('o1', {})).skipped[0].reason).toMatch(/холбогдоогүй/)
    ;({ svc } = build({ file_url: 'http://192.168.1.10/x.pdf', color_codes: 'BP-R101' }, 'prod-dtf'))
    const r = await svc.dispatchOrder('o1', {})
    expect(r.created).toHaveLength(0)
    expect(r.skipped[0].reason).toMatch(/файл буруу/)
  })

  it('silently skips non-print items', async () => {
    const { svc } = build({ size: 'A4' }, 'prod-cheap')
    const r = await svc.dispatchOrder('o1', {})
    expect(r).toMatchObject({ created: [], skipped: [], nonPrintItems: 1 })
  })
})
