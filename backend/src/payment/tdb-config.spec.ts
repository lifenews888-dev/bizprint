import { loadTdbConfig, missingTdbQrEnv, missingTdbOAuthEnv } from './tdb-config'

describe('tdb-config (no hard-coded credentials)', () => {
  it('has no credential defaults when env is empty', () => {
    const cfg = loadTdbConfig({ NODE_ENV: 'production' } as any)
    expect(cfg.qrUser).toBe('')
    expect(cfg.qrPass).toBe('')
    expect(cfg.qrTerminal).toBe('')
    expect(cfg.qrBase).toBe('')
    expect(cfg.oauthUrl).toBe('')
    expect(missingTdbQrEnv(cfg)).toEqual(
      expect.arrayContaining(['TDB_QR_BASE', 'TDB_QR_USER', 'TDB_QR_PASS', 'TDB_QR_TERMINAL', 'TDB_BIZPRINT_ACCOUNT']),
    )
    expect(missingTdbOAuthEnv(cfg).length).toBe(3)
  })

  it('ignores TDB_SANDBOX in production', () => {
    const cfg = loadTdbConfig({ NODE_ENV: 'production', TDB_SANDBOX: 'true' } as any)
    expect(cfg.sandbox).toBe(false)
    expect(cfg.qrBase).toBe('')
  })

  it('sandbox only fills URLs, never credentials', () => {
    const cfg = loadTdbConfig({ NODE_ENV: 'development', TDB_SANDBOX: 'true' } as any)
    expect(cfg.sandbox).toBe(true)
    expect(cfg.qrBase).toMatch(/^https:\/\//)
    expect(cfg.qrUser).toBe('')
    expect(cfg.qrPass).toBe('')
    expect(missingTdbQrEnv(cfg)).toContain('TDB_QR_USER')
  })

  it('is fully configured from env and derives callback from BACKEND_URL', () => {
    const cfg = loadTdbConfig({
      NODE_ENV: 'production',
      TDB_QR_BASE: 'https://qr.example',
      TDB_QR_USER: 'u',
      TDB_QR_PASS: 'p',
      TDB_QR_TERMINAL: 't',
      TDB_BIZPRINT_ACCOUNT: 'a',
      BACKEND_URL: 'https://api.example/',
    } as any)
    expect(missingTdbQrEnv(cfg)).toEqual([])
    expect(cfg.callbackUrl).toBe('https://api.example/api/payment/callback')
  })
})
