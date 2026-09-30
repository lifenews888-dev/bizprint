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
